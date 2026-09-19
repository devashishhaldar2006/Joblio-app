import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  Github,
  BookOpen,
  GitPullRequest,
  Trophy,
  Briefcase,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Share2,
  TrendingUp,
  Activity,
  Code2,
  FileCheck,
  Award,
  Layers,
  Zap,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    analysesCount: 0,
    papersCount: 0,
    jobsCount: 0,
    upcomingContestsCount: 0
  });
  const [recentActivity, setRecentActivity] = useState({
    lastGithub: null,
    lastPaper: null,
    lastJobSearch: null,
    todayContests: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [ghRes, paperRes, jobRes, contestRes] = await Promise.allSettled([
        api.get('/github/history'),
        api.get('/research/history'),
        api.get('/jobs/history'),
        api.get('/contests?days=1')
      ]);

      const ghHistory = ghRes.status === 'fulfilled' ? ghRes.value.data : [];
      const paperHistory = paperRes.status === 'fulfilled' ? paperRes.value.data : [];
      const jobHistory = jobRes.status === 'fulfilled' ? jobRes.value.data : [];
      const todayContests = contestRes.status === 'fulfilled' ? contestRes.value.data : [];

      setStats({
        analysesCount: ghHistory.length,
        papersCount: paperHistory.length,
        jobsCount: jobHistory.reduce((acc, curr) => acc + (curr.results?.length || 0), 0),
        upcomingContestsCount: todayContests.length
      });

      setRecentActivity({
        lastGithub: ghHistory[0] || null,
        lastPaper: paperHistory[0] || null,
        lastJobSearch: jobHistory[0] || null,
        todayContests: todayContests.slice(0, 3)
      });
    } catch (err) {
      console.error('Failed to load dashboard activities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickSync = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const modules = [
    {
      title: 'GitHub Profile Analyzer',
      subtitle: `${stats.analysesCount} analyzed`,
      description: 'Comprehensive score breakdown, repo quality metrics, commit cadence analysis, and algorithmic contribution audit.',
      icon: 'fork_right',
      to: '/github',
      badgeText: 'LangGraph Pipeline',
      accentColor: 'var(--primary)',
      bgGrad: 'from-primary/15 via-transparent to-transparent',
      statusText: 'Audit Ready',
      buttonText: 'Launch Analyzer'
    },
    {
      title: 'Research Paper Agent',
      subtitle: `${stats.papersCount} papers saved`,
      description: 'ArXiv paper simplifier, mathematical intuition generator, automated ablation notes, and citation graph finder.',
      icon: 'psychology',
      to: '/research',
      badgeText: 'Llama 3.3 70B (Groq)',
      accentColor: 'var(--secondary)',
      bgGrad: 'from-secondary/15 via-transparent to-transparent',
      statusText: 'Deep Synthesis Active',
      buttonText: 'Explore Papers'
    },
    {
      title: 'Open Source Finder',
      subtitle: 'Curated First Issues',
      description: 'Discover beginner-to-advanced issues matched to your tech stack with automated setup steps and PR scaffolding guides.',
      icon: 'hub',
      to: '/opensource',
      badgeText: 'Live GitHub Search',
      accentColor: 'var(--tertiary)',
      bgGrad: 'from-tertiary/15 via-transparent to-transparent',
      statusText: 'Active Index',
      buttonText: 'Find Issues'
    },
    {
      title: 'CP Contest Tracker',
      subtitle: `${stats.upcomingContestsCount} live today`,
      description: 'Live calendar and real-time countdowns covering Codeforces, LeetCode, CodeChef, and AtCoder with rating telemetry.',
      icon: 'emoji_events',
      to: '/contests',
      badgeText: '7+ Platforms',
      accentColor: 'var(--secondary-fixed)',
      bgGrad: 'from-secondary-fixed/15 via-transparent to-transparent',
      statusText: 'Synced Calendars',
      buttonText: 'View Schedule'
    },
    {
      title: 'Multi-Agent Job Matcher',
      subtitle: `${stats.jobsCount} roles scored`,
      description: 'Semantic resume parsing, ATS scoring, and gap analysis with automated multi-agent queries across live job boards.',
      icon: 'work',
      to: '/jobs',
      badgeText: '6 Autonomous Agents',
      accentColor: 'var(--primary-container)',
      bgGrad: 'from-primary-container/20 via-transparent to-transparent',
      statusText: 'Live JSearch',
      buttonText: 'Browse Roles'
    },
    {
      title: 'Market Intelligence',
      subtitle: '570+ skills tracked',
      description: 'Track skill demand forecasts powered by live job data with Facebook Prophet, auto-selected ARIMA, and personalized gap analysis.',
      icon: 'trending_up',
      to: '/market',
      badgeText: 'Prophet + ARIMA ML',
      accentColor: '#38bdf8',
      bgGrad: 'from-cyan-500/15 via-transparent to-transparent',
      statusText: 'Real JSearch Telemetry',
      buttonText: 'View Market →'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Navbar title="Intelligence Dashboard" subtitle={`Command Center // ${user?.email || 'Engineer'}`} />

      <div className="page-container" style={{ maxWidth: '1440px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Top Greeting & Command Telemetry Bar */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '1.5rem',
          paddingTop: '0.5rem'
        }}>
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-3rem',
            left: '-2rem',
            width: '18rem',
            height: '18rem',
            borderRadius: '50%',
            background: 'rgba(87, 27, 193, 0.15)',
            filter: 'blur(90px)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '750px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--tertiary)',
                boxShadow: '0 0 10px rgba(78, 222, 163, 0.8)'
              }} />
              <span className="font-label-code" style={{ color: 'var(--tertiary)', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                Node Mesh: Synced • 14ms latency
              </span>
            </div>
            <h1 className="font-display" style={{ fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-surface)', marginBottom: '0.4rem' }}>
              Good morning, <span className="text-gradient">{user?.name || 'Engineer'}</span>
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Here is your developer intelligence digest and activity across your research telemetry, algorithmic pipelines, and career vectors.
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleQuickSync}
              disabled={refreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-container-high)',
                color: 'var(--on-surface)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.88rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-container-high)')}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} style={{ color: 'var(--primary)' }} />
              <span>{refreshing ? 'Syncing...' : 'Quick Sync'}</span>
            </button>

            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--primary-container), var(--secondary-container))',
                color: '#fff',
                fontSize: '0.88rem',
                fontWeight: 600,
                boxShadow: '0 0 20px rgba(128, 131, 255, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Share2 size={16} />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Rollup Telemetry Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Metric 1: Profile Score */}
          <div className="glass-card" style={{
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px'
          }}>
            <div style={{ position: 'absolute', right: '-1.5rem', bottom: '-1.5rem', width: '6rem', height: '6rem', borderRadius: '50%', background: 'rgba(192, 193, 255, 0.08)', filter: 'blur(20px)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)' }}>PROFILE AUDIT SCORE</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>insights</span>
            </div>
            <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span className="font-display" style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>
                {recentActivity.lastGithub?.report?.overall_score || 94}
              </span>
              <span className="font-label-code" style={{ color: 'var(--text-dim)' }}>/100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, background: 'var(--surface-container-highest)', height: '6px', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${recentActivity.lastGithub?.report?.overall_score || 94}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                  borderRadius: '9999px'
                }} />
              </div>
              <span className="font-label-code" style={{ color: 'var(--tertiary)', fontWeight: 600 }}>+3.2%</span>
            </div>
          </div>

          {/* Metric 2: Papers Summarized */}
          <div className="glass-card" style={{
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px'
          }}>
            <div style={{ position: 'absolute', right: '-1.5rem', bottom: '-1.5rem', width: '6rem', height: '6rem', borderRadius: '50%', background: 'rgba(208, 188, 255, 0.08)', filter: 'blur(20px)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)' }}>PAPERS SUMMARIZED</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '1.4rem' }}>auto_stories</span>
            </div>
            <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span className="font-display" style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>{stats.papersCount}</span>
              <span className="font-label-code" style={{ color: 'var(--text-dim)' }}>ArXiv docs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
              <span>NLP & LLM architectures</span>
              <span className="font-label-code" style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--primary)' }}>DeepSeek / ArXiv</span>
            </div>
          </div>

          {/* Metric 3: OSS Issues & PRs */}
          <div className="glass-card" style={{
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px'
          }}>
            <div style={{ position: 'absolute', right: '-1.5rem', bottom: '-1.5rem', width: '6rem', height: '6rem', borderRadius: '50%', background: 'rgba(78, 222, 163, 0.08)', filter: 'blur(20px)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)' }}>ISSUES & PR ASSISTANT</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '1.4rem' }}>terminal</span>
            </div>
            <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span className="font-display" style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>14k+</span>
              <span className="font-label-code" style={{ color: 'var(--text-dim)' }}>Good First Repos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
              <span>Live code review engine</span>
              <span className="font-label-code" style={{ color: 'var(--tertiary)', fontWeight: 600 }}>Active</span>
            </div>
          </div>

          {/* Metric 4: Live Contests */}
          <div className="glass-card" style={{
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px'
          }}>
            <div style={{ position: 'absolute', right: '-1.5rem', bottom: '-1.5rem', width: '6rem', height: '6rem', borderRadius: '50%', background: 'rgba(233, 221, 255, 0.08)', filter: 'blur(20px)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)' }}>UPCOMING CONTESTS</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary-fixed)', fontSize: '1.4rem' }}>emoji_events</span>
            </div>
            <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span className="font-display" style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>{stats.upcomingContestsCount}</span>
              <span className="font-label-code" style={{ color: 'var(--secondary-fixed)' }}>Live Next 24h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                {recentActivity.todayContests[0]?.title || 'Codeforces / LeetCode'}
              </span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary-fixed)', boxShadow: '0 0 8px rgba(208, 188, 255, 0.9)' }} />
            </div>
          </div>
        </div>

        {/* Intelligence Engines Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>token</span>
              <h2 className="font-headline-md" style={{ color: 'var(--on-surface)' }}>Intelligence Engines</h2>
            </div>
            <span className="font-label-code" style={{ color: 'var(--text-dim)' }}>Select module to expand telemetry</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.5rem'
          }}>
            {modules.map((m) => (
              <div
                key={m.title}
                className="glass-card"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '260px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--surface-container-high)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: m.accentColor
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.6rem' }}>{m.icon}</span>
                    </div>
                    <span className="font-label-caps" style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: m.accentColor
                    }}>
                      {m.badgeText}
                    </span>
                  </div>

                  <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)', marginBottom: '0.4rem' }}>
                    {m.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
                    {m.description}
                  </p>
                </div>

                <div style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--tertiary)' }} />
                    <span className="font-label-code" style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{m.statusText}</span>
                  </div>
                  <Link
                    to={m.to}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: m.accentColor
                    }}
                  >
                    <span>{m.buttonText}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Intelligence Events & Signals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
          
          {/* Left: Recent Activity Feed */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>history</span>
                <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>Recent Signals</h3>
              </div>
              <span className="font-label-code" style={{ color: 'var(--text-dim)' }}>Live Activity</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* GitHub */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-container-low)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>code</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {recentActivity.lastGithub ? `@${recentActivity.lastGithub.username}` : 'No profile analyzed'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {recentActivity.lastGithub ? `Overall score: ${recentActivity.lastGithub.report?.overall_score || 0}/100` : 'Run your first audit'}
                    </div>
                  </div>
                </div>
                <Link to="/github" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Launch &rarr;
                </Link>
              </div>

              {/* Research */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-container-low)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>psychology</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', lineClamp: 1, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                      {recentActivity.lastPaper?.output?.title || 'No paper summarized'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {recentActivity.lastPaper ? `Level: ${recentActivity.lastPaper.output?.explanation?.difficulty_level || 'General'}` : 'ArXiv / Semantic Scholar'}
                    </div>
                  </div>
                </div>
                <Link to="/research" style={{ color: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Launch &rarr;
                </Link>
              </div>

              {/* Jobs */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-container-low)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-container)', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>work</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {stats.jobsCount > 0 ? `${stats.jobsCount} Live Matches Found` : 'Resume Matching'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Multi-agent JSearch vector
                    </div>
                  </div>
                </div>
                <Link to="/jobs" style={{ color: 'var(--primary-container)', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Launch &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Today's CP Contests Calendar Snapshot */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>schedule</span>
                <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>Live Contests Today</h3>
              </div>
              <span className="font-label-code" style={{ color: 'var(--tertiary)' }}>7 Platforms</span>
            </div>

            {recentActivity.todayContests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {recentActivity.todayContests.map((c, idx) => (
                  <div key={idx} style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-container-low)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--on-surface)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Platform: <span style={{ color: 'var(--secondary)' }}>{c.platform}</span>
                      </div>
                    </div>
                    <span className="font-label-code" style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-high)', color: 'var(--tertiary)', fontSize: '0.75rem' }}>
                      Active
                    </span>
                  </div>
                ))}
                <Link to="/contests" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>View full 7-day contest calendar</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_forward</span>
                </Link>
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Checking live contest schedules across Codeforces, LeetCode, CodeChef...</p>
                <Link to="/contests" className="btn-secondary" style={{ fontSize: '0.82rem' }}>
                  Open Contests Hub
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
