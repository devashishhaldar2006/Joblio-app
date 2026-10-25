import React from 'react';
import { Cpu, RefreshCw } from 'lucide-react';

/**
 * Standard Loading State with Multi-Stage Pipeline Tracking
 */
const LoadingState = ({
  stage = 'ANALYZING',
  message = 'Executing autonomous multi-agent analysis...',
  steps = ['CONNECTING', 'FETCHING', 'ANALYZING', 'CORRELATING', 'SYNTHESIZING'],
  currentStepIndex = 2
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
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        margin: '1.5rem 0',
        minHeight: '300px'
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          marginBottom: '1.25rem',
          position: 'relative'
        }}
      >
        <RefreshCw size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
      </div>

      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          color: 'var(--primary)',
          textTransform: 'uppercase',
          marginBottom: '0.4rem'
        }}
      >
        PIPELINE ACTIVE // {stage}
      </span>

      <h3
        style={{
          fontSize: '1.15rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '1.25rem'
        }}
      >
        {message}
      </h3>

      {/* Multi-step pipeline pipeline bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.4rem 0.75rem',
          maxWidth: '560px',
          width: '100%',
          justifyContent: 'space-between',
          overflowX: 'auto'
        }}
      >
        {steps.map((st, i) => {
          const isDone = i < currentStepIndex;
          const isCurrent = i === currentStepIndex;
          const color = isCurrent ? 'var(--primary)' : isDone ? 'var(--success-text)' : 'var(--text-muted)';

          return (
            <React.Fragment key={st}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--primary)' : isDone ? '#10b981' : 'var(--text-muted)'
                  }}
                />
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isCurrent ? 700 : 500,
                    color
                  }}
                >
                  {st}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LoadingState;
