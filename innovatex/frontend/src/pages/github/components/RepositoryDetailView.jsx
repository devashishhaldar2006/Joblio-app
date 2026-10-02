import React, { useState } from 'react';
import {
  ArrowLeft, ExternalLink, Star, GitFork, CheckCircle2,
  XCircle, Sparkles, Code2, Activity, Users, HelpCircle,
  Layers, BookOpen
} from 'lucide-react';

const STATUS_BADGE = {
  Active: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', color: '#10b981' },
  'Recently created': { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.35)', color: '#06b6d4' },
  Stable: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)', color: '#60a5fa' },
  Dormant: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', color: '#f59e0b' },
  Archived: { bg: 'rgba(113, 113, 122, 0.15)', border: 'rgba(113, 113, 122, 0.35)', color: '#a1a1aa' },
};

const DEPTH_BADGE = {
  Flagship: { bg: 'rgba(168, 85, 247, 0.14)', border: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' },
  Supporting: { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.35)', color: '#22d3ee' },
  Experimental: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', color: '#fbbf24' },
  Dormant: { bg: 'rgba(113, 113, 122, 0.12)', border: 'rgba(113, 113, 122, 0.3)', color: '#a1a1aa' },
};

function scoreColor(val) {
  if (val >= 75) return '#10b981';
  if (val >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function RepositoryDetailView({
  repo,
  allRecommendations = [],
  onBack,
  onOpenEvidence,
  onOpenAIAction,
}) {
  const [subTab, setSubTab] = useState('overview');

  if (!repo) return null;

  const lifecycleState = repo.lifecycle_state || repo.status || 'Stable';
  const depthClass = repo.depth_classification || repo.depth_category || 'Supporting';
  const stars = repo.stargazers_count ?? repo.stars ?? 0;
  const forks = repo.forks_count ?? repo.forks ?? 0;
  const watchers = repo.watchers_count ?? repo.community?.watchers ?? 0;
  const openIssues = repo.open_issues_count ?? repo.community?.open_issues ?? 0;
  const daysSincePush = repo.days_since_push ?? repo.maintenance?.days_since_last_push ?? 0;

  const statusStyle = STATUS_BADGE[lifecycleState] || STATUS_BADGE.Stable;
  const depthStyle = DEPTH_BADGE[depthClass] || DEPTH_BADGE.Supporting;

  const breakdown = repo.breakdown || repo.health_breakdown || {};
  const readme = repo.readme || repo.documentation || {};
  const eng = repo.engineering || {};
  const standoutReasons = repo.standout_reasons || repo.why_stands_out || [];
  const gaps = repo.gaps || [];

  const repoRecs = allRecommendations.filter(
    (r) =>
      r.targetRepo === repo.name ||
      (r.title && r.title.toLowerCase().includes(repo.name.toLowerCase()))
  );

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'documentation', label: 'Documentation', icon: BookOpen },
    { id: 'engineering', label: 'Engineering', icon: Code2 },
    { id: 'activity', label: 'Activity & Maintenance', icon: Activity },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'recommendations', label: `Recommendations (${repoRecs.length})`, icon: Sparkles },
  ];

  const handleOpenRepoEvidence = () => {
    onOpenEvidence?.({
      title: `Repository Intelligence: ${repo.name}`,
      category: 'REPOSITORY HEALTH EVIDENCE',
      score: repo.health_score ?? 0,
      maxScore: 100,
      percentage: repo.health_score ?? 0,
      confidence: readme.inspected ? 0.94 : 0.78,
      confidenceLabel: readme.inspected ? 'High confidence' : 'Medium confidence',
      observation: `Health score (${repo.health_score ?? 0}/100) is synthesized from Documentation (${breakdown.documentation ?? 0}/100), Engineering (${breakdown.engineering ?? 0}/100), Maintenance (${breakdown.maintenance ?? 0}/100), Discoverability (${breakdown.discoverability ?? 0}/100), and Community (${breakdown.community ?? 0}/100).`,
      interpretation:
        gaps.length > 0
          ? `Identified repository gaps: ${gaps.join('; ')}.`
          : 'This repository demonstrates healthy documentation, structure, and metadata.',
      reasons: [
        ...standoutReasons,
        ...(readme.missing || []).map((m) => `Missing README signal: ${m}`),
      ],
      evidence: [
        { label: 'Repository Name', value: repo.name },
        { label: 'Lifecycle Status', value: lifecycleState },
        { label: 'Depth Classification', value: `${depthClass} (${repo.depth_score ?? 0}/100)` },
        { label: 'Deep Inspection (Tree + README)', value: readme.inspected ? 'Completed' : 'Metadata-level' },
        { label: 'Primary Language', value: repo.language || 'Not specified' },
        { label: 'README Length', value: `${readme.word_count ?? 0} words (${readme.length ?? 0} chars)` },
        { label: 'Topics Configured', value: String((repo.topics || []).length) },
        { label: 'Days Since Last Push', value: `${daysSincePush} days` },
      ],
      recommendedAction:
        (readme.score ?? 0) < 60
          ? `Generate a structured README for ${repo.name} covering installation, architecture, and usage examples.`
          : `Add topic tags or live deployment links to further improve ${repo.name}'s discoverability.`,
      aiAction: {
        type: 'repo_readme',
        label: `Generate README for ${repo.name}`,
        targetRepo: repo.name,
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 18px',
          background: '#0d0d12',
          border: '1px solid #1f1f26',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 11px',
              borderRadius: 6,
              background: '#14141b',
              border: '1px solid #27272a',
              color: '#e4e4e7',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} /> All Repositories
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#fafafa',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {repo.name}
              </h2>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: statusStyle.bg,
                  border: `1px solid ${statusStyle.border}`,
                  color: statusStyle.color,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {lifecycleState}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: depthStyle.bg,
                  border: `1px solid ${depthStyle.border}`,
                  color: depthStyle.color,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {depthClass}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginTop: 5,
                fontSize: '0.75rem',
                color: '#a1a1aa',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span>{repo.language || 'Multi-language'}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Star size={12} color="#f59e0b" /> {stars} stars
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <GitFork size={12} color="#06b6d4" /> {forks} forks
              </span>
              <span>Updated {daysSincePush}d ago</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleOpenRepoEvidence}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 12px',
              borderRadius: 6,
              background: '#14141b',
              border: '1px solid #27272a',
              color: '#22d3ee',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <HelpCircle size={13} color="#06b6d4" /> Why?
          </button>

          <button
            onClick={() => onOpenAIAction?.('repo_readme', repo.name)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 6,
              background: 'rgba(168, 85, 247, 0.14)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#d8b4fe',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={13} /> Generate README
          </button>

          {repo.html_url && (
            <a
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 6,
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#fafafa',
                fontSize: '0.76rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Open GitHub <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Top Health Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            background: '#0d0d12',
            border: '1px solid #1f1f26',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#71717a',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Repository Health
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0' }}>
            <span
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: scoreColor(repo.health_score || 0),
                fontFamily: 'var(--font-mono)',
                lineHeight: 1,
              }}
            >
              {repo.health_score ?? 0}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
              / 100
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#a1a1aa', lineHeight: 1.4 }}>
            {repo.description || 'No repository description provided.'}
          </div>
        </div>

        {/* 5 Sub-scores */}
        <div
          style={{
            gridColumn: 'span 2',
            padding: '18px 20px',
            background: '#0d0d12',
            border: '1px solid #1f1f26',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#71717a',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Breakdown Across 5 Repository Dimensions
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
            }}
          >
            {[
              { label: 'Documentation', val: breakdown.documentation ?? readme.score ?? 0 },
              { label: 'Engineering', val: breakdown.engineering ?? eng.score ?? 0 },
              { label: 'Maintenance', val: breakdown.maintenance ?? 0 },
              { label: 'Discoverability', val: breakdown.discoverability ?? 0 },
              { label: 'Community', val: breakdown.community ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '10px 12px',
                  background: '#121218',
                  border: '1px solid #1f1f26',
                  borderRadius: 7,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#d4d4d8', fontWeight: 600 }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: scoreColor(item.val),
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {item.val}/100
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 5,
                    background: '#1f1f26',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, item.val))}%`,
                      height: '100%',
                      background: scoreColor(item.val),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid #1f1f26',
          paddingBottom: 8,
          overflowX: 'auto',
        }}
      >
        {subTabs.map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 13px',
                borderRadius: 6,
                background: active ? '#181820' : 'transparent',
                border: active ? '1px solid #2e2e38' : '1px solid transparent',
                color: active ? '#fafafa' : '#a1a1aa',
                fontSize: '0.78rem',
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={13} color={active ? '#06b6d4' : '#71717a'} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab Content */}
      {subTab === 'overview' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 14,
          }}
        >
          {/* AI Quick Actions */}
          <div
            style={{
              padding: '16px 18px',
              background: '#0d0d12',
              border: '1px solid #1f1f26',
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#c084fc',
                fontFamily: 'var(--font-mono)',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={13} /> AI Repository Optimization Actions
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#a1a1aa' }}>
              Generate tailored repository artifacts grounded in your actual codebase structure and signals.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { type: 'repo_readme', label: 'Generate README' },
                { type: 'repo_description', label: 'Generate Description' },
                { type: 'repo_topics', label: 'Generate Topics' },
                { type: 'repo_summary', label: 'Generate Project Summary' },
              ].map((act) => (
                <button
                  key={act.type}
                  onClick={() => onOpenAIAction?.(act.type, repo.name)}
                  style={{
                    padding: '7px 11px',
                    borderRadius: 6,
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#e9d5ff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>

          {/* Why it stands out & Topics */}
          <div
            style={{
              padding: '16px 18px',
              background: '#0d0d12',
              border: '1px solid #1f1f26',
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#71717a',
                fontFamily: 'var(--font-mono)',
                marginBottom: 10,
              }}
            >
              Key Engineering & Discoverability Signals
            </div>
            {standoutReasons.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {standoutReasons.map((sig, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.79rem',
                      color: '#e4e4e7',
                    }}
                  >
                    <CheckCircle2 size={13} color="#10b981" /> {sig}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: 12 }}>
                Limited standout engineering signals detected in public metadata.
              </div>
            )}

            <div style={{ fontSize: '0.72rem', color: '#71717a', marginBottom: 6 }}>
              Repository Topics ({(repo.topics || []).length}):
            </div>
            {(repo.topics || []).length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {repo.topics.map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: '#16161e',
                      border: '1px solid #27272a',
                      color: '#22d3ee',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.76rem', color: '#f59e0b' }}>
                No topics configured. Adding 4–6 topics improves GitHub search discoverability.
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'documentation' && (
        <div
          style={{
            padding: '18px 20px',
            background: '#0d0d12',
            border: '1px solid #1f1f26',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#fafafa' }}>
                README Documentation Audit ({readme.score ?? breakdown.documentation ?? 0}/100)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#a1a1aa' }}>
                {readme.exists
                  ? `README detected (${readme.word_count ?? 0} words, ${readme.length ?? 0} chars). Evaluated across 12 structural documentation signals.`
                  : 'No README file detected in repository root.'}
              </p>
            </div>
            <button
              onClick={() => onOpenAIAction?.('repo_readme', repo.name)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 6,
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#d8b4fe',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={13} /> Generate Improved README
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
            }}
          >
            <div
              style={{
                padding: 14,
                background: '#121218',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#10b981',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Strong Signals ({(readme.strong || []).length})
              </div>
              {(readme.strong || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {readme.strong.map((s) => (
                    <div
                      key={s}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.78rem',
                        color: '#e4e4e7',
                      }}
                    >
                      <CheckCircle2 size={13} color="#10b981" /> {s}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.76rem', color: '#71717a' }}>
                  No verified README sections detected.
                </div>
              )}
            </div>

            <div
              style={{
                padding: 14,
                background: '#121218',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#f59e0b',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Missing Signals ({(readme.missing || []).length})
              </div>
              {(readme.missing || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {readme.missing.map((m) => (
                    <div
                      key={m}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.78rem',
                        color: '#d4d4d8',
                      }}
                    >
                      <XCircle size={13} color="#f59e0b" /> {m}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.76rem', color: '#10b981' }}>
                  All core documentation sections are present!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'engineering' && (
        <div
          style={{
            padding: '18px 20px',
            background: '#0d0d12',
            border: '1px solid #1f1f26',
            borderRadius: 10,
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#fafafa' }}>
            Engineering & Architecture Signals ({eng.score ?? breakdown.engineering ?? 0}/100)
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 10,
              marginBottom: 14,
            }}
          >
            {[
              { label: 'Automated Tests', ok: eng.has_tests },
              { label: 'CI/CD Pipeline', ok: eng.has_ci },
              { label: 'Containerization (Docker)', ok: eng.has_docker },
              { label: 'Dependency Manifest', ok: eng.has_dependency_manifest || eng.has_dependencies },
              { label: 'Config / Linter Hygiene', ok: eng.has_config_hygiene },
              { label: 'Modular Directory Layout', ok: eng.is_modular },
              { label: 'Full-Stack Structure', ok: eng.is_fullstack },
            ].map((sig) => (
              <div
                key={sig.label}
                style={{
                  padding: '10px 12px',
                  background: '#121218',
                  border: '1px solid #1f1f26',
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.78rem',
                  color: sig.ok ? '#fafafa' : '#71717a',
                }}
              >
                {sig.ok ? (
                  <CheckCircle2 size={14} color="#10b981" />
                ) : (
                  <XCircle size={14} color="#52525b" />
                )}
                {sig.label}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              fontSize: '0.76rem',
              color: '#a1a1aa',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>Files inspected: {eng.file_count ?? 0}</span>
            <span>Repository size: {repo.size ?? eng.size_kb ?? 0} KB</span>
            {(eng.top_level_dirs || []).length > 0 && (
              <span>Top-level directories: {eng.top_level_dirs.join(', ')}</span>
            )}
          </div>
        </div>
      )}

      {subTab === 'activity' && (
        <div
          style={{
            padding: '18px 20px',
            background: '#0d0d12',
            border: '1px solid #1f1f26',
            borderRadius: 10,
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#fafafa' }}>
            Maintenance & Lifecycle Telemetry ({breakdown.maintenance ?? 0}/100)
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            <div style={{ padding: 12, background: '#121218', borderRadius: 8, border: '1px solid #1f1f26' }}>
              <div style={{ fontSize: '0.7rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                LIFECYCLE STATUS
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: statusStyle.color, marginTop: 4 }}>
                {lifecycleState}
              </div>
            </div>
            <div style={{ padding: 12, background: '#121218', borderRadius: 8, border: '1px solid #1f1f26' }}>
              <div style={{ fontSize: '0.7rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                DAYS SINCE LAST PUSH
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fafafa', marginTop: 4 }}>
                {daysSincePush} days
              </div>
            </div>
            <div style={{ padding: 12, background: '#121218', borderRadius: 8, border: '1px solid #1f1f26' }}>
              <div style={{ fontSize: '0.7rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                CREATED AT
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d4d4d8', marginTop: 4 }}>
                {repo.created_at ? new Date(repo.created_at).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
            <div style={{ padding: 12, background: '#121218', borderRadius: 8, border: '1px solid #1f1f26' }}>
              <div style={{ fontSize: '0.7rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                LAST PUSHED AT
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d4d4d8', marginTop: 4 }}>
                {repo.pushed_at ? new Date(repo.pushed_at).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'community' && (
        <div
          style={{
            padding: '18px 20px',
            background: '#0d0d12',
            border: '1px solid #1f1f26',
            borderRadius: 10,
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#fafafa' }}>
            Community & Collaboration Signals ({breakdown.community ?? 0}/100)
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            {[
              { label: 'Stars', val: stars },
              { label: 'Forks', val: forks },
              { label: 'Watchers', val: watchers },
              { label: 'Open Issues', val: openIssues },
              { label: 'License Configured', val: repo.license || 'None' },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  padding: 12,
                  background: '#121218',
                  border: '1px solid #1f1f26',
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                  {c.label}
                </div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#fafafa',
                    marginTop: 4,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {c.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'recommendations' && (
        <div
          style={{
            padding: '18px 20px',
            background: '#0d0d12',
            border: '1px solid #1f1f26',
            borderRadius: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#fafafa' }}>
            Repository-Specific Recommendations
          </h3>
          {repoRecs.length > 0 ? (
            repoRecs.map((rec) => (
              <div
                key={rec.id}
                style={{
                  padding: 14,
                  background: '#121218',
                  border: '1px solid #1f1f26',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fafafa' }}>
                    {rec.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#a1a1aa', marginTop: 4 }}>
                    {rec.rationale || rec.observation}
                  </div>
                </div>
                {rec.aiAction && (
                  <button
                    onClick={() => onOpenAIAction?.(rec.aiAction.type, repo.name)}
                    style={{
                      padding: '6px 11px',
                      borderRadius: 6,
                      background: 'rgba(168, 85, 247, 0.14)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#d8b4fe',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {rec.aiAction.label || 'AI Fix'}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
              No critical gaps flagged specifically for {repo.name}. You can still use the AI actions in the Overview tab to refine its README or topics.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
