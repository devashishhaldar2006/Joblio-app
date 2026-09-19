import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Github,
  BookOpen,
  GitPullRequest,
  Trophy,
  Briefcase,
  TrendingUp,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/github', label: 'GitHub Analyzer', icon: Github },
    { to: '/research', label: 'Research Agent', icon: BookOpen },
    { to: '/opensource', label: 'Open Source', icon: GitPullRequest },
    { to: '/contests', label: 'Contest Tracker', icon: Trophy },
    { to: '/jobs', label: 'Job Search AI', icon: Briefcase },
    { to: '/market', label: 'Market Forecaster', icon: TrendingUp },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'rgba(10, 15, 29, 0.95)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      position: 'sticky',
      top: 0,
      height: '100vh',
      zIndex: 40
    }}>
      {/* Brand logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.5rem 2rem 0.5rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
        }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="sidebar-innovatex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="24" fill="#111118" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
            <path d="M28 28 L42 50 L28 72" stroke="url(#sidebar-innovatex-grad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M72 28 L58 50 L72 72" stroke="url(#sidebar-innovatex-grad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="50" cy="50" r="5.5" fill="#38bdf8"/>
            <path d="M42 50 L58 50" stroke="#8b5cf6" strokeWidth="4.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', lineHeight: '1.1', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }} className="text-gradient">InnovateX</h2>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.08em', fontWeight: 600 }}>DEV INTELLIGENCE</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.08))' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & logout */}
      <div style={{
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem'
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user?.name || 'Developer'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user?.email || 'Logged in'}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
