import React from 'react';
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';

/**
 * Standard Error State for all InnovateX Modules
 * Explains: What happened, Why it occurred, and What the user can do.
 */
const ErrorState = ({
  title = 'Telemetry Pipeline Failure',
  error = 'Unable to complete the requested analysis.',
  reason = 'The upstream service or database could not be reached.',
  onRetry = null,
  retryLabel = 'Retry Analysis',
  secondaryAction = null,
  secondaryLabel = 'Configure Settings'
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 2rem',
        background: '#120d0f',
        border: '1px solid #2e151b',
        borderRadius: '6px',
        margin: '1.5rem 0'
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f43f5e',
          marginBottom: '1rem'
        }}
      >
        <AlertTriangle size={22} />
      </div>

      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          color: '#f43f5e',
          textTransform: 'uppercase',
          marginBottom: '0.4rem'
        }}
      >
        FAULT DIAGNOSTIC
      </span>

      <h3
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '0.5rem'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.85rem',
          color: '#fda4af',
          maxWidth: '520px',
          lineHeight: 1.5,
          marginBottom: '0.5rem'
        }}
      >
        {typeof error === 'string' ? error : error?.message || 'Unexpected exception'}
      </p>

      {reason && (
        <div
          style={{
            fontSize: '0.78rem',
            color: '#a1a1aa',
            background: '#181114',
            border: '1px solid #29181d',
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            maxWidth: '480px'
          }}
        >
          <strong>Probable Cause:</strong> {reason}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem', background: '#f43f5e', color: '#fff', borderColor: '#f43f5e' }}
          >
            <RefreshCw size={13} />
            <span>{retryLabel}</span>
          </button>
        )}

        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}
          >
            <span>{secondaryLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
