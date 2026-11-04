import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchesService, connectionsService } from '../services/api';
import { Search, User, Clock, Zap, ShieldCheck, Mail, Smartphone } from 'lucide-react';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    matchesService.list().then(({ matches: m }) => setMatches(m)).finally(() => setLoading(false));
  }, []);

  const filtered = matches.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.teach_skills.some((s) => s.name.toLowerCase().includes(search.toLowerCase())) ||
    m.learn_skills.some((s) => s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleConnect = (id) => {
    connectionsService.send(id).then(() => {
      setMatches(matches.map((m) => m.id === id ? { ...m, connected: true } : m));
    }).catch(() => {});
  };

  const getInitials = (name) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div className="spinner" style={{ display: 'inline-block' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--gray)' }}>Finding your perfect matches...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Recommended Matches</h1>
          <p style={{ color: 'var(--gray)' }}>AI-powered skill exchange partners just for you</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text" placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '300px', padding: '0.75rem 1rem' }}
          />
          <button className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
            <Search size={18} /> Search
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No matches found</h3>
          <p>Try adjusting your search or complete your profile to see more recommendations.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((m) => {
            const showDetails = expanded[m.id];
            return (
              <div key={m.id} className="match-card" style={{ position: 'relative' }}>
                <div className="match-header">
                  <div className="match-avatar">
                    {m.profile_picture ? <img src={m.profile_picture} alt={m.name} /> : <div className="match-avatar-initial">{getInitials(m.name)}</div>}
                  </div>
                  <div className="match-info">
                    <h3>{m.name}</h3>
                    <p>{m.age_range} • {m.experience_level}</p>
                  </div>
                  <span className={`match-status ${m.is_online ? '' : 'offline'}`}></span>
                </div>
                <div className="match-body">
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Teaches</span>
                    <div className="skill-tags">
                      {m.teach_skills.slice(0, 3).map((s) => (
                        <span key={s.id} className="skill-tag">{s.name}</span>
                      ))}
                      {m.teach_skills.length > 3 && <span className="skill-tag">+{m.teach_skills.length - 3}</span>}
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Wants to learn</span>
                    <div className="skill-tags">
                      {m.learn_skills.slice(0, 3).map((s) => (
                        <span key={s.id} className="skill-tag learn">{s.name}</span>
                      ))}
                      {m.learn_skills.length > 3 && <span className="skill-tag learn">+{m.learn_skills.length - 3}</span>}
                    </div>
                  </div>
                  <div className="score-row">
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--dark-soft)' }}>Compatibility</span>
                    <div className="score-badge">{m.compatibility_score}%</div>
                  </div>
                  <div className="match-reason">{m.match_reason || 'Great skill match based on your profiles.'}</div>
                  <div className="match-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setExpanded({ ...expanded, [m.id]: !showDetails })}>
                      {showDetails ? 'Hide details' : 'View details'}
                    </button>
                    <button className={`btn ${m.connected ? 'btn-outline' : 'btn-primary'}`} onClick={() => handleConnect(m.id)} disabled={m.connected}>
                      {m.connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                </div>
                {showDetails && (
                  <div style={{ padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--light)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <span className="badge bg-primary">Availability: {m.availability || 'Not specified'}</span>
                      <span className="badge bg-success">Method: {m.preferred_method?.replace('_', ' ') || 'Not specified'}</span>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Skills to exchange:</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark)' }}>{m.skills_exchanged || 'Complementary skills'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/matches/${m.id}/intro`)}>
                          <Mail size={16} style={{ marginRight: '0.3rem' }} /> Intro Message
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/chat/start/${m.id}`)}>
                          <Smartphone size={16} style={{ marginRight: '0.3rem' }} /> Start Chat
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
