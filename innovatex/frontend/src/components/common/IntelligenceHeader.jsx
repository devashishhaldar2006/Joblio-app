import React from 'react';
import { Sparkles, Shield, Clock, Database } from 'lucide-react';

/**
 * Standardized Editorial Header for all InnovateX Intelligence Modules
 */
const IntelligenceHeader = ({
  category = 'INTELLIGENCE LAYER',
  title,
  subtitle,
  actions = null,
  dataSource = null,
  status = null,
  style = {}
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              color: 'var(--accent-blue)',
              textTransform: 'uppercase'
            }}
          >
            {category}
          </span>

          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: status === 'live' ? '#10b981' : status === 'syncing' ? '#38bdf8' : '#71717a'
                }}
              />
              <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {status.toUpperCase()}
              </span>
            </div>
          )}

          {dataSource && (
            <span
              style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                padding: '1px 6px',
                borderRadius: '3px',
                background: '#141419',
                border: '1px solid #23232f',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Database size={10} />
              <span>{dataSource}</span>
            </span>
          )}
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>

      <div>
        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--text-main)',
            lineHeight: 1.25,
            margin: 0
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginTop: '0.35rem',
              lineHeight: 1.5,
              maxWidth: '850px',
              margin: '0.35rem 0 0 0'
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default IntelligenceHeader;
