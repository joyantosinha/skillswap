import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome back</h2>
          <p>Sign in to continue your skill exchange journey</p>
        </div>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
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
            {loading ? 'Signing in...' : <><ArrowRight size={20} /> Sign in</>}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
