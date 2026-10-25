import React from 'react';

/**
 * StatusIndicator: Subtle pulse indicator for Systems Operational / Live Status
 */
export const StatusIndicator = ({
  status = 'operational', // 'operational' | 'live' | 'busy' | 'offline'
  label = 'SYSTEMS OPERATIONAL',
  showDot = true,
  style = {}
}) => {
  const color =
    status === 'operational' || status === 'live' ? '#10b981' :
    status === 'busy' ? '#38bdf8' :
    status === 'warning' ? '#f59e0b' : '#ef4444';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        fontSize: '0.6875rem',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
        ...style
      }}
    >
      {showDot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}80`
          }}
        />
      )}
      <span>{label}</span>
    </div>
  );
};

/**
 * Insight: Editorial callout container for quant takeaway / analytical brief
 */
export const Insight = ({
  title = 'QUANTITATIVE SYNTHESIS',
  children,
  accent = '#10b981',
  bg = 'var(--bg-subtle)',
  border = 'var(--border)'
}) => {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.1rem',
        fontSize: '0.825rem',
        lineHeight: '1.5',
        color: 'var(--text-primary)',
        margin: '0.75rem 0'
      }}
    >
      {title && (
        <div
          style={{
            fontSize: '0.6875rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: accent,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '0.35rem'
          }}
        >
          {title}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default StatusIndicator;
