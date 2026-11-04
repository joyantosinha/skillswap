import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, GraduationCap, Users, Zap, ShieldCheck, Globe, Clock, Sparkles } from 'lucide-react';

export default function Landing() {
  const [selection, setSelection] = useState(null);
  const [urgency, setUrgency] = useState(null);

  return (
    <div className="landing">
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <Sparkles className="hero-icon" size={30} style={{ marginBottom: '1rem', color: '#fbbf24' }} />
              <span className="tagline">SkillSwap — Trade Skills, Not Dollars</span>
              <h1>Learn Something New.<br />Teach Something Awesome.</h1>
              <p>
                SkillSwap is a free, AI-powered peer-to-peer skill exchange platform where students and
                individuals can teach their existing skills to others and learn new skills in return —
                without monetary transactions.
              </p>
              <div className="hero-actions">
                <Link to="/signup" className="btn btn-white btn-block" style={{ minWidth: '140px' }}>
                  <Play size={20} /> Get Started
                </Link>
                <Link to="/login" className="btn btn-outline btn-block" style={{ minWidth: '140px', color: 'var(--white)', borderColor: 'rgba(255,255,255,0.5)' }}>
                  Login
                </Link>
              </div>

              <div className="intro-selector">
                <h3>What brings you here?</h3>
                <div className="selector-options">
                  {[['I want to Learn', 'learn'], ['I want to Teach', 'teach'], ['I want to Exchange Skills', 'exchange']].map(([label, val]) => (
                    <button
                      key={val}
                      className={`option-chip ${selection === val ? 'active' : ''}`}
                      onClick={() => setSelection(selection === val ? null : val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="urgency-selector">
                  <h3>How urgently do you want to find a match?</h3>
                  <div className="urgency-options">
                    {['ASAP', 'This week', 'Flexible'].map((val) => (
                      <button
                        key={val}
                        className={`urgency-chip ${urgency === val ? 'active' : ''}`}
                        onClick={() => setUrgency(urgency === val ? null : val)}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="skill-bubbles">
                {['Python', 'Spanish', 'Guitar', 'Design', 'Coding', 'French', 'Math', 'Cooking', 'Music', 'Writing'].map((s, i) => (
                  <div key={s} className="bubble" style={{ animationDelay: `${i * 0.15}s` }}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Swap skills in three simple steps</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Your Profile</h3>
              <p>Tell us what skills you can teach and what you want to learn.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>AI Matchmaking</h3>
              <p>Our AI finds compatible partners based on skills, experience, and availability.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Connect & Exchange</h3>
              <p>Chat, schedule sessions, and start learning together for free.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section benefits">
        <div className="container">
          <div className="section-header">
            <h2>Benefits of SkillSwap</h2>
            <p>Why students love our community</p>
          </div>
          <div className="benefit-grid">
            <div className="benefit-card">
              <div className="benefit-icon"><GraduationCap size={24} /></div>
              <h3>Learn Anything</h3>
              <p>From languages to coding, find peers eager to teach what you want to learn.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><Users size={24} /></div>
              <h3>Teach & Share</h3>
              <p>Share your knowledge and help others grow while reinforcing your own skills.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><Zap size={24} /></div>
              <h3>100% Free</h3>
              <p>No money changes hands. Skill exchange is free and always will be.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><ShieldCheck size={24} /></div>
              <h3>Safe Community</h3>
              <p>Verified profiles and clear connection boundaries keep exchanges positive.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><Globe size={24} /></div>
              <h3>Online or In-Person</h3>
              <p>Choose chat, video call, or online learning — whatever works for you.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon"><Clock size={24} /></div>
              <h3>Flexible Schedule</h3>
              <p>Set your availability and find partners whose time matches yours.</p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="brand" style={{ fontSize: '1.1rem' }}><Sparkles size={20} style={{ color: '#fbbf24' }} /> SkillSwap</div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Trade Skills, Not Dollars — a free learning community for everyone.
              </p>
            </div>
            <div className="footer-col">
              <h4>About</h4>
              <ul>
                <li><a href="#">Our Story</a></li>
                <li><a href="#">How It Works</a></li>
                <li><a href="#">Community Guidelines</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:hello@skillswap.dev">hello@skillswap.dev</a></li>
                <li><a href="#">Support Center</a></li>
                <li><a href="#">Feedback</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>FAQs</h4>
              <ul>
                <li><a href="#">Is it really free?</a></li>
                <li><a href="#">How does matching work?</a></li>
                <li><a href="#">Can I teach multiple skills?</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; {new Date().getFullYear()} SkillSwap. Built with ❤️ for learners everywhere.
          </div>
        </div>
      </footer>
    </div>
  );
}
