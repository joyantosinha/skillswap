import os
from app import create_app, db
from app.models import User, Skill
from app.ai import seed_skills

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()
    seed_skills()

    # Create demo users if none exist
    if User.query.count() == 0:
        demo_users = [
            {'username': 'raj_sharma', 'email': 'raj@example.com', 'password': 'password123',
             'full_name': 'Raj Sharma', 'age_range': '18-22', 'experience_level': 'intermediate',
             'availability': 'Weekends and evenings', 'preferred_method': 'video_call',
             'teach': ['Python Programming', 'JavaScript', 'React'],
             'learn': ['Hindi', 'Guitar', 'UI/UX Design']},
            {'username': 'priya_patel', 'email': 'priya@example.com', 'password': 'password123',
             'full_name': 'Priya Patel', 'age_range': '23-26', 'experience_level': 'advanced',
             'availability': 'Weekday evenings', 'preferred_method': 'online',
             'teach': ['Hindi', 'Public Speaking', 'Mathematics'],
             'learn': ['Python Programming', 'Data Analysis', 'Machine Learning']},
            {'username': 'arjun_reddy', 'email': 'arjun@example.com', 'password': 'password123',
             'full_name': 'Arjun Reddy', 'age_range': '18-22', 'experience_level': 'beginner',
             'availability': 'Flexible', 'preferred_method': 'chat',
             'teach': ['Telugu', 'Cooking', 'Cricket'],
             'learn': ['JavaScript', 'Web Design', 'Photography']},
            {'username': 'sneha_gupta', 'email': 'sneha@example.com', 'password': 'password123',
             'full_name': 'Sneha Gupta', 'age_range': '23-26', 'experience_level': 'intermediate',
             'availability': 'Weekends', 'preferred_method': 'video_call',
             'teach': ['Tabla', 'Indian Classical Music', 'Singing'],
             'learn': ['Tamil', 'Cooking', 'UI/UX Design']},
            {'username': 'kavita_nair', 'email': 'kavita@example.com', 'password': 'password123',
             'full_name': 'Kavita Nair', 'age_range': '18-22', 'experience_level': 'beginner',
             'availability': 'Afternoons', 'preferred_method': 'online',
             'teach': ['English', 'Creative Writing', 'Malayalam'],
             'learn': ['Hindi', 'French', 'Yoga']},
            {'username': 'vikram_singh', 'email': 'vikram@example.com', 'password': 'password123',
             'full_name': 'Vikram Singh', 'age_range': '23-26', 'experience_level': 'advanced',
             'availability': 'Evenings', 'preferred_method': 'video_call',
             'teach': ['Punjabi', 'Cooking', 'Entrepreneurship'],
             'learn': ['React', 'Node.js', 'Digital Marketing']},
        ]

        from app.ai import SKILL_CATEGORIES
        for du in demo_users:
            user = User(
                username=du['username'], email=du['email'], full_name=du['full_name'],
                age_range=du['age_range'], experience_level=du['experience_level'],
                availability=du['availability'], preferred_method=du['preferred_method'],
            )
            user.set_password(du['password'])
            db.session.add(user)
            db.session.flush()

            from app.models import Profile
            profile = Profile(user_id=user.id, bio=f"Hi, I'm {du['full_name']}! Excited to swap skills.",
                              interests='Learning and teaching', goals='Meet new people and grow skills')
            db.session.add(profile)

            teach_skills = Skill.query.filter(Skill.name.in_(du['teach'])).all()
            learn_skills = Skill.query.filter(Skill.name.in_(du['learn'])).all()
            user.skills_teach = teach_skills
            user.skills_learn = learn_skills

            # set completion
            completion = 0
            if user.full_name: completion += 15
            if user.age_range: completion += 10
            if user.experience_level: completion += 15
            if user.skills_teach: completion += 20
            if user.skills_learn: completion += 15
            if user.availability: completion += 5
            if user.preferred_method: completion += 5
            user.profile_completion = min(completion, 100)

        db.session.commit()
        print("Demo users created.")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
