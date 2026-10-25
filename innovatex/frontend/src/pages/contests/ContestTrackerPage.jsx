import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  Calendar,
  CalendarPlus,
  RefreshCw,
  Trophy,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const PLATFORMS = ['All', 'LeetCode', 'Codeforces', 'AtCoder', 'CodeChef', 'Kaggle'];

export default function ContestTrackerPage() {
  const toast = useToast();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // all, live, upcoming
  const [skillLevel, setSkillLevel] = useState('all'); // all, beginner, intermediate, advanced

  const fetchContests = async (forceRefresh = false) => {
    if (forceRefresh) setSyncing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = forceRefresh ? '/contests?days=60&refresh=true' : '/contests?days=60';
      const res = await api.get(url);
      const list = Array.isArray(res.data) ? res.data : res.data?.contests || [];
      setContests(list);
      if (forceRefresh) {
        toast.success(`Synced ${list.length} live upcoming contests from platforms`);
      }
    } catch (err) {
      console.error('Failed to load contests:', err);
      setError('Failed to retrieve live competitions. Ensure backend is running.');
      toast.error('Failed to load live contests.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const fetchPersonalized = async (level) => {
    if (level === 'all') {
      fetchContests();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/contests/personalized', { skill_level: level });
      const list = Array.isArray(res.data) ? res.data : res.data?.contests || [];
      setContests(list);
      toast.success(`Ranked contests by ${level} difficulty match`);
    } catch (err) {
      console.error('Failed to load personalized contests:', err);
      toast.error('Failed to score personalized contests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleLevelChange = (e) => {
    const lvl = e.target.value;
    setSkillLevel(lvl);
    fetchPersonalized(lvl);
  };

  // Process & filter contests
  const processedContests = useMemo(() => {
    const now = Date.now();
    const seen = new Set();

    return contests
      .filter((c) => {
        if (!c.title) return false;
        const key = `${c.title.toLowerCase().trim()}_${c.start_time}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((c) => {
        const startMs = new Date(c.start_time).getTime();
        const endMs = c.end_time ? new Date(c.end_time).getTime() : startMs + (c.duration_seconds || 7200) * 1000;
        const isLive = now >= startMs && now < endMs;
        const isUpcoming = now < startMs;

        let relativeTime = 'Upcoming';
        if (isLive) {
          const hoursLeft = Math.max(1, Math.round((endMs - now) / (1000 * 60 * 60)));
          relativeTime = `Live Now (${hoursLeft}h left)`;
        } else if (isUpcoming) {
          const hoursAway = (startMs - now) / (1000 * 60 * 60);
          if (hoursAway < 24) {
            relativeTime = `Starts in ${Math.max(1, Math.round(hoursAway))}h`;
          } else {
            const daysAway = Math.round(hoursAway / 24);
            relativeTime = `Starts in ${daysAway}d`;
          }
        }

        const durHours = ((c.duration_seconds || 7200) / 3600).toFixed(1);
        const durationFormatted = durHours.endsWith('.0') ? `${parseInt(durHours, 10)}h` : `${durHours}h`;

        return {
          ...c,
          isLive,
          isUpcoming,
          relativeTime,
          durationFormatted
        };
      })
      .filter((c) => {
        // Status filter
        if (statusFilter === 'live' && !c.isLive) return false;
        if (statusFilter === 'upcoming' && !c.isUpcoming) return false;

        // Platform filter
        if (platform !== 'All') {
          const pLower = (c.platform || '').toLowerCase();
          const targetLower = platform.toLowerCase();
          if (!pLower.includes(targetLower)) return false;
        }

        // Search term
        if (search) {
          const term = search.toLowerCase();
          return (
            c.title?.toLowerCase().includes(term) ||
            c.platform?.toLowerCase().includes(term)
          );
        }

        return true;
      });
  }, [contests, statusFilter, platform, search]);

  const generateGoogleCalendarUrl = (contest) => {
    try {
      const startIso = new Date(contest.start_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endMs = contest.end_time
        ? new Date(contest.end_time).getTime()
        : new Date(contest.start_time).getTime() + (contest.duration_seconds || 7200) * 1000;
      const endIso = new Date(endMs).toISOString().replace(/-|:|\.\d\d\d/g, '');

      const title = encodeURIComponent(contest.title || 'Coding Contest');
      const details = encodeURIComponent(`Platform: ${contest.platform}\nContest URL: ${contest.url || ''}`);
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}`;
    } catch {
      return '#';
    }
  };

  const getPlatformBadgeClass = (p) => {
    const plat = (p || '').toLowerCase();
    if (plat.includes('leetcode')) return 'badge-warning';
    if (plat.includes('codeforces')) return 'badge-primary';
    if (plat.includes('atcoder')) return 'badge-info';
    if (plat.includes('codechef')) return 'badge-success';
    return 'badge-gray';
  };

  return (
    <div className="page-container fade-in">
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '0.35rem' }}>
            Coding Contests & Competitions
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Live aggregation across LeetCode, Codeforces, AtCoder, CodeChef, and Kaggle with personalized difficulty matching
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchContests(true)}
          disabled={syncing}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
          title="Force refresh live contest cache"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? 'Syncing...' : 'Sync Live Contests'}</span>
        </button>
      </div>

      {/* Filter and Controls Card */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Platform Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
              Platform:
            </span>
            {PLATFORMS.map((plat) => {
              const isActive = platform === plat;
              return (
                <button
                  key={plat}
                  type="button"
                  onClick={() => setPlatform(plat)}
                  className={isActive ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {plat}
                </button>
              );
            })}
          </div>

          {/* Status, Search & Personalized Level */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Status filter */}
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {[
                  { id: 'all', label: 'All Contests' },
                  { id: 'live', label: 'Live Now' },
                  { id: 'upcoming', label: 'Upcoming' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    style={{
                      padding: '0.45rem 0.875rem',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: statusFilter === st.id ? 'var(--primary)' : 'var(--bg-card)',
                      color: statusFilter === st.id ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Personalized Difficulty Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <select
                  value={skillLevel}
                  onChange={handleLevelChange}
                  style={{ height: '36px', padding: '0 0.875rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)' }}
                >
                  <option value="all">Match: All Skill Levels</option>
                  <option value="beginner">Target: Beginner Friendly</option>
                  <option value="intermediate">Target: Intermediate Division</option>
                  <option value="advanced">Target: Advanced / Div 1</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search contest title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', height: '36px', paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.875rem 1rem',
          backgroundColor: 'var(--error-light)',
          border: '1px solid var(--error-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--error-text)',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Contests Table */}
      {loading ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 0.75rem' }} />
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Retrieving live competitive schedules...
          </div>
        </div>
      ) : processedContests.length > 0 ? (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Contest</th>
                <th style={{ width: '15%' }}>Platform</th>
                <th style={{ width: '18%' }}>Start Date & Time</th>
                <th style={{ width: '12%' }}>Duration</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedContests.map((c, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {c.isLive ? (
                          <span className="badge badge-success" style={{ fontSize: '0.6875rem', fontWeight: 600 }}>
                            LIVE NOW
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>
                            {c.relativeTime}
                          </span>
                        )}
                        {c.personalized_score && (
                          <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                            {c.personalized_score}% Match
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                        {c.title}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className={`badge ${getPlatformBadgeClass(c.platform)}`}>
                      {c.platform || 'Contest'}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {new Date(c.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(c.start_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {c.durationFormatted}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <a
                        href={generateGoogleCalendarUrl(c)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                        title="Add to Google Calendar"
                      >
                        <CalendarPlus size={13} />
                      </a>

                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <span>Participate</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Trophy size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
          <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            No contests match the selected platform or status filters
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Click "Sync Live Contests" above to pull the latest competitive programming schedules.
          </p>
        </div>
      )}
    </div>
  );
}
