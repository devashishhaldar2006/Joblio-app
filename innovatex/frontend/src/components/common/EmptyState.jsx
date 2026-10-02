import React from 'react';
import { ArrowRight, Terminal } from 'lucide-react';

/**
 * Standard Empty State for all InnovateX Modules
 * Strictly avoids fake demo data while guiding user on exact initialization steps.
 */
const EmptyState = ({
  icon: Icon = Terminal,
  title,
  description,
  actionLabel = null,
  onAction = null,
  secondaryActionLabel = null,
  onSecondaryAction = null,
  instruction = null,
  badge = 'DATA SOURCE NOT INITIALIZED'
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3.5rem 2rem',
        background: '#0d0d11',
        border: '1px solid #1a1a24',
        borderRadius: '6px',
        margin: '1.5rem 0',
        minHeight: '320px'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: '#14141c',
          border: '1px solid #242432',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38bdf8',
          marginBottom: '1.25rem'
        }}
      >
        <Icon size={24} />
      </div>

      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: '0.5rem'
        }}
      >
        {badge}
      </span>

      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '0.5rem',
          letterSpacing: '-0.015em'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          maxWidth: '520px',
          lineHeight: 1.55,
          marginBottom: '1.5rem'
        }}
      >
        {description}
      </p>

      {instruction && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: '#a1a1aa',
            background: '#121218',
            border: '1px solid #20202c',
            padding: '0.5rem 0.85rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            maxWidth: '480px'
          }}
        >
          {instruction}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
          >
            <span>{actionLabel}</span>
            <ArrowRight size={14} />
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
          >
            <span>{secondaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
