import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assistantService } from '../services/api';
import { GraduationCap, ArrowLeft, Zap, Bot, CheckCircle, Lightbulb, Send, User } from 'lucide-react';

export default function Assistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'assistant', content: "Hi! I'm your SkillSwap AI assistant. I can help you plan sessions, suggest beginner steps, recommend practice activities, and share tips for effective peer learning. What would you like to know?" },
  ]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    { text: 'How do I organize a skill exchange session?', icon: Zap },
    { text: 'Beginner-friendly learning steps', icon: GraduationCap },
    { text: 'Generate a session plan', icon: CheckCircle },
    { text: 'Practice activity ideas', icon: Lightbulb },
    { text: 'Tips for effective peer learning', icon: Bot },
  ];

  const ask = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user', content: input };
    setMessages([...messages, userMsg]);
    setLoading(true);
    try {
      const { response } = await assistantService.ask(input);
      setMessages([...messages, userMsg, { id: Date.now() + 1, sender: 'assistant', content: response }]);
    } catch {
      setMessages([...messages, userMsg, { id: Date.now() + 1, sender: 'assistant', content: "Sorry, I couldn't generate a response. Please try again." }]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      <Link to="/dashboard" className="btn btn-ghost btn-sm mb-block" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
        <ArrowLeft size={18} style={{ marginRight: '0.4rem' }} /> Back to dashboard
      </Link>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>AI Learning Assistant</h1>
      <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>Get help planning your skill exchange journey.</p>

      <div className="assistant-layout">
        <aside className="suggestions">
          <h4>Quick questions</h4>
          <ul className="suggestion-list">
            {suggestions.map((s, i) => (
              <li key={i} className="suggestion-item" onClick={() => setInput(s.text)}>
                <s.icon size={16} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> {s.text}
              </li>
            ))}
          </ul>
        </aside>
        <div className="chat-box">
          <div className="assistant-messages">
            {messages.map((m) => (
              <div key={m.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.sender === 'assistant' ? 'var(--primary-light)' : 'var(--light)', color: m.sender === 'assistant' ? 'var(--primary)' : 'var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {m.sender === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div style={{ flex: 1, padding: '0.75rem 1rem', background: m.sender === 'assistant' ? 'var(--light)' : 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--dark)' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: 'var(--gray)' }}>Assistant is typing...</div>}
          </div>
          <div className="assistant-input-area">
            <input
              type="text"
              placeholder="Ask me about session plans, practice ideas, or learning tips..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask(e)}
            />
            <button className="btn btn-primary" onClick={ask} disabled={loading}>
              {loading ? '...' : <Send />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
