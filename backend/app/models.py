from datetime import datetime
from app import db

# Association tables
user_teach_skills = db.Table('user_teach_skills',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skill.id'), primary_key=True)
)

user_learn_skills = db.Table('user_learn_skills',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('skill_id', db.Integer, db.ForeignKey('skill.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=True)
    age_range = db.Column(db.String(20), nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    experience_level = db.Column(db.String(20), nullable=True)  # beginner, intermediate, advanced
    availability = db.Column(db.String(200), nullable=True)
    preferred_method = db.Column(db.String(50), nullable=True)  # online, chat, video_call
    additional_preferences = db.Column(db.Text, nullable=True)
    teach_only_mode = db.Column(db.Boolean, default=False)
    is_online = db.Column(db.Boolean, default=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    profile_completion = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete-orphan')
    skills_teach = db.relationship('Skill', secondary=user_teach_skills,
        lazy='subquery', backref=db.backref('teachers', lazy=True))
    skills_learn = db.relationship('Skill', secondary=user_learn_skills,
        lazy='subquery', backref=db.backref('learners', lazy=True))
    matches_as_user1 = db.relationship('MatchRecommendation', foreign_keys='MatchRecommendation.user1_id',
        backref='user1', lazy='dynamic', cascade='all, delete-orphan')
    matches_as_user2 = db.relationship('MatchRecommendation', foreign_keys='MatchRecommendation.user2_id',
        backref='user2', lazy='dynamic', cascade='all, delete-orphan')
    connections_as_user1 = db.relationship('Connection', foreign_keys='Connection.user1_id',
        backref='conn_user1', lazy='dynamic', cascade='all, delete-orphan')
    connections_as_user2 = db.relationship('Connection', foreign_keys='Connection.user2_id',
        backref='conn_user2', lazy='dynamic', cascade='all, delete-orphan')
    follows_as_follower = db.relationship('Follow', foreign_keys='Follow.follower_id',
        backref='follower', lazy='dynamic', cascade='all, delete-orphan')
    follows_as_followed = db.relationship('Follow', foreign_keys='Follow.followed_id',
        backref='followed', lazy='dynamic', cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='sender', lazy='dynamic', cascade='all, delete-orphan')
    sessions_as_learner = db.relationship('LearningSession', foreign_keys='LearningSession.learner_id',
        backref='learner', lazy='dynamic', cascade='all, delete-orphan')
    sessions_as_teacher = db.relationship('LearningSession', foreign_keys='LearningSession.teacher_id',
        backref='teacher', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='recipient', lazy='dynamic',
        cascade='all, delete-orphan')

    def set_password(self, password):
        from flask_bcrypt import generate_password_hash
        self.password_hash = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        from flask_bcrypt import check_password_hash
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'age_range': self.age_range,
            'profile_picture': self.profile_picture,
            'experience_level': self.experience_level,
            'availability': self.availability,
            'preferred_method': self.preferred_method,
            'additional_preferences': self.additional_preferences,
            'teach_only_mode': self.teach_only_mode,
            'is_online': self.is_online,
            'profile_completion': self.profile_completion,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_sensitive:
            data['password_hash'] = self.password_hash
        return data

class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    bio = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=True)
    interests = db.Column(db.String(200), nullable=True)
    goals = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'bio': self.bio,
            'location': self.location,
            'interests': self.interests,
            'goals': self.goals,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class Skill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=True)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
        }

class MatchRecommendation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    compatibility_score = db.Column(db.Float, default=0.0)
    match_reason = db.Column(db.Text, nullable=True)
    skills_exchanged = db.Column(db.String(200), nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, connected, dismissed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user1_id', 'user2_id', name='uq_match_pair'),)

    def to_dict(self):
        return {
            'id': self.id,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'compatibility_score': self.compatibility_score,
            'match_reason': self.match_reason,
            'skills_exchanged': self.skills_exchanged,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Connection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected, blocked
    initiated_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user1_id', 'user2_id', name='uq_connection_pair'),)

    initiator = db.relationship('User', foreign_keys=[initiated_by])

    def to_dict(self):
        return {
            'id': self.id,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'status': self.status,
            'initiated_by': self.initiated_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Follow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    followed_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('follower_id', 'followed_id', name='uq_follow_pair'),)

    def to_dict(self):
        return {
            'id': self.id,
            'follower_id': self.follower_id,
            'followed_id': self.followed_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class ChatConversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user1_id', 'user2_id', name='uq_conversation_pair'),)

    messages = db.relationship('Message', backref='conversation', lazy='dynamic',
        cascade='all, delete-orphan', order_by='Message.created_at')

    def to_dict(self):
        return {
            'id': self.id,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('chat_conversation.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    ai_generated = db.Column(db.Boolean, default=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'ai_generated': self.ai_generated,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class LearningSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    learner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey('skill.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, completed, cancelled, rescheduled
    session_objectives = db.Column(db.Text, nullable=True)
    meeting_link = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    skill = db.relationship('Skill')

    def to_dict(self):
        return {
            'id': self.id,
            'learner_id': self.learner_id,
            'teacher_id': self.teacher_id,
            'skill_id': self.skill_id,
            'title': self.title,
            'description': self.description,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'duration_minutes': self.duration_minutes,
            'status': self.status,
            'session_objectives': self.session_objectives,
            'meeting_link': self.meeting_link,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=True)
    type = db.Column(db.String(50), default='info')  # info, connection, message, session, match
    is_read = db.Column(db.Boolean, default=False)
    link = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'link': self.link,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
