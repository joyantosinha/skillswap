# SkillSwap — Trade Skills, Not Dollars

A free, AI-powered peer-to-peer skill exchange platform where students and individuals teach their existing skills to others and learn new skills in return — without monetary transactions.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- pip & npm

### 1. Backend (Flask)

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
pip install -r requirements.txt
python run.py
```

The API runs on `http://localhost:5000`.

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies API calls to `http://localhost:5000`.

### 3. Demo Accounts

Seed data is created automatically on first run. Try these accounts (password: `password123`):

| Email | Name | Skills Teach | Skills Learn |
|-------|------|-------------|--------------|
| alice@example.com | Alice Chen | Python, JavaScript, React | Spanish, Guitar, UI/UX Design |
| marcus@example.com | Marcus Lee | Spanish, Public Speaking | Python, Data Analysis, ML |
| sarah@example.com | Sarah Kim | Korean, Cooking | JavaScript, Web Design |
| david@example.com | David Park | Guitar, Music Theory | Korean, Cooking |
| emma@example.com | Emma Watson | English, Creative Writing | Spanish, French |

## 📁 Project Structure

```
skillswap/
├── backend/
│   ├── app/
│   │   ├── __init__.py      # Flask app factory
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── routes.py        # API endpoints
│   │   └── ai.py            # AI matchmaking & message generation
│   ├── config.py            # Configuration
│   ├── run.py               # Entry point + seed data
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Routing
│   │   ├── main.jsx         # Entry point
│   │   ├── index.css        # Styles
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js  # API client
│   │   ├── components/Navbar.jsx
│   │   └── pages/           # Landing, Login, Signup, ProfileSetup, Matches, IntroMessage, Dashboard, Connections, Chat, Sessions, Assistant
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🎯 Features

- **Welcome/Landing page** with hero, "what brings you here" selector, urgency selector, how-it-works, benefits, footer
- **Registration & profile** with photo upload, teach/learn skills, experience level, availability, method preference, teach-only mode
- **AI matchmaking** — compatibility scoring based on reciprocal skills, experience, availability, method
- **AI intro messages** — personalized editable messages when connecting
- **Dashboard** — profile completion, pending connections, notifications, upcoming sessions, quick actions
- **Follow & connections** — send/accept/reject requests, follow/unfollow, status indicators
- **Real-time chat** — matched users only, AI opening message, timestamps, online status
- **AI learning assistant** — session plans, beginner steps, practice ideas, peer-learning tips
- **Session management** — schedule, date/time, objectives, status tracking, cancel/reschedule
- **Responsive design** — mobile-first, works on phone/tablet/desktop

## 🏗️ Database

SQLite (`skillswap.db`) with models: Users, Profiles, Skills, UserSkills (teach/learn), MatchRecommendations, Connections, Follows, ChatConversations, Messages, LearningSessions, Notifications.

## 🎓 Hackathon Demo

1. Register as a student
2. Complete your profile (teach Python, learn Spanish)
3. Browse AI-recommended matches
4. Send a connection request & customize the AI intro message
5. Chat with your match
6. Schedule a learning session
7. Ask the AI assistant for session planning help

## 📄 License

MIT