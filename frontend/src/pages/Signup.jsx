import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/profile-setup');
    } catch (err) {
      setError(err.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create your account</h2>
          <p>Join SkillSwap and start trading skills today</p>
        </div>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <User size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--gray)' }} />
            <input
              type="text" placeholder="Jane Doe"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              style={{ paddingLeft: '2.75rem', position: 'relative' }}
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text" placeholder="janedoe"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--gray)' }} />
            <input
              type="email" placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={{ paddingLeft: '2.75rem', position: 'relative' }}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--gray)' }} />
            <input
              type="password" placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={{ paddingLeft: '2.75rem', position: 'relative' }}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : <><ArrowRight size={20} /> Create account</>}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
