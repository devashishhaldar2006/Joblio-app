import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLayout } from '../context/LayoutContext';

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

  const primaryNav = [
    { to: '/dashboard', label: 'Overview' },
    { to: '/github', label: 'GitHub' },
    { to: '/research', label: 'Research' },
    { to: '/market', label: 'Market' },
    { to: '/jobs', label: 'Jobs' },
    { to: '/opensource', label: 'Open Source' },
    { to: '/contests', label: 'Competitions' },
  ];

  const secondaryNav = [
    { to: '/profile', label: 'Developer', exact: true },
    { to: '/github?export=1', label: 'Reports', isExport: true },
    { to: '/profile?tab=settings', label: 'Settings' },
  ];

  const renderLink = (item) => {
    let isActive = false;
    if (item.isExport) {
      isActive = location.pathname === '/github' && location.search.includes('export=1');
    } else if (item.exact) {
      isActive = location.pathname === item.to && !location.search.includes('settings');
    } else if (item.to.includes('?')) {
      const [path, query] = item.to.split('?');
      isActive = location.pathname === path && location.search.includes(query);
    } else {
      isActive = location.pathname === item.to;
    }

    return (
      <NavLink
        key={item.label}
        to={item.to}
        onClick={(e) => {
          if (item.isExport && location.pathname === '/github') {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('open-github-export'));
          }
          if (mobileSidebarOpen) onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.42rem 0.65rem',
          fontSize: '0.84rem',
          color: isActive ? '#ffffff' : '#888892',
          fontWeight: isActive ? 500 : 400,
          borderRadius: '4px',
          textDecoration: 'none',
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
          transition: 'color 0.15s ease, background-color 0.15s ease'
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.color = '#d4d4d8';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.color = '#888892';
        }}
      >
        <span>{item.label}</span>
        {isActive && (
          <span
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6'
            }}
          />
        )}
      </NavLink>
    );
  };

  const sidebarContent = (
    <aside
      aria-label="Application Navigation"
      style={{
        width: '210px',
        backgroundColor: '#0B0B0D',
        borderRight: '1px solid #18181d',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem 1.25rem 1.15rem',
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
          marginBottom: '2rem',
          paddingLeft: '0.65rem'
        }}
      >
        <span
          onClick={() => navigate('/dashboard')}
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#ffffff',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          INNOVATEX
        </span>

        {mobileSidebarOpen && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {primaryNav.map(renderLink)}
        </div>

        <div
          style={{
            height: '1px',
            backgroundColor: '#18181d',
            margin: '1.25rem 0.65rem'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {secondaryNav.map(renderLink)}
        </div>
      </nav>

      {/* Footer Identity */}
      <div
        style={{
          paddingTop: '1rem',
          borderTop: '1px solid #18181d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '0.65rem',
          paddingRight: '0.25rem'
        }}
      >
        <div
          onClick={() => {
            navigate('/profile');
            if (mobileSidebarOpen) onClose();
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
          title="View profile"
        >
          <span
            style={{
              fontSize: '0.8rem',
              color: '#d4d4d8',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {user?.name || 'Brad Pitt'}
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              color: '#52525b',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            {user?.githubUsername ? `@${user.githubUsername}` : 'Developer'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#52525b',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#a1a1aa')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
        >
          <LogOut size={13} />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="desktop-sidebar-container">{sidebarContent}</div>

      {mobileSidebarOpen && (
        <div className="mobile-drawer-overlay" onClick={onClose}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '210px', height: '100%' }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
