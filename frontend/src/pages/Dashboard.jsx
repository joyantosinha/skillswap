import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { Users, Bell, Calendar, MessageCircle, ArrowRight, TrendingUp, GraduationCap } from 'lucide-react';

const ICONS = {
  Users: <Users size={32} />,
  Bell: <Bell size={32} />,
  Calendar: <Calendar size={32} />,
  MessageCircle: <MessageCircle size={32} />,
  ArrowRight: <ArrowRight size={18} />,
  TrendingUp: <TrendingUp size={32} />,
  GraduationCap: <GraduationCap size={18} />,
};

const getIcon = (name, color) => {
  const el = ICONS[name];
  if (!el) return null;
  return React.cloneElement(el, { style: { color } });
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div className="spinner" style={{ display: 'inline-block' }}></div>
      </div>
    );
  }

  const u = data?.user || {};
  const upcoming = data?.upcoming_sessions || [];

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      <div className="welcome-bar">
        <div className="profile-ring">{u.full_name?.charAt(0) || 'U'}</div>
        <div style={{ marginLeft: '1rem' }}>
          <h1>Hi, {u.full_name || 'there'} 👋</h1>
          <p>Ready to trade some skills today?</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/profile-setup" className="btn btn-outline btn-sm">Edit Profile</Link>
          <Link to="/matches" className="btn btn-primary btn-sm"><ArrowRight size={18} style={{ marginLeft: '0.4rem' }} /> Find Matches</Link>
        </div>
      </div>

      <div className="completion-card">
        <div className="completion-header">
          <h3>Profile Completion</h3>
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data?.profile_completion || 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(data?.profile_completion || 0, 100)}%` }}></div>
        </div>
        <div className="completion-tips">
          {data?.profile_completion < 100 ? 'Add more skills and availability to improve your match quality.' : 'Your profile is complete! Great matches await.'}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pending Connections</p>
          <h3 style={{ color: 'var(--warning)', margin: 0 }}>{data?.pending_connections || 0}</h3>
          {getIcon('Users', 'var(--warning)')}
        </div>
        <div className="stat-card">
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Unread Notifications</p>
          <h3 style={{ color: 'var(--danger)', margin: 0 }}>{data?.unread_notifications || 0}</h3>
          {getIcon('Bell', 'var(--danger)')}
        </div>
        <div className="stat-card">
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Following</p>
          <h3 style={{ color: 'var(--primary)', margin: 0 }}>{data?.following_count || 0}</h3>
          {getIcon('TrendingUp', 'var(--primary)')}
        </div>
        <div className="stat-card">
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Followers</p>
          <h3 style={{ color: 'var(--primary)', margin: 0 }}>{data?.followers_count || 0}</h3>
          {getIcon('Users', 'var(--primary)')}
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Upcoming Sessions</h3>
          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>No upcoming sessions. Schedule one!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcoming.map((s) => (
                <div key={s.id} className="session-card" style={{ padding: '1rem', marginBottom: 0, border: 'none', background: 'transparent' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{new Date(s.scheduled_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
          <Link to="/sessions" className="btn btn-outline btn-sm" style={{ marginTop: '1rem', display: 'inline-flex' }}>View All Sessions</Link>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Link to="/matches" className="btn btn-outline btn-block"><Users size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> Browse Matches</Link>
            <Link to="/connections" className="btn btn-outline btn-block"><MessageCircle size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> Connections</Link>
            <Link to="/sessions" className="btn btn-outline btn-block"><Calendar size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> Schedule Session</Link>
            <Link to="/assistant" className="btn btn-outline btn-block"><GraduationCap size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> AI Assistant</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
