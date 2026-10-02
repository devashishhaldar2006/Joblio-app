import React from 'react';

/**
 * Editorial callout container for quant takeaway / analytical brief
 */
const Insight = ({
  title = 'QUANTITATIVE SYNTHESIS',
  children,
  accent = '#10b981',
  bg = 'rgba(16, 185, 129, 0.05)',
  border = 'rgba(16, 185, 129, 0.25)'
}) => {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: '4px',
        padding: '0.85rem 1.1rem',
        fontSize: '0.825rem',
        lineHeight: '1.5',
        color: '#e4e4e7',
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

export default Insight;
