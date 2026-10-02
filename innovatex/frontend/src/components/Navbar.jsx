import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';

const Navbar = ({ title, subtitle, onToggleMobileSidebar, rightActions = null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const layout = useLayout();
  const handleToggle = onToggleMobileSidebar || layout?.toggleSidebar;

  const handleGlobalSync = () => {
    if (location.pathname.startsWith('/github')) {
      window.dispatchEvent(new CustomEvent('trigger-github-sync'));
    } else {
      navigate('/github');
    }
  };

  return (
    <header
      style={{
        height: '52px',
        borderBottom: '1px solid #181820',
        backgroundColor: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        position: 'sticky',
        top: 0,
        zIndex: 35,
        gap: '1rem'
      }}
    >
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        {handleToggle && (
          <button
            onClick={handleToggle}
            className="mobile-hamburger-btn"
            aria-label="Toggle Sidebar"
            style={{
              background: 'transparent',
              border: '1px solid #20202a',
              color: 'var(--text-main)',
              borderRadius: '4px',
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>CONSOLE</span>
          <span style={{ fontSize: '0.76rem', color: '#2c2c38' }}>/</span>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#f4f4f6',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title || 'Developer Intelligence'}
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: '0.72rem',
                color: '#71717a',
                fontFamily: 'var(--font-mono)',
                marginLeft: '0.35rem',
                display: 'none'
              }}
              className="desktop-subtitle-inline"
            >
              — {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {rightActions}

        {/* Command Palette / Global Search Trigger */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.28rem 0.6rem',
            background: '#101016',
            border: '1px solid #1f1f2c',
            borderRadius: '4px',
            fontSize: '0.74rem',
            color: '#a1a1aa',
            cursor: 'pointer'
          }}
          title="Global Search & AI Command Center (⌘K or Ctrl+K)"
        >
          <Search size={12} style={{ color: '#71717a' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>Search / AI</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              background: '#181822',
              padding: '0 4px',
              borderRadius: '2px',
              color: '#71717a'
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Sync Trigger */}
        <button
          onClick={handleGlobalSync}
          title="Synchronize GitHub Intelligence"
          style={{
            background: '#101016',
            border: '1px solid #1f1f2c',
            color: '#a1a1aa',
            borderRadius: '4px',
            padding: '0.28rem 0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={12} />
          <span>Sync</span>
        </button>

        {/* Developer Profile Link */}
        <button
          onClick={() => navigate('/profile')}
          title="Developer Identity & Settings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.22rem 0.5rem 0.22rem 0.25rem',
            background: '#101016',
            border: '1px solid #1f1f2c',
            borderRadius: '4px',
            color: '#f4f4f6',
            cursor: 'pointer'
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '3px',
              background: '#1b1b26',
              border: '1px solid #2b2b3c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontSize: '0.68rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'D'}
          </div>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 500,
              maxWidth: '90px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {user?.githubUsername ? `@${user.githubUsername}` : user?.name?.split(' ')[0] || 'Developer'}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
