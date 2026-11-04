import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Users, GraduationCap, Calendar, LogOut, Home } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/matches', icon: Users, label: 'Matches' },
    { to: '/dashboard', icon: GraduationCap, label: 'Dashboard' },
    { to: '/connections', icon: MessageCircle, label: 'Connections' },
    { to: '/sessions', icon: Calendar, label: 'Sessions' },
  ];

  const isActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="brand" onClick={() => setMobileOpen(false)}>
          <div className="brand-icon">✨</div>
          SkillSwap
        </Link>

        <div className="nav-links">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={isActive(l.to) ? 'active' : undefined} onClick={() => setMobileOpen(false)}>
              <l.icon className="nav-icon" size={18} /> {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <button className="btn btn-ghost" onClick={() => logout()} onMouseUp={() => setMobileOpen(false)}>
                <LogOut size={18} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/signup" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Get Started</Link>
            </>
          )}
        </div>

        <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
