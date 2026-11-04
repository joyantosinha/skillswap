from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db, bcrypt
from app.models import (User, Profile, Skill, MatchRecommendation, Connection, Follow,
                        ChatConversation, Message, LearningSession, Notification,
                        user_teach_skills, user_learn_skills)
from app.ai import generate_matches, save_match_recommendations, generate_intro_message, get_learning_assistant_response
from datetime import datetime, timedelta
import os, uuid

bp = Blueprint('api', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def user_not_found():
    return jsonify({'error': 'User not found'}), 404

# ---------- Auth ----------
@bp.route('/auth/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    full_name = (data.get('full_name') or '').strip()

    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(username=username, email=email, full_name=full_name or username)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    profile = Profile(user_id=user.id)
    db.session.add(profile)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'token': token,
        'user': user.to_dict(),
        'message': 'Account created successfully'
    }), 201

@bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    user.is_online = True
    user.last_seen = datetime.utcnow()
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'token': token,
        'user': user.to_dict(),
        'message': 'Logged in successfully'
    })

@bp.route('/auth/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return user_not_found()
    return jsonify({'user': user.to_dict()})

# ---------- Skills ----------
@bp.route('/skills', methods=['GET'])
def list_skills():
    skills = Skill.query.order_by(Skill.name).all()
    return jsonify({'skills': [s.to_dict() for s in skills]})

# ---------- Users / Profiles ----------
@bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    users = User.query.filter(User.id != int(get_jwt_identity())).all()
    return jsonify({'users': [u.to_dict() for u in users]})

@bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return user_not_found()
    return jsonify({'user': user.to_dict()})

@bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return user_not_found()

    if request.method == 'GET':
        return jsonify({
            'user': user.to_dict(),
            'profile': user.profile.to_dict() if user.profile else None,
            'teach_skills': [s.to_dict() for s in user.skills_teach],
            'learn_skills': [s.to_dict() for s in user.skills_learn],
        })

    data = request.get_json() or {}
    updatable = ['full_name', 'age_range', 'experience_level', 'availability',
                 'preferred_method', 'additional_preferences', 'teach_only_mode']
    for field in updatable:
        if field in data:
            setattr(user, field, data[field])

    if 'profile_picture' in data:
        user.profile_picture = data['profile_picture']

    # Recompute completion
    completion = 0
    if user.full_name: completion += 15
    if user.age_range: completion += 10
    if user.profile_picture: completion += 15
    if user.experience_level: completion += 15
    if user.skills_teach: completion += 20
    if user.skills_learn: completion += 15
    if user.availability: completion += 5
    if user.preferred_method: completion += 5
    user.profile_completion = min(completion, 100)

    # Handle skills
    if 'teach_skill_ids' in data:
        ids = data['teach_skill_ids']
        user.skills_teach = Skill.query.filter(Skill.id.in_(ids)).all() if ids else []
    if 'learn_skill_ids' in data:
        ids = data['learn_skill_ids']
        user.skills_learn = Skill.query.filter(Skill.id.in_(ids)).all() if ids else []

    db.session.commit()
    return jsonify({'user': user.to_dict(), 'message': 'Profile updated'})

@bp.route('/profile/picture', methods=['POST'])
@jwt_required()
def upload_picture():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return user_not_found()
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        file.save(os.path.join(upload_folder, filename))
        user.profile_picture = f"/api/uploads/{filename}"
        db.session.commit()
        return jsonify({'profile_picture': user.profile_picture})
    return jsonify({'error': 'Invalid file type'}), 400

@bp.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

# ---------- Matchmaking ----------
@bp.route('/matches', methods=['GET'])
@jwt_required()
def get_matches():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return user_not_found()

    matches = generate_matches(user)
    save_match_recommendations(user, matches)

    result = []
    for m in matches:
        other = m['user']
        result.append({
            'id': m['user'].id,
            'name': other.full_name or other.username,
            'username': other.username,
            'profile_picture': other.profile_picture,
            'age_range': other.age_range,
            'experience_level': other.experience_level,
            'availability': other.availability,
            'preferred_method': other.preferred_method,
            'teach_skills': [s.to_dict() for s in other.skills_teach],
            'learn_skills': [s.to_dict() for s in other.skills_learn],
            'compatibility_score': m['score'],
            'match_reason': m['reason'],
            'skills_exchanged': m['exchanged'],
            'is_online': other.is_online,
        })
    return jsonify({'matches': result})

@bp.route('/matches/recommendations', methods=['GET'])
@jwt_required()
def stored_recommendations():
    user_id = int(get_jwt_identity())
    recs = MatchRecommendation.query.filter_by(user1_id=user_id).order_by(
        MatchRecommendation.compatibility_score.desc()).all()
    result = []
    for r in recs:
        other = User.query.get(r.user2_id)
        if not other:
            continue
        result.append({
            'id': r.id,
            'name': other.full_name or other.username,
            'profile_picture': other.profile_picture,
            'experience_level': other.experience_level,
            'teach_skills': [s.to_dict() for s in other.skills_teach],
            'learn_skills': [s.to_dict() for s in other.skills_learn],
            'compatibility_score': r.compatibility_score,
            'match_reason': r.match_reason,
            'skills_exchanged': r.skills_exchanged,
            'status': r.status,
            'is_online': other.is_online,
        })
    return jsonify({'recommendations': result})

@bp.route('/matches/<int:other_user_id>/intro', methods=['POST'])
@jwt_required()
def generate_intro(other_user_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    other = User.query.get(other_user_id)
    if not user or not other:
        return user_not_found()

    # Find exchanged skills
    user_learn = {s.id for s in user.skills_learn}
    other_teach = {s.id for s in other.skills_teach}
    shared = user_learn & other_teach
    other_learn = {s.id for s in other.skills_learn}
    user_teach = {s.id for s in user.skills_teach}
    shared |= (other_learn & user_teach)
    exchanged = ', '.join(s.name for s in Skill.query.filter(Skill.id.in_(shared)).all()) if shared else 'skills'

    message = generate_intro_message(user, other, exchanged)
    return jsonify({'message': message})

# ---------- Connections ----------
@bp.route('/connections', methods=['GET'])
@jwt_required()
def list_connections():
    user_id = int(get_jwt_identity())
    conns = Connection.query.filter(
        (Connection.user1_id == user_id) | (Connection.user2_id == user_id)
    ).all()
    result = []
    for c in conns:
        other_id = c.user2_id if c.user1_id == user_id else c.user1_id
        other = User.query.get(other_id)
        result.append({
            'id': c.id,
            'other_user': other.to_dict() if other else None,
            'status': c.status,
            'initiated_by': c.initiated_by,
            'is_initiator': c.initiated_by == user_id,
            'created_at': c.created_at.isoformat() if c.created_at else None,
        })
    return jsonify({'connections': result})

@bp.route('/connections', methods=['POST'])
@jwt_required()
def send_connection():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    other_id = data.get('user_id')
    if not other_id:
        return jsonify({'error': 'user_id required'}), 400
    other = User.query.get(other_id)
    if not other:
        return user_not_found()
    if int(other_id) == user_id:
        return jsonify({'error': 'Cannot connect with yourself'}), 400

    u1, u2 = sorted([user_id, other_id])
    existing = Connection.query.filter_by(user1_id=u1, user2_id=u2).first()
    if existing:
        return jsonify({'error': 'Connection already exists', 'connection': existing.to_dict()}), 409

    conn = Connection(user1_id=u1, user2_id=u2, initiated_by=user_id, status='pending')
    db.session.add(conn)

    current_user = User.query.get(user_id)
    notif = Notification(
        user_id=other_id,
        title='New Connection Request',
        message=f'{current_user.full_name or current_user.username} wants to connect with you.',
        type='connection',
        link='/connections'
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'connection': conn.to_dict(), 'message': 'Connection request sent'}), 201

@bp.route('/connections/<int:conn_id>/respond', methods=['POST'])
@jwt_required()
def respond_connection(conn_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    action = data.get('action')  # accept or reject
    conn = Connection.query.get(conn_id)
    if not conn:
        return jsonify({'error': 'Connection not found'}), 404
    if conn.user2_id != user_id and conn.user1_id != user_id:
        return jsonify({'error': 'Not authorized'}), 403

    if action == 'accept':
        conn.status = 'accepted'
        # Create conversation
        u1, u2 = sorted([conn.user1_id, conn.user2_id])
        conv = ChatConversation.query.filter_by(user1_id=u1, user2_id=u2).first()
        if not conv:
            conv = ChatConversation(user1_id=u1, user2_id=u2)
            db.session.add(conv)
            db.session.flush()
            # AI opening message
            u1obj = User.query.get(u1)
            u2obj = User.query.get(u2)
            intro = generate_intro_message(u1obj, u2obj, 'skills')
            msg = Message(conversation_id=conv.id, sender_id=u1, content=intro, ai_generated=True)
            db.session.add(msg)

        current_user = User.query.get(user_id)
        notif = Notification(
            user_id=conn.initiated_by,
            title='Connection Accepted',
            message=f'{current_user.full_name or current_user.username} accepted your connection request.',
            type='connection',
            link='/chat'
        )
        db.session.add(notif)
    elif action == 'reject':
        conn.status = 'rejected'
    else:
        return jsonify({'error': 'Invalid action'}), 400

    db.session.commit()
    return jsonify({'connection': conn.to_dict(), 'message': f'Connection {action}ed'})

# ---------- Follows ----------
@bp.route('/follows', methods=['GET'])
@jwt_required()
def list_follows():
    user_id = int(get_jwt_identity())
    following = Follow.query.filter_by(follower_id=user_id).all()
    followers = Follow.query.filter_by(followed_id=user_id).all()
    return jsonify({
        'following': [f.to_dict() for f in following],
        'followers': [f.to_dict() for f in followers],
    })

@bp.route('/follows', methods=['POST'])
@jwt_required()
def follow_user():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    target_id = data.get('user_id')
    if not target_id:
        return jsonify({'error': 'user_id required'}), 400
    if int(target_id) == user_id:
        return jsonify({'error': 'Cannot follow yourself'}), 400
    target = User.query.get(target_id)
    if not target:
        return user_not_found()

    existing = Follow.query.filter_by(follower_id=user_id, followed_id=target_id).first()
    if existing:
        return jsonify({'error': 'Already following'}), 409

    f = Follow(follower_id=user_id, followed_id=target_id)
    db.session.add(f)

    notif = Notification(
        user_id=target_id,
        title='New Follower',
        message=f'{user.full_name or user.username} started following you.',
        type='info',
        link='/profile'
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'follow': f.to_dict(), 'message': 'Now following'}), 201

@bp.route('/follows/<int:target_id>', methods=['DELETE'])
@jwt_required()
def unfollow_user(target_id):
    user_id = int(get_jwt_identity())
    f = Follow.query.filter_by(follower_id=user_id, followed_id=target_id).first()
    if not f:
        return jsonify({'error': 'Not following'}), 404
    db.session.delete(f)
    db.session.commit()
    return jsonify({'message': 'Unfollowed'})

# ---------- Chat ----------
@bp.route('/chat/conversations', methods=['GET'])
@jwt_required()
def list_conversations():
    user_id = int(get_jwt_identity())
    convs = ChatConversation.query.filter(
        (ChatConversation.user1_id == user_id) | (ChatConversation.user2_id == user_id)
    ).order_by(ChatConversation.updated_at.desc()).all()
    result = []
    for c in convs:
        other_id = c.user2_id if c.user1_id == user_id else c.user1_id
        other = User.query.get(other_id)
        last = Message.query.filter_by(conversation_id=c.id).order_by(Message.created_at.desc()).first()
        result.append({
            'id': c.id,
            'other_user': other.to_dict() if other else None,
            'last_message': last.to_dict() if last else None,
            'unread_count': Message.query.filter_by(conversation_id=c.id, is_read=False).filter(Message.sender_id != user_id).count(),
            'updated_at': c.updated_at.isoformat() if c.updated_at else None,
        })
    return jsonify({'conversations': result})

@bp.route('/chat/conversations/<int:conv_id>/messages', methods=['GET'])
@jwt_required()
def get_messages(conv_id):
    user_id = int(get_jwt_identity())
    conv = ChatConversation.query.get(conv_id)
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404
    if conv.user1_id != user_id and conv.user2_id != user_id:
        return jsonify({'error': 'Not authorized'}), 403

    msgs = Message.query.filter_by(conversation_id=conv_id).order_by(Message.created_at.asc()).all()
    # Mark as read
    Message.query.filter_by(conversation_id=conv_id, is_read=False).filter(Message.sender_id != user_id).update({Message.is_read: True})
    db.session.commit()
    return jsonify({'messages': [m.to_dict() for m in msgs], 'conversation': conv.to_dict()})

@bp.route('/chat/conversations/<int:conv_id>/messages', methods=['POST'])
@jwt_required()
def send_message(conv_id):
    user_id = int(get_jwt_identity())
    conv = ChatConversation.query.get(conv_id)
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404
    if conv.user1_id != user_id and conv.user2_id != user_id:
        return jsonify({'error': 'Not authorized'}), 403

    data = request.get_json() or {}
    content = (data.get('content') or '').strip()
    if not content:
        return jsonify({'error': 'Message content required'}), 400

    msg = Message(conversation_id=conv_id, sender_id=user_id, content=content, ai_generated=False)
    db.session.add(msg)
    conv.updated_at = datetime.utcnow()

    other_id = conv.user2_id if conv.user1_id == user_id else conv.user1_id
    notif = Notification(
        user_id=other_id,
        title='New Message',
        message=f'{user.full_name or user.username} sent you a message.',
        type='message',
        link=f'/chat/{conv_id}'
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'message': msg.to_dict()}), 201

@bp.route('/chat/start/<int:other_user_id>', methods=['POST'])
@jwt_required()
def start_chat(other_user_id):
    user_id = int(get_jwt_identity())
    other = User.query.get(other_user_id)
    if not other:
        return user_not_found()

    # Require accepted connection
    u1, u2 = sorted([user_id, other_user_id])
    conn = Connection.query.filter_by(user1_id=u1, user2_id=u2, status='accepted').first()
    if not conn:
        return jsonify({'error': 'You can only chat with accepted connections'}), 403

    conv = ChatConversation.query.filter_by(user1_id=u1, user2_id=u2).first()
    if not conv:
        conv = ChatConversation(user1_id=u1, user2_id=u2)
        db.session.add(conv)
        db.session.flush()
        u1obj = User.query.get(u1)
        u2obj = User.query.get(u2)
        intro = generate_intro_message(u1obj, u2obj, 'skills')
        msg = Message(conversation_id=conv.id, sender_id=u1, content=intro, ai_generated=True)
        db.session.add(msg)
        db.session.commit()
    return jsonify({'conversation': conv.to_dict()})

# ---------- Sessions ----------
@bp.route('/sessions', methods=['GET', 'POST'])
@jwt_required()
def sessions():
    user_id = int(get_jwt_identity())
    if request.method == 'GET':
        qs = LearningSession.query.filter(
            (LearningSession.learner_id == user_id) | (LearningSession.teacher_id == user_id)
        ).order_by(LearningSession.scheduled_at.desc()).all()
        return jsonify({'sessions': [s.to_dict() for s in qs]})

    data = request.get_json() or {}
    required = ['teacher_id', 'skill_id', 'title', 'scheduled_at']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} required'}), 400

    try:
        scheduled = datetime.fromisoformat(data['scheduled_at'])
    except Exception:
        return jsonify({'error': 'Invalid scheduled_at format'}), 400

    sess = LearningSession(
        learner_id=user_id,
        teacher_id=data['teacher_id'],
        skill_id=data['skill_id'],
        title=data['title'],
        description=data.get('description'),
        scheduled_at=scheduled,
        duration_minutes=data.get('duration_minutes', 60),
        session_objectives=data.get('session_objectives'),
        meeting_link=data.get('meeting_link'),
        status='scheduled',
    )
    db.session.add(sess)

    notif = Notification(
        user_id=data['teacher_id'],
        title='New Session Request',
        message=f'{user.full_name or user.username} scheduled a session: {data["title"]}',
        type='session',
        link='/sessions'
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'session': sess.to_dict(), 'message': 'Session scheduled'}), 201

@bp.route('/sessions/<int:session_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def manage_session(session_id):
    user_id = int(get_jwt_identity())
    sess = LearningSession.query.get(session_id)
    if not sess:
        return jsonify({'error': 'Session not found'}), 404
    if sess.learner_id != user_id and sess.teacher_id != user_id:
        return jsonify({'error': 'Not authorized'}), 403

    if request.method == 'DELETE':
        sess.status = 'cancelled'
        db.session.commit()
        return jsonify({'message': 'Session cancelled'})

    data = request.get_json() or {}
    if 'status' in data:
        sess.status = data['status']
    if 'title' in data:
        sess.title = data['title']
    if 'description' in data:
        sess.description = data['description']
    if 'scheduled_at' in data:
        try:
            sess.scheduled_at = datetime.fromisoformat(data['scheduled_at'])
        except Exception:
            return jsonify({'error': 'Invalid scheduled_at'}), 400
    if 'session_objectives' in data:
        sess.session_objectives = data['session_objectives']
    if 'meeting_link' in data:
        sess.meeting_link = data['meeting_link']
    db.session.commit()
    return jsonify({'session': sess.to_dict(), 'message': 'Session updated'})

# ---------- Notifications ----------
@bp.route('/notifications', methods=['GET'])
@jwt_required()
def notifications():
    user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify({'notifications': [n.to_dict() for n in notifs]})

@bp.route('/notifications/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notif_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.get(notif_id)
    if not notif or notif.user_id != user_id:
        return jsonify({'error': 'Not found'}), 404
    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked read'})

# ---------- Dashboard ----------
@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return user_not_found()

    pending_conns = Connection.query.filter(
        ((Connection.user1_id == user_id) | (Connection.user2_id == user_id)) &
        (Connection.status == 'pending')
    ).all()

    unread_notifs = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    upcoming = LearningSession.query.filter(
        ((LearningSession.learner_id == user_id) | (LearningSession.teacher_id == user_id)) &
        (LearningSession.status == 'scheduled') &
        (LearningSession.scheduled_at >= datetime.utcnow())
    ).order_by(LearningSession.scheduled_at.asc()).limit(5).all()

    following_count = Follow.query.filter_by(follower_id=user_id).count()
    followers_count = Follow.query.filter_by(followed_id=user_id).count()

    return jsonify({
        'user': user.to_dict(),
        'profile_completion': user.profile_completion,
        'pending_connections': len(pending_conns),
        'unread_notifications': unread_notifs,
        'following_count': following_count,
        'followers_count': followers_count,
        'upcoming_sessions': [s.to_dict() for s in upcoming],
    })

# ---------- AI Assistant ----------
@bp.route('/ai/assistant', methods=['POST'])
@jwt_required()
def ai_assistant():
    data = request.get_json() or {}
    message = data.get('message', '')
    response = get_learning_assistant_response(message)
    return jsonify({'response': response})
