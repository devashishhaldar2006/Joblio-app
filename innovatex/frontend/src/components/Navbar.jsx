import React from 'react';
import { Sparkles, Terminal } from 'lucide-react';

const Navbar = ({ title, subtitle }) => {
  return (
    <header style={{
      height: '70px',
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.8rem',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.78rem',
          color: '#a5b4fc',
          fontWeight: 500
        }}>
          <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>Llama 3.3 70B (Groq)</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
