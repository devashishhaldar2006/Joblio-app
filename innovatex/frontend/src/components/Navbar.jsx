import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Github,
  GitPullRequest,
  Trophy,
  Briefcase,
  TrendingUp,
  BookOpen,
  FileText,
  Settings,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'GitHub Audit', to: '/github', icon: Github },
  { label: 'Open Source', to: '/opensource', icon: GitPullRequest },
  { label: 'Contests', to: '/contests', icon: Trophy },
  { label: 'Job Match', to: '/jobs', icon: Briefcase },
  { label: 'Market Gap', to: '/market', icon: TrendingUp },
  { label: 'Research', to: '/research', icon: BookOpen },
  { label: 'Reports', to: '/reports', icon: FileText },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'sunset-noir');
    localStorage.setItem('innovatex_theme', 'sunset-noir');
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="top-navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <div className="navbar-brand-section">
          <NavLink to="/dashboard" className="navbar-logo">
            <div className="logo-icon-wrap">
              <Sparkles size={18} className="logo-icon" />
            </div>
            <span className="logo-text">InnovateX</span>
          </NavLink>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav-links">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                (item.to === '/dashboard' && (location.pathname === '/' || location.pathname === '/overview'));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`top-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Center Search Bar */}
        <div className="navbar-search-section">
          <button
            type="button"
            className="navbar-search-btn"
            onClick={handleOpenSearch}
            title="Search repositories, jobs, papers (⌘K or Ctrl+K)"
          >
            <Search size={14} className="search-icon" />
            <span className="search-placeholder">Quick search...</span>
            <kbd className="search-kbd">⌘K</kbd>
          </button>
        </div>

        {/* Right Section: Avatar & Menu */}
        <div className="navbar-right-section">

          {/* Profile Avatar & Menu */}
          <div className="profile-menu-container" ref={profileMenuRef}>
            <button
              type="button"
              className="avatar-btn"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-label="User menu"
            >
              <div className="avatar-circle">{userInitial}</div>
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="user-name">{user?.name || 'Developer'}</div>
                  <div className="user-email">{user?.email || 'developer@example.com'}</div>
                  {user?.githubUsername && <div className="user-role-badge">@{user.githubUsername}</div>}
                </div>
                <div className="profile-dropdown-divider" />
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/github');
                  }}
                >
                  <Github size={14} />
                  <span>GitHub Profile Audit</span>
                </button>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/settings');
                  }}
                >
                  <Settings size={14} />
                  <span>Settings & API Keys</span>
                </button>
                <div className="profile-dropdown-divider" />
                <button
                  type="button"
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-hamburger"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-search-wrap">
            <button
              type="button"
              className="navbar-search-btn w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                handleOpenSearch();
              }}
            >
              <Search size={14} />
              <span>Search repositories, jobs, papers...</span>
              <kbd className="search-kbd">⌘K</kbd>
            </button>
          </div>
          <nav className="mobile-nav-list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
            <NavLink to="/settings" className="mobile-nav-link">
              <Settings size={16} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
      )}

      <style>{`
        .top-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background-color: var(--bg-card);
          border-bottom: 1px solid var(--border);
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .navbar-container {
          max-width: 1440px;
          margin: 0 auto;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          gap: 1rem;
        }

        .navbar-brand-section {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--text-primary);
          flex-shrink: 0;
        }

        .logo-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, #F97316 0%, #EC4899 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.35);
        }

        .logo-text {
          font-size: 1.0625rem;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--text-primary);
        }

        .desktop-nav-links {
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }

        .top-nav-link {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.38rem 0.58rem;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .top-nav-link:hover {
          color: var(--text-primary);
          background-color: var(--bg-subtle);
        }

        .top-nav-link.active {
          color: var(--primary);
          background-color: var(--primary-light);
          font-weight: 600;
        }

        .navbar-search-section {
          flex: 1;
          max-width: 240px;
        }

        .navbar-search-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.75rem;
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease;
          text-align: left;
        }

        .navbar-search-btn:hover {
          border-color: var(--border-hover);
          background-color: var(--bg-card);
        }

        .search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .search-placeholder {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-kbd {
          font-family: var(--font-sans);
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.1rem 0.3rem;
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
        }

        .navbar-right-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .theme-toggle-btn {
          background: none;
          border: 1px solid var(--border);
          width: 34px;
          height: 34px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .theme-toggle-btn:hover {
          background-color: var(--bg-subtle);
          color: var(--text-primary);
        }

        .profile-menu-container {
          position: relative;
        }

        .avatar-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent-rose) 100%);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.25);
        }

        .profile-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 0.5rem);
          width: 240px;
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-dropdown);
          padding: 0.5rem;
          z-index: 100;
          animation: fadeIn 0.15s ease-out;
        }

        .profile-dropdown-header {
          padding: 0.5rem 0.75rem;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.125rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role-badge {
          display: inline-block;
          font-size: 0.6875rem;
          padding: 0.1rem 0.4rem;
          background-color: var(--primary-light);
          color: var(--primary-text);
          border-radius: var(--radius-full);
          margin-top: 0.35rem;
          font-weight: 500;
        }

        .profile-dropdown-divider {
          height: 1px;
          background-color: var(--border-light);
          margin: 0.35rem 0;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 0.75rem;
          border: none;
          background: none;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .dropdown-item:hover {
          background-color: var(--bg-subtle);
          color: var(--text-primary);
        }

        .dropdown-item.text-danger {
          color: var(--error-text);
        }

        .dropdown-item.text-danger:hover {
          background-color: var(--error-light);
        }

        .mobile-hamburger {
          display: none;
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0.25rem;
        }

        .mobile-nav-drawer {
          display: none;
        }

        @media (max-width: 1100px) {
          .desktop-nav-links {
            display: none;
          }
          .navbar-search-section {
            display: none;
          }
          .mobile-hamburger {
            display: block;
          }
          .mobile-nav-drawer {
            display: block;
            background-color: var(--bg-card);
            border-bottom: 1px solid var(--border);
            padding: 1rem 1.25rem 1.5rem;
          }
          .mobile-search-wrap {
            margin-bottom: 1rem;
          }
          .mobile-nav-list {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
          }
          .mobile-nav-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.625rem 0.75rem;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            color: var(--text-secondary);
            text-decoration: none;
            font-weight: 500;
          }
          .mobile-nav-link.active {
            background-color: var(--primary-light);
            color: var(--primary);
            font-weight: 600;
          }
        }
      `}</style>
    </header>
  );
}
