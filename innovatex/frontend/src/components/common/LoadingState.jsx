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
        background: '#0d0d11',
        border: '1px solid #1a1a24',
        borderRadius: '6px',
        margin: '1.5rem 0',
        minHeight: '300px'
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: '#12121a',
          border: '1px solid #232332',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38bdf8',
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
          color: '#38bdf8',
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
          color: 'var(--text-main)',
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
          background: '#121218',
          border: '1px solid #1f1f2c',
          borderRadius: '4px',
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
          const color = isCurrent ? '#38bdf8' : isDone ? '#10b981' : '#52525b';

          return (
            <React.Fragment key={st}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: color
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
                <span style={{ color: '#272732', fontSize: '0.65rem' }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LoadingState;
