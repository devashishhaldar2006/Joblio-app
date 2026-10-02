import React, { useEffect } from 'react';
import { X, Database, ShieldCheck, Clock, ExternalLink, Sparkles } from 'lucide-react';

/**
 * Reusable Evidence Drawer (<EvidenceDrawer />) — Section 17
 * Displays Source, Observed Data, Observation, Interpretation, Recommendation, Confidence, and Sync Timestamp.
 */
const EvidenceDrawer = ({
  isOpen,
  onClose,
  evidenceData,
  evidence: evidenceProp,
  syncedAt,
  methodologyVersion = 'v2.1',
  onTriggerAiFix = null
}) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const payload = evidenceData || evidenceProp;
  if (!isOpen || !payload) return null;

  const {
    title = 'Analytical Evidence',
    category = 'DIMENSION EVIDENCE',
    score = null,
    maxScore = null,
    percentage = payload.score != null && payload.maxScore ? Math.round((payload.score / payload.maxScore) * 100) : null,
    confidence = 0.92,
    confidenceLabel = 'High confidence',
    observation = payload.analysis || '',
    interpretation = payload.explanation || '',
    reasons = [],
    evidence: rawEvidence = [],
    observed = null,
    repositories = [],
    recommendedAction = payload.recommendation || null,
    aiAction = null
  } = payload;

  const evidence = Array.isArray(rawEvidence) && rawEvidence.length > 0
    ? rawEvidence
    : observed && typeof observed === 'object'
      ? Object.entries(observed).map(([k, v]) => ({
          label: k,
          value: Array.isArray(v) ? v.join(', ') : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)
        }))
      : [];

  const confColor =
    confidence >= 0.85 ? '#10b981' : confidence >= 0.6 ? '#f59e0b' : '#f43f5e';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Evidence for ${title}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(0, 0, 0, 0.76)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          height: '100%',
          background: '#0b0b0f',
          borderLeft: '1px solid #20202c',
          boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.15rem 1.35rem',
            borderBottom: '1px solid #1a1a24',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            position: 'sticky',
            top: 0,
            background: '#0b0b0f',
            zIndex: 10
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  background: '#13131c',
                  border: '1px solid #252536',
                  color: '#38bdf8',
                  textTransform: 'uppercase'
                }}
              >
                {category}
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${confColor}44`,
                  color: confColor
                }}
              >
                {confidenceLabel} ({Math.round(confidence * 100)}%)
              </span>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f4f4f6', margin: 0 }}>
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Evidence Drawer"
            style={{
              background: '#14141c',
              border: '1px solid #232332',
              borderRadius: '4px',
              padding: '0.35rem',
              color: '#a1a1aa',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
          {/* Source & Methodology Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.65rem',
              background: '#0f0f15',
              border: '1px solid #1c1c26',
              borderRadius: '4px',
              padding: '0.75rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                SOURCE
              </div>
              <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                <Database size={12} color="#38bdf8" />
                <span>GitHub Public API v3</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                METHODOLOGY
              </div>
              <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                <ShieldCheck size={12} color="#10b981" />
                <span>Engine {methodologyVersion}</span>
              </div>
            </div>
          </div>

          {/* Score Callout if applicable */}
          {score !== null && maxScore !== null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                background: '#101017',
                border: '1px solid #1e1e2c',
                borderRadius: '4px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                  COMPUTED SCORE
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f4f4f6' }}>
                  {score} <span style={{ fontSize: '0.85rem', color: '#71717a' }}>/ {maxScore}</span>
                </div>
              </div>
              {percentage !== null && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                    DIMENSION RATIO
                  </div>
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: percentage >= 75 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#f43f5e'
                    }}
                  >
                    {percentage}%
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Observed Data Table */}
          {evidence && evidence.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#71717a', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                OBSERVED DATA
              </div>
              <div
                style={{
                  border: '1px solid #1c1c26',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: '#0e0e13'
                }}
              >
                {evidence.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.55rem 0.85rem',
                      borderBottom: idx < evidence.length - 1 ? '1px solid #181822' : 'none',
                      fontSize: '0.78rem',
                      gap: '1rem'
                    }}
                  >
                    <span style={{ color: '#a1a1aa' }}>{item.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#f4f4f6', fontWeight: 600, textAlign: 'right' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytical Principles: Observation -> Interpretation -> Signals */}
          {(observation || interpretation || (reasons && reasons.length > 0)) && (
            <div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#71717a', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                ANALYSIS & INTERPRETATION
              </div>
              <div
                style={{
                  background: '#0f0f15',
                  border: '1px solid #1c1c26',
                  borderRadius: '4px',
                  padding: '0.9rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.82rem',
                  lineHeight: 1.5
                }}
              >
                {observation && (
                  <div>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', display: 'block', marginBottom: '2px' }}>
                      OBSERVATION
                    </span>
                    <span style={{ color: '#e4e4e7' }}>{observation}</span>
                  </div>
                )}

                {interpretation && (
                  <div>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#f59e0b', display: 'block', marginBottom: '2px' }}>
                      WHY IT MATTERS
                    </span>
                    <span style={{ color: '#a1a1aa' }}>{interpretation}</span>
                  </div>
                )}

                {reasons && reasons.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#10b981', display: 'block', marginBottom: '4px' }}>
                      SUPPORTING SIGNALS
                    </span>
                    <ul style={{ paddingLeft: '1.1rem', color: '#d4d4d8', display: 'flex', flexDirection: 'column', gap: '0.3rem', margin: 0 }}>
                      {reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Associated Repositories */}
          {repositories && repositories.length > 0 && (
            <div>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#71717a', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                OBSERVED IN REPOSITORIES ({repositories.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {repositories.map((repoName) => (
                  <span
                    key={repoName}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      padding: '0.25rem 0.55rem',
                      background: '#12121a',
                      border: '1px solid #222230',
                      borderRadius: '3px',
                      color: '#38bdf8'
                    }}
                  >
                    {repoName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Action & AI Fix Trigger */}
          {(recommendedAction || aiAction) && (
            <div
              style={{
                background: 'rgba(168, 85, 247, 0.06)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '4px',
                padding: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              {recommendedAction && (
                <div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#c084fc', fontWeight: 700, marginBottom: '2px' }}>
                    RECOMMENDED ACTION
                  </div>
                  <div style={{ fontSize: '0.81rem', color: '#e4e4e7', lineHeight: 1.45 }}>
                    {recommendedAction}
                  </div>
                </div>
              )}

              {aiAction && onTriggerAiFix && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerAiFix(aiAction.type, aiAction.targetRepo);
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    display: ' inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.42rem 0.8rem',
                    borderRadius: '4px',
                    background: 'rgba(168, 85, 247, 0.16)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#e9d5ff',
                    fontSize: '0.76rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={13} />
                  <span>{aiAction.label || 'Generate AI Fix'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Sync Metadata */}
        <div
          style={{
            padding: '0.75rem 1.35rem',
            borderTop: '1px solid #181822',
            background: '#09090c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: '#71717a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={12} />
            <span>Last synchronized: {syncedAt ? new Date(syncedAt).toLocaleString() : 'Current session'}</span>
          </div>
          <span>VERIFIABLE TELEMETRY</span>
        </div>
      </div>
    </div>
  );
};

export default EvidenceDrawer;
