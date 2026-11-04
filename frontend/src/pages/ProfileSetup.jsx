import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { skills } from '../services/api';
import { Mail, Calendar, Users, BarChart3, Smartphone, Video, Clock, Trash2, Plus, ArrowRight } from 'lucide-react';

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allSkills, setAllSkills] = useState([]);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    age_range: user?.age_range || '',
    experience_level: user?.experience_level || '',
    availability: user?.availability || '',
    preferred_method: user?.preferred_method || '',
    additional_preferences: '',
    teach_only_mode: user?.teach_only_mode || false,
    teach_skill_ids: [],
    learn_skill_ids: [],
    profile_picture: user?.profile_picture || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    skills.list().then(({ skills: s }) => setAllSkills(s));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fetch('/api/profile/picture', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('ss_token')}` },
      body: fd,
    }).then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setForm({ ...form, profile_picture: d.profile_picture });
      }
    });
  };

  const toggleSkill = (id, type) => {
    const key = type === 'teach' ? 'teach_skill_ids' : 'learn_skill_ids';
    const current = form[key];
    if (current.includes(id)) {
      setForm({ ...form, [key]: current.filter((x) => x !== id) });
    } else {
      setForm({ ...form, [key]: [...current, id] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ss_token')}`,
        },
        body: JSON.stringify(form),
      });
      navigate('/matches');
    } catch (err) {
      setError('Failed to save profile');
      setLoading(false);
    }
  };

  const isTeachSelected = (id) => form.teach_skill_ids.includes(id);
  const isLearnSelected = (id) => form.learn_skill_ids.includes(id);

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Complete Your Profile</h1>
            <p style={{ color: 'var(--gray)' }}>Tell us about yourself so we can find great matches.</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/matches')}>Skip for now</button>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h3><Users size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> Basics</h3>
            <div className="form-group">
              <label>Full name</label>
              <input type="text" placeholder="Jane Doe" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Age range</label>
              <select value={form.age_range} onChange={(e) => setForm({ ...form, age_range: e.target.value })}>
                <option value="">Select age range</option>
                <option value="16-18">16-18</option>
                <option value="18-22">18-22</option>
                <option value="23-26">23-26</option>
                <option value="27-35">27-35</option>
                <option value="36+">36+</option>
              </select>
            </div>
            <div className="form-group">
              <label>Experience level</label>
              <select value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })}>
                <option value="">Select level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label>Profile picture</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {form.profile_picture && (
                <img src={form.profile_picture} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginTop: '0.5rem', border: '2px solid var(--primary)' }} />
              )}
            </div>
          </div>

          <div className="form-section">
            <h3><BarChart3 size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> Your Skills</h3>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Skills I can teach</label>
              <div className="skill-select">
                {allSkills.map((s) => (
                  <button key={s.id} className={`skill-pill ${isTeachSelected(s.id) ? 'selected' : ''}`} onClick={() => toggleSkill(s.id, 'teach')}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Skills I want to learn</label>
              <div className="skill-select">
                {allSkills.map((s) => (
                  <button key={s.id} className={`skill-pill ${isLearnSelected(s.id) ? 'selected' : ''}`} onClick={() => toggleSkill(s.id, 'learn')}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><Clock size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> Availability & Method</h3>
            <div className="form-group">
              <label>Availability / preferred schedule</label>
              <input type="text" placeholder="e.g. Weekends and evenings" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Preferred learning method</label>
              <div className="radio-group">
                <label className="radio-label"><input type="radio" name="method" value="online" checked={form.preferred_method === 'online'} onChange={(e) => setForm({ ...form, preferred_method: e.target.value })} /> Online</label>
                <label className="radio-label"><input type="radio" name="method" value="chat" checked={form.preferred_method === 'chat'} onChange={(e) => setForm({ ...form, preferred_method: e.target.value })} /> Chat</label>
                <label className="radio-label"><input type="radio" name="method" value="video_call" checked={form.preferred_method === 'video_call'} onChange={(e) => setForm({ ...form, preferred_method: e.target.value })} /> Video Call</label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3><Plus size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> Preferences</h3>
            <div className="form-group">
              <label>Additional preferences</label>
              <textarea rows={3} placeholder="Anything else we should know..." value={form.additional_preferences} onChange={(e) => setForm({ ...form, additional_preferences: e.target.value })} />
            </div>
            <div className="toggle-row">
              <input type="checkbox" id="teach-only" checked={form.teach_only_mode} onChange={(e) => setForm({ ...form, teach_only_mode: e.target.checked })} />
              <label htmlFor="teach-only" style={{ margin: 0, fontWeight: 500 }}>Teach-Only Mode</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray)', marginLeft: '0.5rem' }}>I only want to teach, not learn</span>
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? 'Saving...' : <><ArrowRight size={20} /> Save & Find Matches</>}
          </button>
        </form>
      </div>
    </div>
  );
}
