import React from 'react';
import { ArrowRight, Activity, TrendingUp, GitPullRequest, Github, BookOpen, Briefcase, Trophy } from 'lucide-react';

const CATEGORY_STYLES = {
  MARKET: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', border: '#38bdf840', icon: TrendingUp },
  GITHUB: { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)', border: '#c084fc40', icon: Github },
  RESEARCH: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#10b98140', icon: BookOpen },
  JOBS: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b40', icon: Briefcase },
  'OPEN SOURCE': { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)', border: '#34d39940', icon: GitPullRequest },
  CONTESTS: { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', border: '#f43f5e40', icon: Trophy }
};

/**
 * SignalCard: High-density editorial signal unit for Overview and feed streams
 */
export const SignalCard = ({
  category = 'MARKET',
  title,
  whatChanged,
  whyItMatters,
  actionLabel,
  onAction,
  metric = null,
  timestamp = 'RECENT'
}) => {
  const conf = CATEGORY_STYLES[category] || CATEGORY_STYLES.MARKET;
  const Icon = conf.icon;

  return (
    <div
      style={{
        background: '#0d0d12',
        border: '1px solid #1a1a24',
        borderRadius: '4px',
        padding: '1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        transition: 'border-color 0.15s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a2a38')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a1a24')}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              padding: '0.15rem 0.45rem',
              borderRadius: '2px',
              background: conf.bg,
              border: `1px solid ${conf.border}`,
              color: conf.color,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Icon size={10} />
            <span>{category}</span>
          </span>
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
            {timestamp}
          </span>
        </div>

        {metric && (
          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: conf.color }}>
            {metric}
          </span>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f4f4f6', margin: '0 0 0.35rem 0' }}>
          {title}
        </h4>
        <div style={{ fontSize: '0.8125rem', color: '#a1a1aa', lineHeight: '1.45' }}>
          <strong style={{ color: '#d4d4d8' }}>What Changed: </strong>{whatChanged}
        </div>
      </div>

      <div
        style={{
          fontSize: '0.78rem',
          color: '#94a3b8',
          background: '#121218',
          border: '1px solid #1a1a24',
          borderRadius: '3px',
          padding: '0.45rem 0.75rem',
          lineHeight: '1.4'
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>Why It Matters: </strong>{whyItMatters}
      </div>

      {actionLabel && onAction && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '0.2rem' }}>
          <button
            type="button"
            onClick={onAction}
            style={{
              background: 'transparent',
              border: 'none',
              color: conf.color,
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              padding: '0.2rem 0'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            <span>{actionLabel}</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * SignalRow: Dense tabular row for signal lists
 */
export const SignalRow = ({
  category = 'MARKET',
  headline,
  metric = null,
  delta = null,
  actionLabel = null,
  onAction = null
}) => {
  const conf = CATEGORY_STYLES[category] || CATEGORY_STYLES.MARKET;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 0.85rem',
        background: '#0d0d12',
        border: '1px solid #181822',
        borderRadius: '3px',
        gap: '1rem',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '220px' }}>
        <span
          style={{
            fontSize: '0.625rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            padding: '0.1rem 0.4rem',
            borderRadius: '2px',
            background: conf.bg,
            border: `1px solid ${conf.border}`,
            color: conf.color
          }}
        >
          {category}
        </span>
        <span style={{ fontSize: '0.8125rem', color: '#e4e4e7', fontWeight: 500 }}>
          {headline}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {metric && (
          <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f4f4f6' }}>
            {metric}
          </span>
        )}
        {delta && (
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: delta.startsWith('+') ? '#10b981' : '#f59e0b' }}>
            {delta}
          </span>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              background: '#14141c',
              border: '1px solid #242432',
              color: '#d4d4d8',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              padding: '0.25rem 0.6rem',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default SignalCard;
