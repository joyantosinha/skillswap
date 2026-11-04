import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sessionsService } from '../services/api';
import { Calendar, Users, Clock, ArrowRight, Play } from 'lucide-react';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ teacher_id: '', skill_id: '', title: '', description: '', scheduled_at: '', duration_minutes: 60, session_objectives: '', meeting_link: '' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    sessionsService.list().then(({ sessions: s }) => setSessions(s)).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await sessionsService.create(form);
      setForm({ teacher_id: '', skill_id: '', title: '', description: '', scheduled_at: '', duration_minutes: 60, session_objectives: '', meeting_link: '' });
      sessionsService.list().then(({ sessions: s }) => setSessions(s));
    } catch (err) {
      alert('Failed to schedule session');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Skill Exchange Sessions</h1>
          <p style={{ color: 'var(--gray)' }}>Schedule and track your learning sessions</p>
        </div>
        <Link to="/matches" className="btn btn-primary"><Play size={18} style={{ marginLeft: '0.4rem' }} /> Find a Partner</Link>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Schedule a New Session</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Teacher</label>
              <input type="number" placeholder="Teacher user ID" value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Skill ID</label>
              <input type="number" placeholder="Skill ID" value={form.skill_id} onChange={(e) => setForm({ ...form, skill_id: e.target.value })} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Session title</label>
            <input type="text" placeholder="e.g. Introduction to Python" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Date & time</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) || 60 })} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Session objectives</label>
            <textarea rows={3} placeholder="What will you cover in this session?" value={form.session_objectives} onChange={(e) => setForm({ ...form, session_objectives: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Meeting link (optional)</label>
            <input type="url" placeholder="Zoom / Google Meet link" value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={creating}>
            {creating ? 'Scheduling...' : <><ArrowRight size={20} style={{ marginLeft: '0.4rem' }} /> Schedule Session</>}
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Your Sessions</h3>
      {loading ? (
        <div className="spinner" style={{ display: 'inline-block' }}></div>
      ) : sessions.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <div className="empty-icon">📅</div>
          <h3>No sessions yet</h3>
          <p>Schedule your first skill exchange session above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {sessions.map((s) => (
            <div key={s.id} className="session-card">
              <div className="session-header">
                <div className="session-title">{s.title}</div>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '999px', fontWeight: 600 }}>{s.status}</span>
              </div>
              <div className="session-meta">
                <span><Calendar size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> {new Date(s.scheduled_at).toLocaleDateString()}</span>
                <span><Clock size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> {s.duration_minutes} min</span>
              </div>
              {s.session_objectives && <p style={{ fontSize: '0.85rem', color: 'var(--gray)', marginTop: '0.75rem' }}>{s.session_objectives}</p>}
              <div className="session-actions" style={{ marginTop: '1rem' }}>
                <button className="btn btn-outline btn-sm">Reschedule</button>
                <button className="btn btn-outline btn-sm">Mark Complete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
