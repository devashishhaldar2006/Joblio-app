import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { RefreshCw, ArrowUpRight, Search } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActionModal, setSelectedActionModal] = useState(false);

  const [telemetry, setTelemetry] = useState({
    analysesCount: 1,
    papersCount: 5,
    jobsCount: 14,
    upcomingContestsCount: 4,
    ossOpportunitiesCount: 3,
    profileScore: 77,
    scoreDelta: '+8',
    lastScore: 69,
    topSkill: 'TypeScript',
    topSkillChange: '+12.4%',
    githubUsername: ''
  });

  const fetchDashboardData = async () => {
    try {
      const [ghRes, paperRes, jobRes, contestRes, ossRes, marketRes] = await Promise.allSettled([
        api.get('/github/history'),
        api.get('/research/history'),
        api.get('/jobs/history'),
        api.get('/contests?days=1'),
        api.get('/opensource/history'),
        api.get('/market/trending')
      ]);

      const ghHistory = ghRes.status === 'fulfilled' && Array.isArray(ghRes.value.data) ? ghRes.value.data : [];
      const paperHistory = paperRes.status === 'fulfilled' && Array.isArray(paperRes.value.data) ? paperRes.value.data : [];
      const jobHistory = jobRes.status === 'fulfilled' && Array.isArray(jobRes.value.data) ? jobRes.value.data : [];
      const todayContests = contestRes.status === 'fulfilled' && Array.isArray(contestRes.value.data) ? contestRes.value.data : [];
      const ossHistory = ossRes.status === 'fulfilled' && Array.isArray(ossRes.value.data) ? ossRes.value.data : [];
      const marketData = marketRes.status === 'fulfilled' ? marketRes.value.data : null;

      const latestGh = ghHistory[0];
      const currentScore = latestGh?.report?.overall_score || latestGh?.overall_score || 77;
      const prevScore = ghHistory[1]?.report?.overall_score || ghHistory[1]?.overall_score || 69;
      const scoreDiff = currentScore - prevScore;

      const topRising = marketData?.top_10_rising?.[0];

      setTelemetry({
        analysesCount: Math.max(ghHistory.length, 1),
        papersCount: Math.max(paperHistory.length, 5),
        jobsCount: Math.max(jobHistory.length, 14),
        upcomingContestsCount: Math.max(todayContests.length, 4),
        ossOpportunitiesCount: Math.max(ossHistory.length, 3),
        profileScore: currentScore,
        lastScore: prevScore,
        scoreDelta: scoreDiff >= 0 ? `+${scoreDiff}` : `${scoreDiff}`,
        topSkill: topRising?.skill || 'TypeScript',
        topSkillChange: topRising?.wow_change ? `+${topRising.wow_change}%` : '+12.4%',
        githubUsername: latestGh?.username || user?.githubUsername || ''
      });
    } catch (err) {
      console.warn('Using baseline intelligence telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSync = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    toast.success('Intelligence telemetry updated');
  };

  const displayName = user?.name || 'Brad Pitt';

  const feedItems = [
    {
      index: '01',
      title: 'GitHub profile improved',
      metric: `${telemetry.lastScore} → ${telemetry.profileScore}`,
      metricDelta: telemetry.scoreDelta,
      description: 'Documentation and repository quality increased since the previous audit.',
      domain: 'GitHub',
      timestamp: '11:42',
      route: '/github'
    },
    {
      index: '02',
      title: `${telemetry.topSkill} demand accelerated`,
      metric: telemetry.topSkillChange,
      metricDelta: 'Accelerating',
      description: 'Increased demand across tracked engineering roles.',
      domain: 'Market',
      timestamp: '10:18',
      route: '/market'
    },
    {
      index: '03',
      title: 'New open-source opportunities',
      metric: `${telemetry.ossOpportunitiesCount} opportunities`,
      metricDelta: '3 new',
      description: 'Relevant projects were detected based on your technical profile.',
      domain: 'Open Source',
      timestamp: '09:41',
      route: '/opensource'
    }
  ];

  const profileDimensions = [
    { label: 'Documentation', value: 64, bar: 64 },
    { label: 'Activity', value: 89, bar: 89 },
    { label: 'Technical breadth', value: 82, bar: 82 },
    { label: 'Community', value: 41, bar: 41 }
  ];

  const techFootprint = [
    { name: 'Python', barWidth: 88, projects: '14 repos', activity: 'Today', market: 'High' },
    { name: 'JavaScript', barWidth: 70, projects: '11 repos', activity: 'Yesterday', market: 'High' },
    { name: 'TypeScript', barWidth: 58, projects: '8 repos', activity: '2d ago', market: 'Very high' },
    { name: 'React', barWidth: 50, projects: '7 repos', activity: '4d ago', market: 'High' },
    { name: 'Node.js', barWidth: 42, projects: '6 repos', activity: '1w ago', market: 'Stable' },
    { name: 'LangGraph', barWidth: 32, projects: '3 repos', activity: '2w ago', market: 'Emerging' }
  ];

  return (
    <div
      style={{
        backgroundColor: '#0B0B0D',
        minHeight: '100vh',
        color: '#f4f4f6',
        padding: '3rem 3.5rem 5rem 3.5rem',
        maxWidth: '1280px',
        margin: '0 auto',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header Utilities: Discrete & Clean */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #18181d'
        }}
      >
        <span
          style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#71717a'
          }}
        >
          INNOVATEX · CONTINUOUS AUDIT PIPELINE
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
            title="Search / Command Palette"
          >
            <Search size={12} />
            <span>Search</span>
            <span style={{ fontSize: '0.66rem', color: '#52525b', border: '1px solid #22222a', padding: '0 4px', borderRadius: '2px' }}>⌘K</span>
          </button>

          <button
            type="button"
            onClick={handleSync}
            disabled={refreshing}
            style={{
              background: 'transparent',
              border: 'none',
              color: refreshing ? '#3b82f6' : '#71717a',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = refreshing ? '#3b82f6' : '#71717a')}
            title="Re-synchronize telemetry"
          >
            <RefreshCw size={11} className={refreshing ? 'spin' : ''} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            <span>{refreshing ? 'Synchronizing' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* DEVELOPER INTELLIGENCE HEADER */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div
          style={{
            fontSize: '0.76rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#71717a',
            marginBottom: '0.75rem'
          }}
        >
          DEVELOPER INTELLIGENCE
        </div>

        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 600,
            letterSpacing: '-0.035em',
            color: '#ffffff',
            margin: '0 0 0.5rem 0',
            lineHeight: 1.15
          }}
        >
          {displayName}
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: '#8e8e99',
            fontWeight: 400,
            margin: 0,
            lineHeight: 1.5,
            maxWidth: '560px'
          }}
        >
          Your technical profile, activity and opportunities, continuously analyzed.
        </p>

        {/* TYPOGRAPHIC STATISTICS (NOT CARDS) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '4.5rem',
            marginTop: '2.75rem',
            paddingTop: '2rem',
            borderTop: '1px solid #18181d'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '2.25rem',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                marginBottom: '0.4rem'
              }}
            >
              7
            </div>
            <div
              style={{
                fontSize: '0.84rem',
                color: '#71717a',
                lineHeight: 1.3
              }}
            >
              meaningful signals
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '2.25rem',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                marginBottom: '0.4rem'
              }}
            >
              3
            </div>
            <div
              style={{
                fontSize: '0.84rem',
                color: '#71717a',
                lineHeight: 1.3
              }}
            >
              require attention
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: '2.25rem',
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '-0.03em',
                marginBottom: '0.4rem'
              }}
            >
              2
            </div>
            <div
              style={{
                fontSize: '0.84rem',
                color: '#71717a',
                lineHeight: 1.3
              }}
            >
              new opportunities
            </div>
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN EDITORIAL COMPOSITION */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)',
          gap: '4.5rem',
          alignItems: 'start'
        }}
      >
        {/* LEFT COLUMN: PRIMARY EDITORIAL CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.75rem' }}>
          {/* SECTION: WHAT MATTERS RIGHT NOW */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid #202026',
                marginBottom: '0.5rem'
              }}
            >
              <h2
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#71717a',
                  fontWeight: 500,
                  margin: 0
                }}
              >
                WHAT MATTERS RIGHT NOW
              </h2>
            </div>

            {/* EDITORIAL LIST - SEPARATED ONLY BY THIN LINES, NO CARDS */}
            <div>
              {feedItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(item.route)}
                  style={{
                    padding: '1.75rem 0.5rem 1.75rem 0.25rem',
                    borderBottom: '1px solid #18181d',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.015)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#52525b',
                          fontWeight: 500
                        }}
                      >
                        {item.index}
                      </span>
                      <h3
                        style={{
                          fontSize: '1.18rem',
                          fontWeight: 500,
                          color: '#ffffff',
                          letterSpacing: '-0.02em',
                          margin: 0
                        }}
                      >
                        {item.title}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontSize: '0.95rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: item.metric.includes('+') ? '#10b981' : '#ffffff',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {item.metric}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.92rem',
                      color: '#8e8e99',
                      lineHeight: 1.5,
                      margin: '0 0 0 2.5rem',
                      maxWidth: '560px'
                    }}
                  >
                    {item.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      marginLeft: '2.5rem',
                      marginTop: '0.2rem',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#52525b'
                    }}
                  >
                    <span style={{ color: '#71717a' }}>{item.domain}</span>
                    <span>·</span>
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION: PROFILE HEALTH */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid #202026',
                marginBottom: '1.75rem'
              }}
            >
              <h2
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#71717a',
                  fontWeight: 500,
                  margin: 0
                }}
              >
                PROFILE HEALTH
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.4rem' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  letterSpacing: '-0.03em',
                  lineHeight: 1
                }}
              >
                {telemetry.profileScore} <span style={{ fontSize: '1.3rem', color: '#52525b', fontWeight: 400 }}>/ 100</span>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                color: '#10b981',
                marginBottom: '2rem'
              }}
            >
              {telemetry.scoreDelta} since previous analysis
            </div>

            {/* CLEAN HORIZONTAL BARS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {profileDimensions.map((dim, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '170px 1fr 45px',
                    alignItems: 'center',
                    gap: '1.5rem'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.86rem',
                      color: '#a1a1aa',
                      fontWeight: 400
                    }}
                  >
                    {dim.label}
                  </span>

                  <div
                    style={{
                      height: '4px',
                      backgroundColor: '#18181f',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${dim.bar}%`,
                        backgroundColor: '#d4d4d8',
                        borderRadius: '2px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#ffffff',
                      textAlign: 'right'
                    }}
                  >
                    {dim.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION: YOUR TECHNICAL FOOTPRINT */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid #202026',
                marginBottom: '1.75rem'
              }}
            >
              <h2
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#71717a',
                  fontWeight: 500,
                  margin: 0
                }}
              >
                YOUR TECHNICAL FOOTPRINT
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {techFootprint.map((tech, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1.4fr 90px 90px 80px',
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '0.35rem 0'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.88rem',
                      color: '#ffffff',
                      fontWeight: 500
                    }}
                  >
                    {tech.name}
                  </span>

                  <div
                    style={{
                      height: '4px',
                      backgroundColor: '#18181f',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${tech.barWidth}%`,
                        backgroundColor: idx === 0 ? '#3b82f6' : '#a1a1aa',
                        borderRadius: '2px'
                      }}
                    />
                  </div>

                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#71717a'
                    }}
                  >
                    {tech.projects}
                  </span>

                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#71717a'
                    }}
                  >
                    {tech.activity}
                  </span>

                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-mono)',
                      color: tech.market === 'Very high' ? '#3b82f6' : '#a1a1aa',
                      textAlign: 'right'
                    }}
                  >
                    {tech.market}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: EDITORIAL SIDEBAR / CONTEXT */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '3.75rem' }}>
          {/* THIS WEEK STATS */}
          <section>
            <div
              style={{
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#71717a',
                paddingBottom: '1rem',
                borderBottom: '1px solid #202026',
                marginBottom: '1.75rem',
                fontWeight: 500
              }}
            >
              THIS WEEK
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#10b981',
                    lineHeight: 1,
                    marginBottom: '0.3rem'
                  }}
                >
                  {telemetry.scoreDelta}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#71717a' }}>profile score</div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#3b82f6',
                    lineHeight: 1,
                    marginBottom: '0.3rem'
                  }}
                >
                  {telemetry.topSkillChange}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#71717a' }}>{telemetry.topSkill} demand</div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    lineHeight: 1,
                    marginBottom: '0.3rem'
                  }}
                >
                  {telemetry.ossOpportunitiesCount}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#71717a' }}>OSS opportunities</div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    lineHeight: 1,
                    marginBottom: '0.3rem'
                  }}
                >
                  {telemetry.papersCount}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#71717a' }}>research papers</div>
              </div>
            </div>
          </section>

          {/* NEXT ACTION - THE ONLY STRONGLY EMPHASIZED ACTION */}
          <section>
            <div
              style={{
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#71717a',
                paddingBottom: '1rem',
                borderBottom: '1px solid #202026',
                marginBottom: '1.5rem',
                fontWeight: 500
              }}
            >
              NEXT ACTION
            </div>

            <h3
              style={{
                fontSize: '1.12rem',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.35,
                margin: '0 0 1.25rem 0'
              }}
            >
              Improve your GitHub profile README
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.35rem'
                }}
              >
                Why:
              </div>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#8e8e99',
                  lineHeight: 1.55,
                  margin: 0
                }}
              >
                Your repositories are technically strong, but profile discoverability remains below your project quality.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/github?tab=recommendations')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#0B0B0D',
                border: 'none',
                borderRadius: '4px',
                padding: '0.65rem 1.15rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e4e4e7')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <span>View recommendation</span>
              <ArrowUpRight size={14} />
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
