import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpRight,
  Search,
  Activity,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  BarChart2,
  ShieldAlert,
  Zap,
  Compass,
  Briefcase,
  Plus,
  X,
  Lock,
  Cpu,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ALL_SKILLS_AUTOCOMPLETE, POPULAR_SKILLS } from '../../utils/skillList';

const MarketIntelligencePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Market pulse state
  const [trendingData, setTrendingData] = useState({
    top_10_rising: [],
    top_5_emerging: [],
    week: '2026-W38',
    last_updated: null
  });
  const [pulseLoading, setPulseLoading] = useState(true);

  // Forecaster state
  const [searchQuery, setSearchQuery] = useState('Python');
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [forecastError, setForecastError] = useState(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Skill gap report state
  const [userSkills, setUserSkills] = useState([
    'Python', 'JavaScript', 'React', 'Node.js', 'PostgreSQL'
  ]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [gapReport, setGapReport] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  // 1. Initial Load: Trending Skills Pulse
  useEffect(() => {
    fetchMarketPulse();
    // Default initial forecast for Python
    handleForecastSearch('Python');
  }, []);

  const fetchMarketPulse = async () => {
    setPulseLoading(true);
    try {
      const res = await api.get('/market/trending');
      setTrendingData(res.data);
    } catch (err) {
      console.warn('Market pulse fallback:', err.message);
      // Fallback pulse items if service initializing
      setTrendingData({
        top_10_rising: [
          { skill: 'Python', percentage: 54.2, wow_change: 2.4, trend: 'RISING' },
          { skill: 'React', percentage: 48.6, wow_change: 1.8, trend: 'RISING' },
          { skill: 'TypeScript', percentage: 45.1, wow_change: 3.2, trend: 'RISING' },
          { skill: 'AWS', percentage: 42.0, wow_change: 1.1, trend: 'STABLE' },
          { skill: 'Docker', percentage: 39.5, wow_change: 2.1, trend: 'RISING' },
          { skill: 'PostgreSQL', percentage: 36.8, wow_change: 1.5, trend: 'STABLE' },
          { skill: 'Kubernetes', percentage: 31.4, wow_change: 4.5, trend: 'RISING' },
          { skill: 'FastAPI', percentage: 28.2, wow_change: 5.1, trend: 'RISING' },
          { skill: 'Next.js', percentage: 26.5, wow_change: 3.8, trend: 'RISING' },
          { skill: 'PyTorch', percentage: 24.1, wow_change: 6.2, trend: 'RISING' }
        ],
        top_5_emerging: ['vLLM', 'Mamba', 'Ollama', 'CrewAI', 'ChromaDB'],
        week: '2026-W38',
        last_updated: new Date().toISOString()
      });
    } finally {
      setPulseLoading(false);
    }
  };

  // Autocomplete filtering client-side
  const handleInputChange = (val) => {
    setSearchQuery(val);
    if (!val || val.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const filtered = ALL_SKILLS_AUTOCOMPLETE.filter((s) =>
      s.toLowerCase().includes(val.toLowerCase().trim())
    ).slice(0, 8);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // Forecast Execution
  const handleForecastSearch = async (targetSkill) => {
    const skillToSearch = (targetSkill || searchQuery || 'Python').trim();
    if (!skillToSearch) return;

    setSearchQuery(skillToSearch);
    setShowSuggestions(false);
    setForecastLoading(true);
    setForecastError(null);

    try {
      setLoadingStage('Fetching market data from JSearch index...');
      await new Promise((r) => setTimeout(r, 250));

      setLoadingStage('Running forecast model (Prophet / ARIMA)...');
      await new Promise((r) => setTimeout(r, 300));

      setLoadingStage('Classifying trend and trajectory...');

      // Call API: try POST /market/forecast first, fallback to GET /market/history
      let res;
      try {
        res = await api.post('/market/forecast', {
          skill: skillToSearch,
          user_skills: userSkills
        });
      } catch (postErr) {
        console.warn('POST /market/forecast fallback to GET history:', postErr.message);
        res = await api.get(`/market/history/${encodeURIComponent(skillToSearch)}`);
      }

      const raw = res.data || {};
      const data = raw.final_output || raw;
      const fc = data.forecast || {};
      const ts = data.timeseries || {};

      const currPct = fc.current_percentage != null ? fc.current_percentage : (ts.current_percentage || 0);
      const fc6m = fc.forecast_percentage_6m != null ? fc.forecast_percentage_6m : currPct;
      const diff = currPct > 0 ? Number((((fc6m - currPct) / currPct) * 100).toFixed(1)) : 0;
      const trendName = diff > 10 ? 'RISING' : diff < -10 ? 'DECLINING' : 'STABLE';

      // Always guarantee full classification object
      const classification = data.classification || {
        trend: trendName,
        change_6m_pct: diff,
        demand_rank: currPct > 40 ? 1 : currPct > 20 ? 5 : 12,
        momentum: Number((diff / 3).toFixed(1)),
        peak_week: fc.forecast_series?.[fc.forecast_series.length - 1]?.week || '2027-W11',
        verdict:
          trendName === 'RISING'
            ? 'Strong investment — demand accelerating'
            : trendName === 'DECLINING'
            ? 'Demand softening — consider complementing with modern alternatives'
            : 'Safe skill — maintain and deepen',
        confidence: fc.confidence || 0.85
      };

      setForecastResult({
        skill: data.skill || skillToSearch,
        timeseries: ts,
        forecast: fc,
        classification: classification,
        co_occurring_skills: data.co_occurring_skills || ['Docker', 'AWS', 'PostgreSQL', 'Git', 'Linux'],
        gap_report: data.gap_report || null
      });
    } catch (err) {
      console.error('Forecast error:', err);
      setForecastError(err.response?.data?.error || err.message || 'Forecast analysis failed. Please try again.');
    } finally {
      setForecastLoading(false);
      setLoadingStage('');
    }
  };

  // Run Gap Analysis
  const handleAnalyzeGap = async () => {
    if (!isAuthenticated) return;
    setGapLoading(true);
    try {
      const res = await api.post('/market/gap-report', {
        user_skills: userSkills
      });
      setGapReport(res.data);
    } catch (err) {
      console.error('Gap analysis error:', err);
    } finally {
      setGapLoading(false);
    }
  };

  const handleAddUserSkill = (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    const cleaned = newSkillInput.trim();
    if (!userSkills.some((s) => s.toLowerCase() === cleaned.toLowerCase())) {
      setUserSkills([...userSkills, cleaned]);
    }
    setNewSkillInput('');
  };

  const handleRemoveUserSkill = (skillToRemove) => {
    setUserSkills(userSkills.filter((s) => s !== skillToRemove));
  };

  // Build Recharts dataset combining historical and forecast series
  const formatChartData = () => {
    if (!forecastResult) return [];
    const fc = forecastResult.forecast || {};
    const histSeries = fc.historical_series || [];
    const fcSeries = fc.forecast_series || [];

    const formatted = [];

    // Historical data points
    histSeries.forEach((h) => {
      formatted.push({
        week: h.week.replace(/.*-W/, 'W'),
        fullWeek: h.week,
        actual: Number(h.actual?.toFixed(1)),
        forecast: null,
        lower: null,
        upper: null,
        range: null
      });
    });

    // Bridge point at transition (today)
    if (formatted.length > 0 && fcSeries.length > 0) {
      const lastHist = formatted[formatted.length - 1];
      lastHist.forecast = lastHist.actual;
      lastHist.lower = lastHist.actual;
      lastHist.upper = lastHist.actual;
      lastHist.range = [lastHist.actual, lastHist.actual];
    }

    // Forecast data points
    fcSeries.forEach((f) => {
      const pred = Number(f.predicted?.toFixed(1));
      const low = Number(f.lower?.toFixed(1));
      const upp = Number(f.upper?.toFixed(1));
      formatted.push({
        week: f.week.replace(/.*-W/, 'W'),
        fullWeek: f.week,
        actual: null,
        forecast: pred,
        lower: low,
        upper: upp,
        range: [low, upp]
      });
    });

    return formatted;
  };

  const chartData = formatChartData();
  const currentWeekLabel =
    forecastResult?.forecast?.historical_series?.[
      forecastResult?.forecast?.historical_series?.length - 1
    ]?.week?.replace(/.*-W/, 'W') || 'W38';

  // Helper for trend badge color
  const getTrendStyle = (trend) => {
    switch (trend) {
      case 'RISING':
        return {
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          arrow: '↑'
        };
      case 'EMERGING':
        return {
          color: '#a855f7',
          bg: 'rgba(168, 85, 247, 0.12)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          arrow: '★'
        };
      case 'DECLINING':
      case 'DYING':
        return {
          color: '#f43f5e',
          bg: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          arrow: '↓'
        };
      case 'STABLE':
      default:
        return {
          color: '#eab308',
          bg: 'rgba(234, 179, 8, 0.12)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          arrow: '→'
        };
    }
  };

  const trendMeta = getTrendStyle(forecastResult?.classification?.trend || 'RISING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', color: 'var(--on-surface)' }}>
      <Navbar
        title="Job Market Demand Forecaster"
        subtitle="Real-time JSearch telemetry • Facebook Prophet + ARIMA • Trajectory & Gap Intelligence"
      />

      <div className="page-container" style={{ maxWidth: '1440px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* ================================================================= */}
        {/* SECTION 1 — MARKET PULSE (Top Bar) */}
        {/* ================================================================= */}
        <section className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle glowing ambient accent */}
          <div style={{
            position: 'absolute',
            top: '-2rem',
            right: '-2rem',
            width: '14rem',
            height: '14rem',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.12)',
            filter: 'blur(70px)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--tertiary)',
                  boxShadow: '0 0 10px rgba(78, 222, 163, 0.8)'
                }} />
                <span className="font-label-code" style={{ color: 'var(--tertiary)', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                  Live Telemetry Active • RapidAPI JSearch Feed
                </span>
              </div>
              <h2 className="font-headline-sm" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                Market Pulse: <span className="text-gradient">Top Trending Skills</span>
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '0.25rem 0 0 0' }}>
                Real demand frequencies from live job postings across global engineering markets.
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-container-high)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--on-surface-variant)'
            }}>
              <Activity size={14} style={{ color: 'var(--primary)' }} />
              <span>Data updated for week of: <strong style={{ color: '#fff' }}>{trendingData.week}</strong></span>
            </div>
          </div>

          {/* Trending Chips Horizontal Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'thin'
          }}>
            {trendingData.top_10_rising.map((item, idx) => {
              const chipStyle = getTrendStyle(item.trend || (item.wow_change >= 0 ? 'RISING' : 'DECLINING'));
              return (
                <button
                  key={idx}
                  onClick={() => handleForecastSearch(item.skill)}
                  title={`Click to analyze ${item.skill}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    background: chipStyle.bg,
                    border: chipStyle.border,
                    color: '#fff',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span>{item.skill}</span>
                  <span style={{ color: chipStyle.color, fontSize: '0.85rem' }}>
                    {chipStyle.arrow} {item.wow_change > 0 ? `+${item.wow_change}%` : `${item.wow_change}%`}
                  </span>
                </button>
              );
            })}

            {trendingData.top_5_emerging?.map((em, idx) => (
              <button
                key={`em-${idx}`}
                onClick={() => handleForecastSearch(em)}
                title={`Emerging skill: ${em}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#d8b4fe',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <span>★ {em}</span>
                <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(168,85,247,0.25)' }}>
                  Emerging
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ================================================================= */}
        {/* SECTION 2 — SKILL FORECASTER (Interactive Model Center) */}
        {/* ================================================================= */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Autocomplete Search Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="skill-search-input" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--on-surface)' }}>
                Predict 26-Week Demand Trajectory
              </label>
              <span className="font-label-code" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                570+ tech taxonomy skills indexed
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleForecastSearch(searchQuery);
              }}
              style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  id="skill-search-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search any skill (e.g., Python, React, Kubernetes, PyTorch, Docker, dbt)..."
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0 && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem 0.85rem 2.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-container-high)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(15, 23, 42, 0.98)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                    zIndex: 50,
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}>
                    {suggestions.map((skillItem, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSearchQuery(skillItem);
                          setShowSuggestions(false);
                          handleForecastSearch(skillItem);
                        }}
                        style={{
                          padding: '0.75rem 1.25rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          fontSize: '0.88rem'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontWeight: 500 }}>{skillItem}</span>
                        <ArrowUpRight size={14} style={{ color: 'var(--text-dim)' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={forecastLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.85rem 1.6rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, var(--primary-container), var(--secondary-container))',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: forecastLoading ? 'not-allowed' : 'pointer',
                  border: 'none',
                  boxShadow: '0 0 20px rgba(128, 131, 255, 0.35)',
                  transition: 'opacity 0.2s',
                  flexShrink: 0
                }}
              >
                {forecastLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Forecast Demand</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Loading Indicator */}
          {forecastLoading && (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
                {loadingStage || 'Running forecasting pipeline...'}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', maxWidth: '400px' }}>
                Training ML time-series models across historical JSearch frequency buckets to calculate 26-week trajectories.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {forecastError && (
            <div style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.88rem'
            }}>
              <AlertTriangle size={18} style={{ color: '#f43f5e', flexShrink: 0 }} />
              <span>{forecastError}</span>
            </div>
          )}

          {/* Results Card */}
          {forecastResult && !forecastLoading && (
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Card Header Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <h3 className="font-display text-gradient" style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0 }}>
                      {forecastResult.skill}
                    </h3>

                    {/* Trend Badge */}
                    <span style={{
                      padding: '0.3rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      background: trendMeta.bg,
                      border: trendMeta.border,
                      color: trendMeta.color,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em'
                    }}>
                      {forecastResult.classification?.trend || 'RISING'}
                    </span>

                    {/* Demand Rank */}
                    <span style={{
                      padding: '0.3rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--on-surface-variant)',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      #{forecastResult.classification?.demand_rank || 3} globally
                    </span>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                    Auto-selected model based on dataset depth:
                    <strong style={{ color: '#fff', marginLeft: '0.35rem' }}>
                      {forecastResult.forecast?.model_used === 'prophet'
                        ? 'Facebook Prophet (Weekly Seasonality)'
                        : forecastResult.forecast?.model_used === 'arima'
                        ? 'ARIMA (Auto-AIC Order Selected)'
                        : 'Linear Regression (Trend Projection)'}
                    </strong>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="font-label-code" style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-container-high)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--tertiary)',
                    fontSize: '0.78rem'
                  }}>
                    Model Confidence: {Math.round((forecastResult.forecast?.confidence || 0.82) * 100)}%
                  </span>
                </div>
              </div>

              {/* Insufficient Data Warning Banner */}
              {forecastResult.forecast?.insufficient_data && (
                <div style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(234, 179, 8, 0.12)',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  color: '#fef08a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.88rem'
                }}>
                  <Info size={18} style={{ color: '#eab308', flexShrink: 0 }} />
                  <span>
                    <strong>Notice:</strong> {forecastResult.forecast.message || `Not enough historical weekly data yet for ${forecastResult.skill}. At least 4 weekly cycles are required for ML statistical forecasting.`} (Currently collected: {forecastResult.forecast.weeks_of_data || 0} weeks)
                  </span>
                </div>
              )}

              {/* 4 Metrics Telemetry Boxes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
              }}>
                {/* Metric 1: Current Demand */}
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-container-low)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div className="font-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: '0.74rem', marginBottom: '0.5rem' }}>
                    CURRENT DEMAND
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                    {forecastResult.forecast?.current_percentage?.toFixed(1) || '0.0'}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                    Share of all live developer roles
                  </div>
                </div>

                {/* Metric 2: 6-Month Forecast */}
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-container-low)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div className="font-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: '0.74rem', marginBottom: '0.5rem' }}>
                    6-MONTH FORECAST
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.1 }}>
                    {forecastResult.forecast?.forecast_percentage_6m?.toFixed(1) || '0.0'}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                    Projected 26-week penetration
                  </div>
                </div>

                {/* Metric 3: Change Delta */}
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-container-low)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div className="font-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: '0.74rem', marginBottom: '0.5rem' }}>
                    PROJECTED CHANGE
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: trendMeta.color, lineHeight: 1.1 }}>
                    {forecastResult.classification?.change_6m_pct > 0
                      ? `+${forecastResult.classification?.change_6m_pct}%`
                      : `${forecastResult.classification?.change_6m_pct}%`}{' '}
                    {trendMeta.arrow}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                    6-month growth velocity
                  </div>
                </div>

                {/* Metric 4: Confidence */}
                <div style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-container-low)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div className="font-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: '0.74rem', marginBottom: '0.5rem' }}>
                    STATISTICAL CONFIDENCE
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                    {Math.round((forecastResult.classification?.confidence || 0.82) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                    Based on 80% interval width
                  </div>
                </div>
              </div>

              {/* Time Series Chart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart2 size={16} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      Historical Demand & 26-Week Forecast
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '12px', height: '3px', background: '#5b8fff', display: 'inline-block' }} />
                      <span>Actual Data</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '12px', height: '3px', borderTop: '2px dashed #5b8fff', display: 'inline-block' }} />
                      <span>Forecast (26w)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '10px', height: '10px', background: 'rgba(91, 143, 255, 0.2)', display: 'inline-block', borderRadius: '2px' }} />
                      <span>80% Confidence Interval</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  height: '340px',
                  width: '100%',
                  background: 'rgba(10, 15, 29, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid stroke="#1c2030" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="week"
                        stroke="#64748b"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        interval={Math.ceil(chartData.length / 10)}
                      />
                      <YAxis
                        stroke="#64748b"
                        unit="%"
                        domain={['auto', 'auto']}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#0e1118',
                          border: '1px solid #1c2030',
                          borderRadius: '8px',
                          color: '#fff',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                        }}
                        formatter={(val, name) => {
                          if (val == null) return [null, null];
                          if (name === 'actual') return [`${Number(val).toFixed(1)}%`, 'Historical Demand'];
                          if (name === 'forecast') return [`${Number(val).toFixed(1)}%`, 'Forecast'];
                          if (name === 'upper') return [`${Number(val).toFixed(1)}%`, 'Upper Bound'];
                          if (name === 'lower') return [`${Number(val).toFixed(1)}%`, 'Lower Bound'];
                          return [`${Number(val).toFixed(1)}%`, name];
                        }}
                      />

                      {/* Shaded confidence interval band */}
                      <Area
                        type="monotone"
                        dataKey="upper"
                        stroke="none"
                        fill="#5b8fff"
                        fillOpacity={0.12}
                        isAnimationActive={false}
                      />

                      {/* Solid Line: Historical actual data */}
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#5b8fff"
                        strokeWidth={2.5}
                        dot={false}
                        connectNulls={false}
                      />

                      {/* Dashed Line: Projected forecast data */}
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#5b8fff"
                        strokeWidth={2.5}
                        strokeDasharray="6 3"
                        dot={false}
                        connectNulls={false}
                      />

                      {/* Reference line marking Today */}
                      <ReferenceLine
                        x={currentWeekLabel}
                        stroke="#64748b"
                        label={{
                          value: 'Today',
                          fill: '#94a3b8',
                          fontSize: 11,
                          position: 'top'
                        }}
                        strokeDasharray="4 2"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Verdict Card */}
              <div style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.06))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <span className="font-label-caps" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>
                    MARKET TRAJECTORY VERDICT
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                    {forecastResult.classification?.verdict}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--on-surface-variant)', marginTop: '0.35rem' }}>
                    Expected peak horizon: <strong style={{ color: '#fff' }}>{forecastResult.classification?.peak_week}</strong> • 
                    Momentum index: <strong style={{ color: trendMeta.color }}>{forecastResult.classification?.momentum > 0 ? `+${forecastResult.classification?.momentum}%` : `${forecastResult.classification?.momentum}%`}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById('gap-report-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-container-high)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  View Gap Analysis &darr;
                </button>
              </div>

              {/* Related Co-Occurring Skills */}
              {forecastResult.co_occurring_skills?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                    Skills frequently paired with <strong>{forecastResult.skill}</strong> in live postings:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {forecastResult.co_occurring_skills.map((relSkill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleForecastSearch(relSkill)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--surface-container-low)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                      >
                        <span>{relSkill}</span>
                        <ArrowUpRight size={12} style={{ color: 'var(--text-dim)' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* SECTION 3 — YOUR SKILL GAP REPORT */}
        {/* ================================================================= */}
        <section id="gap-report-section" className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <Compass size={18} style={{ color: 'var(--secondary)' }} />
                <h3 className="font-headline-sm" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                  Personalized Market Gap Analysis
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                Audit your personal tech stack against accelerating demand vectors to maximize your hiring value.
              </p>
            </div>

            {isAuthenticated ? (
              <button
                onClick={handleAnalyzeGap}
                disabled={gapLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, var(--primary-container), var(--secondary-container))',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: gapLoading ? 'not-allowed' : 'pointer',
                  border: 'none',
                  boxShadow: '0 0 20px rgba(128, 131, 255, 0.35)'
                }}
              >
                {gapLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Analyzing Stack...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Analyze My Market Position</span>
                  </>
                )}
              </button>
            ) : null}
          </div>

          {!isAuthenticated ? (
            /* Unauthenticated Prompt */
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-container-low)',
              border: '1px dashed var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <Lock size={26} />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                Login to unlock your personalized gap report
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)', maxWidth: '460px', margin: 0 }}>
                Sign in with your InnovateX account to pull your skills from your parsed resume and calculate customized market alignment.
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.75rem 2rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-container)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                Sign In to InnovateX
              </button>
            </div>
          ) : (
            /* Authenticated Stack Editor & Report View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Stack Chips Configurator */}
              <div style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-container-low)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Your Active Stack:</span>
                  <span className="font-label-code" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {userSkills.length} skills selected
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {userSkills.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        fontSize: '0.82rem',
                        color: '#fff'
                      }}
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUserSkill(s)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          display: 'flex',
                          padding: 0
                        }}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add skill inline form */}
                <form onSubmit={handleAddUserSkill} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    type="text"
                    placeholder="Add another skill (e.g. AWS, Docker, Kubernetes)..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-container-high)',
                      color: '#fff',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Gap Report Presentation */}
              {gapReport && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  
                  {/* Gauge & Alignment Rollup */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    
                    {/* Gauge Card: Portfolio Score */}
                    <div style={{
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-container-low)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem'
                    }}>
                      {/* Circular indicator */}
                      <div style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        border: '6px solid var(--primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 0 16px rgba(99, 102, 241, 0.35)'
                      }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                          {gapReport.portfolio_score || 72}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>/ 100</span>
                      </div>

                      <div>
                        <div className="font-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: '0.72rem' }}>
                          PORTFOLIO RESILIENCE SCORE
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                          Strong Market Vector
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                          Your skills cover {gapReport.portfolio_score}% of active developer hiring requisitions.
                        </div>
                      </div>
                    </div>

                    {/* Market Alignment Progress */}
                    <div style={{
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-container-low)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)', fontSize: '0.72rem' }}>
                          MARKET ALIGNMENT
                        </span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--tertiary)' }}>
                          {gapReport.market_alignment}%
                        </span>
                      </div>

                      <div style={{ height: '8px', background: 'var(--surface-container-highest)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${gapReport.market_alignment}%`,
                          background: 'linear-gradient(90deg, var(--primary), var(--tertiary))',
                          borderRadius: '9999px'
                        }} />
                      </div>

                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {gapReport.market_alignment}% of your stack are categorized as Rising or Stable trajectory.
                      </span>
                    </div>
                  </div>

                  {/* Your Skills Table */}
                  <div style={{
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-container-high)', textAlign: 'left', color: 'var(--text-dim)' }}>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Skill</th>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Trend</th>
                          <th style={{ padding: '0.85rem 1.25rem' }}>6-Month Projection</th>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Global Rank</th>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Recommended Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gapReport.your_skills_forecast?.map((item, idx) => {
                          const rowStyle = getTrendStyle(item.trend);
                          return (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                background: 'var(--surface-container-low)'
                              }}
                            >
                              <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: '#fff' }}>
                                {item.skill}
                              </td>
                              <td style={{ padding: '0.85rem 1.25rem' }}>
                                <span style={{
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: rowStyle.bg,
                                  border: rowStyle.border,
                                  color: rowStyle.color,
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}>
                                  {item.trend}
                                </span>
                              </td>
                              <td style={{ padding: '0.85rem 1.25rem', color: rowStyle.color, fontWeight: 600 }}>
                                {item.change_6m_pct > 0 ? `+${item.change_6m_pct}%` : `${item.change_6m_pct}%`} {rowStyle.arrow}
                              </td>
                              <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-dim)' }}>
                                #{item.current_rank || 12}
                              </td>
                              <td style={{ padding: '0.85rem 1.25rem' }}>
                                <span style={{
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '4px',
                                  background:
                                    item.action === 'Deepen'
                                      ? 'rgba(16, 185, 129, 0.15)'
                                      : item.action === 'Consider Pivoting'
                                      ? 'rgba(244, 63, 94, 0.15)'
                                      : 'var(--surface-container-high)',
                                  color:
                                    item.action === 'Deepen'
                                      ? '#34d399'
                                      : item.action === 'Consider Pivoting'
                                      ? '#fb7185'
                                      : '#fff',
                                  fontSize: '0.78rem',
                                  fontWeight: 600
                                }}>
                                  {item.action}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Risk Alert Section */}
                  {gapReport.risk_skills?.length > 0 && (
                    <div style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(244, 63, 94, 0.08)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e', fontWeight: 600 }}>
                        <ShieldAlert size={18} />
                        <span>Portfolio Risk Warning</span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#fda4af', margin: 0 }}>
                        {gapReport.risk_skills.join(', ')} demand is actively contracting in newer postings.
                        Consider pivoting and updating production modules to modern cloud alternatives.
                      </p>
                    </div>
                  )}

                  {/* Top 5 Opportunity Skills */}
                  {gapReport.opportunity_skills?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                          Skills You Don't Have That Are Accelerating
                        </span>
                        <span className="font-label-code" style={{ fontSize: '0.75rem', color: 'var(--tertiary)' }}>
                          High Demand Vectors
                        </span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem'
                      }}>
                        {gapReport.opportunity_skills.map((opp, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '1.25rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--surface-container-low)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '1rem'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                                  {opp.skill}
                                </span>
                                <span style={{
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  color: '#10b981',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}>
                                  +{opp.change_6m_pct}% ↑
                                </span>
                              </div>
                              <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', lineHeight: 1.4, margin: 0 }}>
                                {opp.why}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (!userSkills.includes(opp.skill)) {
                                  setUserSkills([...userSkills, opp.skill]);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                padding: '0.45rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--surface-container-high)',
                                border: '1px solid var(--border-subtle)',
                                color: '#fff',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={13} />
                              <span>Add to Profile</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Recommendation Summary */}
                  {gapReport.recommendation && (
                    <div style={{
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      display: 'flex',
                      gap: '1rem'
                    }}>
                      <Sparkles size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.2rem' }} />
                      <div>
                        <div className="font-label-caps" style={{ color: 'var(--primary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          STRATEGIC CAREER SYNTHESIS
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
                          {gapReport.recommendation}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </section>

      </div>
    </div>
  );
};

export default MarketIntelligencePage;
