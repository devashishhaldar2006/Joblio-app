import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';
import {
  Search,
  Star,
  GitFork,
  BookMarked,
  Users,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Code2,
  Terminal,
  Layers,
  Sparkles,
  Award,
  ArrowRight
} from 'lucide-react';

const GithubAnalyzerPage = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const loadingMessages = [
    'Fetching real GitHub profile & public repositories...',
    'Analyzing commit cadences & documentation ergonomics...',
    'Calculating multi-tier category metrics with LangGraph...',
    'Generating 6 actionable recruiter-focused improvements with Llama 3.3 70B (Groq)...'
  ];

  const handleAnalyze = async (e, customUser) => {
    if (e) e.preventDefault();
    const targetUser = customUser || username;
    if (!targetUser.trim()) return;

    setError('');
    setLoading(true);
    setReport(null);

    try {
      const res = await api.post('/github/analyze', { username: targetUser.trim() });
      setReport(res.data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.error || 'Failed to analyze GitHub profile. Verify username or check GitHub API limit.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScan = (name) => {
    setUsername(name);
    handleAnalyze(null, name);
  };

  const getPriorityStyle = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'high') {
      return {
        borderColor: '#ef4444',
        badgeBg: 'rgba(239, 68, 68, 0.15)',
        badgeText: '#ef4444',
        tagText: 'HIGH PRIORITY'
      };
    }
    if (p === 'medium') {
      return {
        borderColor: '#f59e0b',
        badgeBg: 'rgba(245, 158, 11, 0.15)',
        badgeText: '#f59e0b',
        tagText: 'MEDIUM PRIORITY'
      };
    }
    return {
      borderColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeText: '#10b981',
      tagText: 'LOW PRIORITY'
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Navbar title="GitHub Profile Intelligence" subtitle="LangGraph multi-agent profile scoring & audit engine" />

      <div className="page-container" style={{ maxWidth: '1440px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Search Console Header */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: '1rem',
          position: 'relative'
        }}>
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(128, 131, 255, 0.15) 0%, rgba(87, 27, 193, 0.08) 50%, transparent 80%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-container-high)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--tertiary)', boxShadow: '0 0 8px rgba(78,222,163,0.8)' }} />
              <span className="font-label-code" style={{ color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                Telemetry Engine Active
              </span>
              <span className="font-label-code" style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                / v2.4.8
              </span>
            </div>

            <h1 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
              GitHub Profile Intelligence
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem', maxWidth: '640px', lineHeight: '1.6' }}>
              Deconstruct commit dynamics, repository ergonomics, and codebase impact through automated AST and contribution graph forensics.
            </p>

            {/* Command Search Bar */}
            <div style={{ width: '100%', maxWidth: '680px', marginTop: '1.75rem' }}>
              <form
                onSubmit={handleAnalyze}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '0.4rem 0.5rem 0.4rem 1.25rem',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                  gap: '0.75rem'
                }}
              >
                <Terminal size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <input
                  type="text"
                  required
                  placeholder="Enter GitHub username (e.g. torvalds, karpathy, shadcn)..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="font-label-code"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--on-surface)',
                    fontSize: '0.95rem',
                    padding: '0.5rem 0',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--inverse-primary), var(--primary-container), var(--secondary-container))',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    boxShadow: '0 0 20px rgba(128, 131, 255, 0.35)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: 'none'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>radar</span>
                  <span>{loading ? 'Analyzing...' : 'Analyze Profile'}</span>
                </button>
              </form>

              {/* Quick Scans */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.9rem' }}>
                <span className="font-label-caps" style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>QUICK SCANS:</span>
                {['torvalds', 'karpathy', 'shadcn', 'gaearon'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleQuickScan(preset)}
                    className="font-label-code"
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--on-surface-variant)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--on-surface-variant)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    @{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Error Notification */}
        {error && (
          <div style={{
            maxWidth: '720px',
            margin: '0 auto',
            width: '100%',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            color: '#fda4af',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertTriangle size={18} color="#fda4af" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="glass-panel" style={{ maxWidth: '640px', margin: '3rem auto', padding: '2.5rem', width: '100%' }}>
            <LoadingSpinner messages={loadingMessages} />
          </div>
        )}

        {/* Report Output */}
        {report && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Action Bar / Reset */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="font-label-code" style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Telemetry Audit Completed for</span>
                <h2 className="font-headline-md" style={{ color: 'var(--on-surface)' }}>@{report.username}</h2>
              </div>
              <button
                onClick={() => { setReport(null); setUsername(''); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--on-surface)',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={15} />
                <span>Analyze Another</span>
              </button>
            </div>

            {/* Top Identity & Gauge Grid */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '1.5rem'
            }}>
              
              {/* Identity Card */}
              <div className="glass-card" style={{
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ position: 'absolute', right: '-3rem', top: '-3rem', width: '12rem', height: '12rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(40px)', pointerEvents: 'none' }} />
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={report.avatar_url}
                        alt={report.username}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-container)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'var(--tertiary)',
                        border: '2px solid var(--surface-container-low)',
                        boxShadow: '0 0 8px rgba(78, 222, 163, 0.9)'
                      }} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h3 className="font-headline-md" style={{ color: 'var(--on-surface)', lineHeight: 1.2 }}>
                          {report.name || report.username}
                        </h3>
                        <span className="font-label-code" style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--secondary-container)', color: 'var(--secondary)', fontSize: '0.75rem' }}>
                          @{report.username}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)', marginTop: '0.4rem', lineHeight: '1.4' }}>
                        {report.bio || 'Public open-source developer profile analyzed via LangGraph pipeline.'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.25rem' }}>
                    <a
                      href={report.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-container-high)',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>github.com/{report.username}</span>
                    </a>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-container-high)',
                      color: 'var(--tertiary)',
                      fontSize: '0.8rem'
                    }}>
                      <CheckCircle2 size={13} />
                      <span>Public Telemetry Synced</span>
                    </div>
                  </div>
                </div>

                {/* Sub Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  paddingTop: '1.25rem',
                  marginTop: '1.25rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="font-label-caps" style={{ color: 'var(--text-dim)' }}>REPOS</span>
                    <span className="font-label-code" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)' }}>{report.public_repos}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="font-label-caps" style={{ color: 'var(--text-dim)' }}>STARS</span>
                    <span className="font-label-code" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{report.total_stars}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="font-label-caps" style={{ color: 'var(--text-dim)' }}>FORKS</span>
                    <span className="font-label-code" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--tertiary)' }}>{report.total_forks}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="font-label-caps" style={{ color: 'var(--text-dim)' }}>FOLLOWERS</span>
                    <span className="font-label-code" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}>{report.followers}</span>
                  </div>
                </div>
              </div>

              {/* Developer Score & Gauge Card */}
              <div className="glass-card" style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
                  {/* SVG Circular Gauge */}
                  <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-container-highest)" strokeWidth="9" />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="url(#stitch-score-grad)"
                        strokeWidth="9"
                        strokeDasharray="314.159"
                        strokeDashoffset={`${314.159 - (314.159 * (report.overall_score || 0)) / 100}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                      />
                      <defs>
                        <linearGradient id="stitch-score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4edea3" />
                          <stop offset="100%" stopColor="#8083ff" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="font-display" style={{ fontSize: '2.4rem', fontWeight: 700, lineHeight: 1, color: 'var(--on-surface)' }}>
                        {report.overall_score}
                      </span>
                      <span className="font-label-code" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        / 100
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(78, 222, 163, 0.12)',
                      border: '1px solid rgba(78, 222, 163, 0.3)',
                      color: 'var(--tertiary)'
                    }}>
                      <Award size={14} />
                      <span className="font-label-code" style={{ fontWeight: 600 }}>Elite Developer Benchmark</span>
                    </div>
                    <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)', marginTop: '0.5rem' }}>
                      Overall Profile Score
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                      Calculated across profile completion, documentation density, commit cadences, and open-source impact.
                    </p>
                  </div>
                </div>

                {/* 4 Category Breakdown Bars */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  paddingTop: '1.25rem',
                  marginTop: '1.25rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  {report.category_scores && [
                    { label: 'Completeness', val: report.category_scores.completeness_score, max: 25, color: 'var(--tertiary)' },
                    { label: 'Repo Quality', val: report.category_scores.quality_score, max: 35, color: 'var(--primary)' },
                    { label: 'Activity Cadence', val: report.category_scores.activity_score, max: 25, color: 'var(--secondary)' },
                    { label: 'Community Impact', val: report.category_scores.community_score, max: 15, color: 'var(--accent-amber)' }
                  ].map((cat) => (
                    <div key={cat.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--on-surface-variant)' }}>{cat.label}</span>
                        <span className="font-label-code" style={{ color: cat.color, fontWeight: 600 }}>{cat.val} / {cat.max}</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--surface-container-highest)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (cat.val / cat.max) * 100)}%`,
                          background: cat.color,
                          borderRadius: '9999px'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Repositories & Language Matrix */}
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Top Repositories */}
              <div className="glass-panel" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>terminal</span>
                    <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>Top Tier Repositories</h3>
                  </div>
                  <span className="font-label-code" style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Ranked by stars</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {report.best_repos && report.best_repos.length > 0 ? (
                    report.best_repos.map((r) => (
                      <div
                        key={r.name}
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--surface-container-low)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className="font-label-code" style={{
                            padding: '0.15rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--surface-container-high)',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.75rem'
                          }}>
                            {r.language || 'Code'}
                          </span>
                          <a href={r.html_url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-dim)' }}>
                            <ExternalLink size={14} />
                          </a>
                        </div>

                        <h4 style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--on-surface)' }}>
                          <a href={r.html_url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                            {r.name}
                          </a>
                        </h4>

                        <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', lineHeight: '1.4' }}>
                          {r.description || 'No description provided.'}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-amber)' }}>
                            <Star size={13} fill="var(--accent-amber)" />
                            <span>{r.stargazers_count}</span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <GitFork size={13} />
                            <span>{r.forks_count} forks</span>
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No public repositories found.</p>
                  )}
                </div>
              </div>

              {/* Language Distribution */}
              <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>pie_chart</span>
                      <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>Language Matrix</h3>
                    </div>
                    <span className="font-label-code" style={{ color: 'var(--tertiary)' }}>Polyglot Audit</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>
                    Primary codebase language breakdown across all public repositories.
                  </p>

                  {report.language_distribution && report.language_distribution.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Multi-segmented stacked bar */}
                      <div style={{
                        width: '100%',
                        height: '14px',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        display: 'flex',
                        background: 'var(--surface-container-highest)',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
                      }}>
                        {report.language_distribution.map((lang, idx) => {
                          const colors = ['#38bdf8', '#fbbf24', '#c084fc', '#4edea3', '#f43f5e', '#a855f7'];
                          return (
                            <div
                              key={lang.name}
                              style={{
                                width: `${lang.percentage}%`,
                                height: '100%',
                                background: colors[idx % colors.length]
                              }}
                              title={`${lang.name}: ${lang.percentage}%`}
                            />
                          );
                        })}
                      </div>

                      {/* Legend Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                        {report.language_distribution.map((lang, idx) => {
                          const colors = ['#38bdf8', '#fbbf24', '#c084fc', '#4edea3', '#f43f5e', '#a855f7'];
                          return (
                            <div
                              key={lang.name}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--surface-container-low)'
                              }}
                            >
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors[idx % colors.length] }} />
                              <span style={{ fontSize: '0.85rem', color: 'var(--on-surface)', flex: 1 }}>{lang.name}</span>
                              <span className="font-label-code" style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{lang.percentage}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No language telemetry available.</p>
                  )}
                </div>

                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-container-high)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '1.5rem',
                  fontSize: '0.82rem'
                }}>
                  <span style={{ color: 'var(--on-surface-variant)' }}>Compiler Diagnostics:</span>
                  <span className="font-label-code" style={{ color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={14} /> Clean Telemetry
                  </span>
                </div>
              </div>
            </section>

            {/* 6 Actionable Algorithmic Improvements Directives */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>auto_fix_high</span>
                    <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>
                      Algorithmic Improvement Directives (Llama 3.3 70B Groq)
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
                    Actionable interventions prioritized by algorithmic multiplier and recruiter visibility score.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '1.25rem'
              }}>
                {report.improvements && report.improvements.map((item, idx) => {
                  const priStyle = getPriorityStyle(item.priority);
                  return (
                    <div
                      key={idx}
                      className="glass-card"
                      style={{
                        padding: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden',
                        borderLeft: `5px solid ${priStyle.borderColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span className="font-label-caps" style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            background: priStyle.badgeBg,
                            color: priStyle.badgeText,
                            fontWeight: 700
                          }}>
                            {priStyle.tagText}
                          </span>
                          <span className="font-label-code" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {item.category}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                          {item.issue}
                        </h4>
                        <p style={{ fontSize: '0.86rem', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
                          <strong>Action:</strong> {item.action}
                        </p>
                      </div>

                      <div style={{
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        color: 'var(--tertiary)'
                      }}>
                        <CheckCircle2 size={15} />
                        <span><strong>Expected Impact:</strong> {item.impact}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  );
};

export default GithubAnalyzerPage;
