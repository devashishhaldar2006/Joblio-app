import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Slide-in / Modal Detail Drawer for deep-dive analysis without context loss
 */
const DetailDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle = null,
  badge = null,
  children,
  width = '640px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: width,
          height: '100%',
          background: '#0c0c10',
          borderLeft: '1px solid #1f1f2c',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'drawerSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #1a1a24',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            position: 'sticky',
            top: 0,
            background: '#0c0c10',
            zIndex: 10
          }}
        >
          <div>
            {badge && (
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  background: '#161622',
                  border: '1px solid #282838',
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '0.35rem'
                }}
              >
                {badge}
              </span>
            )}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f4f4f6', margin: 0 }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.25rem 0 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#14141c',
              border: '1px solid #222230',
              borderRadius: '4px',
              padding: '0.4rem',
              color: '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Drawer (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DetailDrawer;
