import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Github,
  BookOpen,
  GitPullRequest,
  Trophy,
  Briefcase,
  TrendingUp,
  LogOut,
  User,
  X,
  Layers,
  Search,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLayout } from '../context/LayoutContext';

const GITHUB_SUB_NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
  { id: 'repositories', label: 'Repositories' },
  { id: 'activity', label: 'Activity' },
  { id: 'technology', label: 'Technology' },
  { id: 'community', label: 'Community' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'history', label: 'History' }
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

  const handleOpenCommand = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  const searchParams = new URLSearchParams(location.search);
  const currentGithubTab = searchParams.get('tab') || 'overview';
  const isGithubRoute = location.pathname.startsWith('/github');

  const navSections = [
    {
      label: 'WORKSPACE',
      items: [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { to: '/github', label: 'GitHub Intelligence', icon: Github, category: 'v2.1', hasSubNav: true },
        { to: '/research', label: 'Research', icon: BookOpen, category: 'ArXiv' },
        { to: '/market', label: 'Market', icon: TrendingUp, category: 'Macro' },
        { to: '/jobs', label: 'Jobs', icon: Briefcase, category: 'ATS' }
      ]
    },
    {
      label: 'DISCOVERY',
      items: [
        { to: '/opensource', label: 'Open Source', icon: GitPullRequest, category: 'PRs' },
        { to: '/contests', label: 'Contests', icon: Trophy, category: 'Radar' }
      ]
    },
    {
      label: 'SYSTEM & PROFILE',
      items: [
        { to: '/profile', label: 'Developer', icon: User, exactQuery: '' },
        { to: '/github?tab=overview&export=1', label: 'Reports', icon: FileText, isActionLink: true },
        { to: '/profile?tab=settings', label: 'Settings', icon: Settings, exactQuery: '?tab=settings' }
      ]
    }
  ];

  const sidebarContent = (
    <aside
      aria-label="Workspace Navigation"
      style={{
        width: '240px',
        backgroundColor: '#09090b',
        borderRight: '1px solid #181820',
        display: 'flex',
        flexDirection: 'column',
        padding: '0.85rem 0.65rem',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40,
        userSelect: 'none'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.35rem 0.5rem 0.8rem 0.5rem',
          borderBottom: '1px solid #16161e',
          marginBottom: '0.65rem'
        }}
      >
        <div
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              background: '#111116',
              border: '1px solid #242432',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <Layers size={14} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#f4f4f6',
                letterSpacing: '0.02em',
                fontFamily: 'var(--font-mono)'
              }}
            >
              INNOVATEX
            </span>
            <span
              style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                color: '#71717a',
                background: '#121217',
                border: '1px solid #20202a',
                padding: '0 4px',
                borderRadius: '2px'
              }}
            >
              CONSOLE
            </span>
          </div>
        </div>

        {mobileSidebarOpen && (
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Global Search & AI Command Center Trigger (⌘ K) */}
      <div style={{ padding: '0 0.2rem 0.75rem 0.2rem' }}>
        <button
          type="button"
          onClick={handleOpenCommand}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.42rem 0.65rem',
            background: '#0e0e13',
            border: '1px solid #1e1e2a',
            borderRadius: '4px',
            color: '#a1a1aa',
            fontSize: '0.76rem',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#323246')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e2a')}
          title="Search & AI Command Center (⌘K or Ctrl+K)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Search size={13} style={{ color: '#71717a' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>Search / Ask AI...</span>
          </div>
          <span
            style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono)',
              background: '#16161f',
              border: '1px solid #262636',
              borderRadius: '3px',
              padding: '1px 5px',
              color: '#71717a'
            }}
          >
            ⌘K
          </span>
        </button>
      </div>

      {/* Structured Navigation Groups */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, overflowY: 'auto' }}>
        {navSections.map((group, gIdx) => (
          <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
            <div
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
                color: '#52525b',
                padding: '0.2rem 0.5rem 0.22rem 0.5rem',
                textTransform: 'uppercase'
              }}
            >
              {group.label}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              let isActive = false;
              if (item.isActionLink) {
                isActive = location.pathname === '/github' && searchParams.get('export') === '1';
              } else if (item.exactQuery !== undefined) {
                isActive = location.pathname === item.to.split('?')[0] && location.search === item.exactQuery;
              } else {
                isActive = location.pathname === item.to;
              }

              return (
                <React.Fragment key={item.label}>
                  <NavLink
                    to={item.to}
                    onClick={(e) => {
                      if (item.isActionLink && location.pathname === '/github') {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('open-github-export'));
                      }
                      if (mobileSidebarOpen) onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#f4f4f6' : '#a1a1aa',
                      backgroundColor: isActive ? '#14141c' : 'transparent',
                      borderLeft: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <Icon size={14} style={{ color: isActive ? '#38bdf8' : '#71717a' }} />
                      <span>{item.label}</span>
                    </div>

                    {item.category && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontFamily: 'var(--font-mono)',
                          color: isActive ? '#38bdf8' : '#52525b'
                        }}
                      >
                        {item.category}
                      </span>
                    )}
                  </NavLink>

                  {/* GitHub Intelligence Sub-Navigation */}
                  {item.hasSubNav && isGithubRoute && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1px',
                        marginLeft: '1.15rem',
                        paddingLeft: '0.55rem',
                        borderLeft: '1px solid #1c1c26',
                        marginTop: '0.15rem',
                        marginBottom: '0.25rem'
                      }}
                    >
                      {GITHUB_SUB_NAV.map((sub) => {
                        const subActive = currentGithubTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              navigate(`/github?tab=${sub.id}`);
                              if (mobileSidebarOpen) onClose();
                            }}
                            style={{
                              textAlign: 'left',
                              background: subActive ? '#13131b' : 'transparent',
                              color: subActive ? '#38bdf8' : '#71717a',
                              fontWeight: subActive ? 600 : 400,
                              fontSize: '0.74rem',
                              padding: '0.28rem 0.5rem',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span>{sub.label}</span>
                            {subActive && (
                              <span
                                style={{
                                  width: '4px',
                                  height: '4px',
                                  borderRadius: '50%',
                                  backgroundColor: '#38bdf8'
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Status & User Identity */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '0.65rem',
          borderTop: '1px solid #16161e',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            padding: '0.2rem'
          }}
        >
          <div
            onClick={() => {
              navigate('/profile');
              if (mobileSidebarOpen) onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              overflow: 'hidden',
              cursor: 'pointer',
              flex: 1
            }}
            title="Developer Identity & Settings"
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: '#161620',
                border: '1px solid #242432',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f4f4f6',
                fontSize: '0.72rem',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
            </div>

            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  color: '#f4f4f6'
                }}
              >
                {user?.name || 'Developer'}
              </div>
              <div
                style={{
                  fontSize: '0.64rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#71717a',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {user?.githubUsername ? `@${user.githubUsername}` : user?.email || 'Connected'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            aria-label="Sign Out"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              padding: '0.35rem',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="desktop-sidebar-container">
        {sidebarContent}
      </div>

      {mobileSidebarOpen && (
        <div className="mobile-drawer-overlay" onClick={onClose}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '240px',
              height: '100%'
            }}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
