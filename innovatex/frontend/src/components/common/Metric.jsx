import React from 'react';

/**
 * Precision Monospace Metric tile
 */
const Metric = ({
  label,
  value,
  sub = null,
  delta = null,
  provenance = null,
  accent = null,
  style = {}
}) => {
  return (
    <div
      style={{
        background: '#0d0d12',
        border: '1px solid #1a1a24',
        borderRadius: '4px',
        padding: '0.85rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}
        >
          {label}
        </span>
        {delta && (
          <span
            style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: delta.startsWith('+') ? '#10b981' : delta.startsWith('-') ? '#f43f5e' : '#a1a1aa'
            }}
          >
            {delta}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: '1.45rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: accent || 'var(--text-main)',
          lineHeight: 1.15
        }}
      >
        {value}
      </div>

      {(sub || provenance) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
          {sub && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {sub}
            </span>
          )}
          {provenance && (
            <span
              style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)',
                textTransform: 'uppercase'
              }}
            >
              {provenance}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Metric;
