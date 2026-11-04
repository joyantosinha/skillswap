import random
from app.models import User, Skill, MatchRecommendation, db
from sqlalchemy import or_

SAMPLE_SKILLS = [
    'Python Programming', 'JavaScript', 'React', 'Node.js', 'UI/UX Design',
    'Graphic Design', 'Photography', 'Video Editing', 'Public Speaking',
    'Spanish', 'French', 'Japanese', 'Guitar', 'Piano', 'Singing',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Statistics',
    'Machine Learning', 'Data Analysis', 'Digital Marketing', 'SEO',
    'Content Writing', 'Copywriting', 'Cooking', 'Baking', 'Fitness Training',
    'Yoga', 'Meditation', 'Chess', 'Coding Interview Prep', 'Resume Writing',
    'Web Design', 'Mobile App Development', 'Cybersecurity', 'Blockchain',
    'Finance', 'Investing', 'Entrepreneurship', 'Project Management',
    'Time Management', 'Drawing', 'Painting', 'Pottery', 'Knitting',
    'Dancing', 'Acting', 'Debate', 'Critical Thinking', 'Creative Writing',
]

SKILL_CATEGORIES = {
    'Python Programming': 'Technology',
    'JavaScript': 'Technology',
    'React': 'Technology',
    'Node.js': 'Technology',
    'UI/UX Design': 'Design',
    'Graphic Design': 'Design',
    'Photography': 'Arts',
    'Video Editing': 'Arts',
    'Public Speaking': 'Communication',
    'Spanish': 'Language',
    'French': 'Language',
    'Japanese': 'Language',
    'Guitar': 'Music',
    'Piano': 'Music',
    'Singing': 'Music',
    'Mathematics': 'Academic',
    'Physics': 'Academic',
    'Chemistry': 'Academic',
    'Biology': 'Academic',
    'Statistics': 'Academic',
    'Machine Learning': 'Technology',
    'Data Analysis': 'Technology',
    'Digital Marketing': 'Business',
    'SEO': 'Business',
    'Content Writing': 'Communication',
    'Copywriting': 'Communication',
    'Cooking': 'Lifestyle',
    'Baking': 'Lifestyle',
    'Fitness Training': 'Lifestyle',
    'Yoga': 'Lifestyle',
    'Meditation': 'Lifestyle',
    'Chess': 'Games',
    'Coding Interview Prep': 'Career',
    'Resume Writing': 'Career',
    'Web Design': 'Design',
    'Mobile App Development': 'Technology',
    'Cybersecurity': 'Technology',
    'Blockchain': 'Technology',
    'Finance': 'Business',
    'Investing': 'Business',
    'Entrepreneurship': 'Business',
    'Project Management': 'Business',
    'Time Management': 'Personal Development',
    'Drawing': 'Arts',
    'Painting': 'Arts',
    'Pottery': 'Arts',
    'Knitting': 'Arts',
    'Dancing': 'Arts',
    'Acting': 'Arts',
    'Debate': 'Communication',
    'Critical Thinking': 'Personal Development',
    'Creative Writing': 'Communication',
}

def seed_skills():
    """Ensure sample skills exist in the database."""
    existing = {s.name for s in Skill.query.all()}
    for name in SAMPLE_SKILLS:
        if name not in existing:
            skill = Skill(name=name, category=SKILL_CATEGORIES.get(name, 'General'),
                          description=f'Learn or teach {name}')
            db.session.add(skill)
    db.session.commit()

def compute_compatibility(user, other):
    """Compute a 0-100 compatibility score between two users."""
    score = 0.0
    reasons = []
    exchanged = []

    user_teach = {s.id for s in user.skills_teach}
    user_learn = {s.id for s in user.skills_learn}
    other_teach = {s.id for s in other.skills_teach}
    other_learn = {s.id for s in other.skills_learn}

    # Reciprocal match: user wants to learn what other can teach AND vice versa
    user_learns_other_teaches = user_learn & other_teach
    other_learns_user_teaches = other_learn & user_teach

    if user_learns_other_teaches:
        score += 35 * len(user_learns_other_teaches)
        exchanged.extend([s.name for s in Skill.query.filter(Skill.id.in_(user_learns_other_teaches)).all()])
        reasons.append(f"You want to learn {', '.join(s.name for s in Skill.query.filter(Skill.id.in_(user_learns_other_teaches)).all())} which {other.full_name or other.username} can teach.")

    if other_learns_user_teaches:
        score += 35 * len(other_learns_user_teaches)
        exchanged.extend([s.name for s in Skill.query.filter(Skill.id.in_(other_learns_user_teaches)).all()])
        reasons.append(f"{other.full_name or other.username} wants to learn {', '.join(s.name for s in Skill.query.filter(Skill.id.in_(other_learns_user_teaches)).all())} which you can teach.")

    # Teach-only mode: user teaches, other learns (no reciprocity needed)
    if user.teach_only_mode:
        if other_learns_user_teaches:
            score += 40
            reasons.append(f"{other.full_name or other.username} wants to learn your skills: {', '.join(s.name for s in Skill.query.filter(Skill.id.in_(other_learns_user_teaches)).all())}.")
    else:
        # One-way partial match
        if user_learns_other_teaches and not other_learns_user_teaches:
            score += 25
        if other_learns_user_teaches and not user_learns_other_teaches:
            score += 25

    # Experience level compatibility
    if user.experience_level and other.experience_level:
        levels = {'beginner': 1, 'intermediate': 2, 'advanced': 3}
        ul = levels.get(user.experience_level, 2)
        ol = levels.get(other.experience_level, 2)
        if abs(ul - ol) <= 1:
            score += 10
            reasons.append("Similar experience levels make learning comfortable.")
        else:
            score += 5

    # Availability overlap (mock)
    if user.availability and other.availability:
        score += 10
        reasons.append("Availability seems compatible.")

    # Preferred method match
    if user.preferred_method and other.preferred_method:
        if user.preferred_method == other.preferred_method:
            score += 10
            reasons.append(f"Both prefer {user.preferred_method} learning.")

    score = min(score, 100)
    return round(score, 1), ' '.join(reasons)[:300], ', '.join(dict.fromkeys(exchanged))

def generate_matches(current_user, limit=5):
    """Generate match recommendations for a user."""
    seed_skills()
    users = User.query.filter(User.id != current_user.id).all()
    results = []
    for other in users:
        score, reason, exchanged = compute_compatibility(current_user, other)
        if score > 0:
            results.append({
                'user': other,
                'score': score,
                'reason': reason,
                'exchanged': exchanged,
            })
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:limit]

def save_match_recommendations(current_user, matches):
    """Persist match recommendations."""
    MatchRecommendation.query.filter_by(user1_id=current_user.id).delete()
    for m in matches:
        rec = MatchRecommendation(
            user1_id=current_user.id,
            user2_id=m['user'].id,
            compatibility_score=m['score'],
            match_reason=m['reason'],
            skills_exchanged=m['exchanged'],
            status='pending',
        )
        db.session.add(rec)
    db.session.commit()

def generate_intro_message(user, other, exchanged_skills):
    """Generate a personalized AI introduction message."""
    uname = user.full_name or user.username
    oname = other.full_name or other.username
    skills_str = exchanged_skills or 'your shared interests'

    templates = [
        f"Hi {oname}! I'm {uname}. I saw we're a great match on SkillSwap — I'd love to exchange {skills_str} with you. When are you available to get started?",
        f"Hello {oname}, this is {uname}! I'm excited to connect and trade skills. I can help you with what I know, and I'd love to learn from you too. Let's plan our first session!",
        f"Hey {oname}! I'm {uname} from SkillSwap. Our skills complement each other perfectly — {skills_str}. Shall we schedule a quick chat to kick off our exchange?",
    ]
    return random.choice(templates)

def get_learning_assistant_response(message, user_context=None):
    """Mock AI learning assistant responses."""
    msg = message.lower()

    greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening']
    if any(g in msg for g in greetings) and len(msg.split()) <= 3:
        return ("Hello! I'm your SkillSwap AI assistant. I can help you plan skill exchange sessions, "
                "suggest beginner learning steps, recommend practice activities, and share tips for effective peer learning. "
                "What would you like to know?")

    if 'session plan' in msg or 'organize' in msg or 'structure' in msg:
        return ("Here's a simple session plan: 1) Set clear objectives (5 min), 2) Teach/demo the concept (20 min), "
                "3) Guided practice (20 min), 4) Q&A and feedback (10 min), 5) Assign practice for next time (5 min).")

    if 'beginner' in msg or 'first session' in msg or 'start' in msg:
        return ("For your first session, keep it relaxed: introduce yourselves, agree on goals, start with the basics, "
                "and end with a small win. Don't rush — peer learning works best when both feel comfortable.")

    if 'practice' in msg or 'activity' in msg or 'activities' in msg:
        return ("Try these practice activities: mini-projects, peer code reviews, conversation drills, skill demos, "
                "and weekly challenges. Consistency beats intensity.")

    if 'tip' in msg or 'effective' in msg or 'advice' in msg:
        return ("Effective peer learning tips: set clear expectations, give constructive feedback, celebrate small wins, "
                "and rotate teaching roles so everyone gets to lead.")

    if 'prepare' in msg or 'preparation' in msg or 'ready' in msg:
        return ("To prepare for your first session: review the basics yourself, prepare 3-5 questions to ask your partner, "
                "test your video/audio if meeting online, and set a clear goal for what you want to learn.")

    if 'schedule' in msg or 'time' in msg or 'when' in msg:
        return ("Pick a time that works for both of you. Evening and weekend slots tend to work best for students. "
                "Block 60-90 minutes per session and send a calendar invite so neither of you forgets.")

    if 'platform' in msg or 'where' in msg or 'meet' in msg:
        return ("You can meet over video call (Zoom, Google Meet), chat, or in person. SkillSwap supports all three — "
                "just agree with your partner on what works best.")

    return ("I'm your SkillSwap AI assistant! Ask me about session plans, beginner steps, practice activities, "
            "tips for effective peer learning, how to prepare, scheduling, or where to meet.")
