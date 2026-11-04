import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { connectionsService, followsService } from '../services/api';
import { Users, User, Bell, Mail, ArrowRight, Clock } from 'lucide-react';

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    connectionsService.list().then(({ connections: c }) => setConnections(c)).finally(() => setLoading(false));
  }, []);

  const pending = connections.filter((c) => c.status === 'pending' && !c.is_initiator);
  const accepted = connections.filter((c) => c.status === 'accepted');
  const sent = connections.filter((c) => c.status === 'pending' && c.is_initiator);

  const getInitials = (name) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const respond = (id, action) => {
    connectionsService.respond(id, action).then(() => {
      setConnections(connections.map((c) => c.id === id ? { ...c, status: action === 'accept' ? 'accepted' : 'rejected' } : c));
    });
  };

  const listData = tab === 'pending' ? pending : tab === 'sent' ? sent : accepted;

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Connections</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className={`btn ${tab === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('all')}>All</button>
        <button className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('pending')}>Pending</button>
        <button className={`btn ${tab === 'sent' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('sent')}>Sent</button>
      </div>

      {loading ? (
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner" style={{ display: 'inline-block' }}></div>
        </div>
      ) : listData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{tab === 'pending' ? '📨' : '🤝'}</div>
          <h3>No connections yet</h3>
          <p>Browse matches and send connection requests to get started.</p>
          <Link to="/matches" className="btn btn-primary mt-block" style={{ marginTop: '1.5rem' }}><ArrowRight size={18} /> Browse Matches</Link>
        </div>
      ) : (
        <div className="conn-list">
          {listData.map((c) => {
            const other = c.other_user || {};
            const isPendingIncoming = c.status === 'pending' && !c.is_initiator;
            return (
              <div key={c.id} className="conn-item">
                <div className="conn-info">
                  <div className="conn-avatar">
                    {other.profile_picture ? <img src={other.profile_picture} alt={other.full_name} /> : <div style={{ width: '100%', height: '100%', background: 'var(--primary)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{getInitials(other.full_name || other.username)}</div>}
                  </div>
                  <div>
                    <div className="conn-name">{other.full_name || other.username}</div>
                    <div className="conn-status">{c.status} • {new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isPendingIncoming && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => respond(c.id, 'accept')}>Accept</button>
                      <button className="btn btn-outline btn-sm" onClick={() => respond(c.id, 'reject')}>Reject</button>
                    </>
                  )}
                  {!isPendingIncoming && (
                    <Link to={`/chat/start/${other.id}`} className="btn btn-outline btn-sm">Message</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Follow Suggestions</h3>
        <p style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: '1rem' }}>People you might want to follow:</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline btn-sm"><User size={16} style={{ marginRight: '0.4rem' }} /> Follow Marcus</button>
          <button className="btn btn-outline btn-sm"><User size={16} style={{ marginRight: '0.4rem' }} /> Follow Sarah</button>
          <button className="btn btn-outline btn-sm"><User size={16} style={{ marginRight: '0.4rem' }} /> Follow Emma</button>
        </div>
      </div>
    </div>
  );
}
