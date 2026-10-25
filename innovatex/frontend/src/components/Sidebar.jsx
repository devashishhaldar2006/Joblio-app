import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  LogOut,
  LayoutDashboard,
  Compass,
  GitPullRequest,
  Target,
  BarChart2,
  Users,
  Bookmark,
  FileText,
  Settings,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLayout } from '../context/LayoutContext';

const NAV_PRIMARY = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/market', label: 'Discover', icon: Compass },
  { to: '/opensource', label: 'Contribute', icon: GitPullRequest },
  { to: '/contests', label: 'Track', icon: Target },
  { to: '/github', label: 'Insights', icon: BarChart2 },
  { to: '/research', label: 'Community', icon: Users },
  { to: '/jobs', label: 'Saved', icon: Bookmark },
];

const NAV_SECONDARY = [
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/profile?tab=settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useLayout();
  const onClose = () => setMobileSidebarOpen(false);

  const handleLogout = () => {
    logout();
    toast.info('Signed out');
    navigate('/login');
  };

  const isLinkActive = (item) => {
    if (item.to.includes('?')) {
      const [path, query] = item.to.split('?');
      return location.pathname === path && location.search.includes(query);
    }
    return location.pathname === item.to;
  };

  const renderLink = (item) => {
    const active = isLinkActive(item);
    const Icon = item.icon;

    return (
      <NavLink
        key={item.label}
        to={item.to}
        onClick={() => mobileSidebarOpen && onClose()}
        className={`sidebar-link ${active ? 'sidebar-link--active' : ''}`}
      >
        <Icon size={16} strokeWidth={active ? 2 : 1.5} />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  const sidebarContent = (
    <aside className="sidebar" aria-label="Application Navigation">
      {/* Brand */}
      <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
        <div className="sidebar-brand-icon">IX</div>
        <span className="sidebar-brand-text">InnovateX</span>
        {mobileSidebarOpen && (
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="sidebar-close" aria-label="Close navigation">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Quick search hint */}
      <button
        className="sidebar-search"
        onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
      >
        <Search size={14} />
        <span>Search</span>
        <kbd>⌘K</kbd>
      </button>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          {NAV_PRIMARY.map(renderLink)}
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-section">
          {NAV_SECONDARY.map(renderLink)}
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          className="sidebar-user"
          onClick={() => { navigate('/profile'); if (mobileSidebarOpen) onClose(); }}
          title="View profile"
        >
          <div className="sidebar-avatar">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'Developer'}</span>
            <span className="sidebar-user-handle">
              {user?.githubUsername ? `@${user.githubUsername}` : user?.email || ''}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} title="Sign out" aria-label="Sign out" className="sidebar-logout">
          <LogOut size={14} />
        </button>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background: var(--bg-root);
          border-right: 1px solid var(--border-secondary);
          display: flex;
          flex-direction: column;
          padding: 1rem 0.75rem;
          position: sticky;
          top: 0;
          height: 100vh;
          user-select: none;
          overflow-y: auto;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.25rem 0.5rem;
          margin-bottom: 1rem;
          cursor: pointer;
        }

        .sidebar-brand-icon {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, #F97316 0%, #EC4899 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #ffffff;
          font-family: var(--font-mono);
          letter-spacing: -0.02em;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.3);
        }

        .sidebar-brand-text {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .sidebar-close {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--text-tertiary);
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .sidebar-close:hover { color: var(--text-primary); }

        .sidebar-search {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.625rem;
          margin: 0 0.25rem 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-sm);
          color: var(--text-quaternary);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .sidebar-search:hover {
          border-color: var(--border-primary);
          color: var(--text-tertiary);
        }
        .sidebar-search span {
          flex: 1;
          text-align: left;
        }
        .sidebar-search kbd {
          font-family: var(--font-sans);
          font-size: 0.6875rem;
          padding: 0.1rem 0.35rem;
          border-radius: 3px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          color: var(--text-quaternary);
          line-height: 1;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .sidebar-divider {
          height: 1px;
          background: var(--border-secondary);
          margin: 0.625rem 0.5rem;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.4375rem 0.625rem;
          font-size: 0.8125rem;
          font-weight: 400;
          color: var(--text-tertiary);
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .sidebar-link:hover {
          color: var(--text-primary);
          background: var(--bg-secondary);
        }
        .sidebar-link--active {
          color: var(--primary-text);
          background: var(--primary-light);
          font-weight: 600;
        }

        .sidebar-footer {
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sidebar-user {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          overflow: hidden;
          transition: background var(--transition-fast);
        }
        .sidebar-user:hover {
          background: var(--bg-secondary);
        }

        .sidebar-avatar {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-full);
          background: var(--bg-elevated);
          border: 1px solid var(--border-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .sidebar-user-name {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .sidebar-user-handle {
          font-size: 0.6875rem;
          color: var(--text-quaternary);
          font-family: var(--font-mono);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .sidebar-logout {
          background: none;
          border: none;
          color: var(--text-quaternary);
          cursor: pointer;
          padding: 6px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: color var(--transition-fast);
        }
        .sidebar-logout:hover {
          color: var(--text-secondary);
        }
      `}</style>
    </aside>
  );

  return (
    <>
      <div className="desktop-sidebar-container">{sidebarContent}</div>

      {mobileSidebarOpen && (
        <div className="mobile-drawer-overlay" onClick={onClose}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'var(--sidebar-width)', height: '100%' }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
