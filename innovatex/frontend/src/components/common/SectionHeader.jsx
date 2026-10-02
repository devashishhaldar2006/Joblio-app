import React from 'react';

/**
 * Editorial Section Header with Index marker and optional metadata
 */
const SectionHeader = ({
  index = '01',
  title,
  subtitle = null,
  badge = null,
  action = null
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingBottom: '0.6rem',
        borderBottom: '1px solid #1a1a24',
        marginBottom: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {index && (
          <span
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: 'var(--accent-blue)'
            }}
          >
            {index} //
          </span>
        )}
        <h2
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-main)',
            margin: 0
          }}
        >
          {title}
        </h2>
        {badge && (
          <span
            style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              padding: '1px 5px',
              borderRadius: '2px',
              background: '#161620',
              border: '1px solid #232332',
              color: 'var(--text-muted)'
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {action && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {action}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
