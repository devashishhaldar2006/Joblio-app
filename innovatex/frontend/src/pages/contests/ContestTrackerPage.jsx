import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';
import {
  Trophy,
  Calendar,
  Clock,
  ExternalLink,
  Filter,
  CalendarPlus,
  Sparkles,
  Award,
  Flame
} from 'lucide-react';

const PLATFORM_FILTERS = [
  { id: 'all', label: 'All Platforms' },
  { id: 'codeforces', label: 'Codeforces' },
  { id: 'leetcode', label: 'LeetCode' },
  { id: 'codechef', label: 'CodeChef' },
  { id: 'atcoder', label: 'AtCoder' },
  { id: 'hackerrank', label: 'HackerRank' },
  { id: 'geeksforgeeks', label: 'GFG' }
];

const ContestTrackerPage = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list' | 'personalized'
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [timeFilter, setTimeFilter] = useState('7'); // '1' | '2' | '7'
  const [skillLevel, setSkillLevel] = useState('intermediate'); // for personalized
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update ticking countdown timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchContests = async () => {
    setLoading(true);
    try {
      if (viewMode === 'personalized') {
        const res = await api.post('/contests/personalized', {
          skill_level: skillLevel,
          preferred_platforms: selectedPlatform === 'all' ? [] : [selectedPlatform]
        });
        setContests(res.data || []);
      } else {
        const platParam = selectedPlatform === 'all' ? '' : `&platform=${selectedPlatform}`;
        const res = await api.get(`/contests?days=${timeFilter}${platParam}`);
        setContests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch contests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, [viewMode, selectedPlatform, timeFilter, skillLevel]);

  // Format countdown string
  const formatCountdown = (startIso, endIso) => {
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();
    const now = currentTime;

    if (now >= endMs) {
      return { status: 'ended', text: 'Ended' };
    }
    if (now >= startMs && now < endMs) {
      return { status: 'live', text: 'LIVE NOW' };
    }

    const diffSec = Math.floor((startMs - now) / 1000);
    const days = Math.floor(diffSec / (3600 * 24));
    const hours = Math.floor((diffSec % (3600 * 24)) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    let str = '';
    if (days > 0) str += `${days}d `;
    str += `${hours}h ${minutes}m ${seconds}s`;
    return { status: 'upcoming', text: `Starts in ${str}` };
  };

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = (contest) => {
    const start = new Date(contest.start_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(contest.end_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(contest.title);
    const details = encodeURIComponent(`Contest URL: ${contest.url}\nPlatform: ${contest.platform}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  };

  // Group contests by day for 7-day calendar view
  const groupContestsByDay = () => {
    const days = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      days[key] = [];
    }

    contests.forEach((c) => {
      const dateKey = c.start_time?.split('T')[0];
      if (days[dateKey]) {
        days[dateKey].push(c);
      }
    });

    return days;
  };

  const dayColumns = groupContestsByDay();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Navbar title="Competitive Programming Hub" subtitle="Live calendar & countdowns from Codeforces, LeetCode, CodeChef, and AtCoder" />

      <div className="page-container">
        {/* Top Controls Bar */}
        <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            {/* View Toggle */}
            <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.3rem', borderRadius: 'var(--radius-sm)' }}>
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: viewMode === 'calendar' ? 'var(--accent-indigo)' : 'transparent',
                  color: viewMode === 'calendar' ? '#fff' : 'var(--text-muted)'
                }}
              >
                7-Day Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: viewMode === 'list' ? 'var(--accent-indigo)' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Chronological List
              </button>
              <button
                onClick={() => setViewMode('personalized')}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: viewMode === 'personalized' ? 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))' : 'transparent',
                  color: viewMode === 'personalized' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Personalized Picks
              </button>
            </div>

            {/* Time Filter (for non-personalized) */}
            {viewMode !== 'personalized' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Range:</span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                >
                  <option value="1">Today</option>
                  <option value="2">Next 48 Hours</option>
                  <option value="7">This Week (7 Days)</option>
                </select>
              </div>
            )}

            {/* Skill selector for personalized */}
            {viewMode === 'personalized' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Skill Focus:</span>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                >
                  <option value="beginner">Beginner (Div.3, Div.4, LeetCode Biweekly)</option>
                  <option value="intermediate">Intermediate (Div.2, CodeChef Starters)</option>
                  <option value="advanced">Advanced (Div.1, AtCoder AGC/ARC)</option>
                </select>
              </div>
            )}
          </div>

          {/* Platform Filters Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            {PLATFORM_FILTERS.map((p) => {
              const active = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    background: active ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    border: active ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="glass-panel" style={{ padding: '3rem' }}>
            <LoadingSpinner messages={[
              'Fetching live contest data from CLIST.by, Codeforces, and LeetCode GraphQL...',
              'Deduplicating entries and inferring division brackets...',
              'Calculating live second-precision countdowns...'
            ]} />
          </div>
        )}

        {/* Calendar View */}
        {!loading && viewMode === 'calendar' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            alignItems: 'start'
          }}>
            {Object.entries(dayColumns).map(([dateStr, items]) => {
              const dateObj = new Date(dateStr + 'T00:00:00');
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div key={dateStr} className="glass-panel" style={{
                  padding: '1rem',
                  minHeight: '380px',
                  background: isToday ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                  border: isToday ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)'
                }}>
                  {/* Day Header */}
                  <div style={{ textAlign: 'center', paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: isToday ? 'var(--accent-cyan)' : 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {dateObj.toLocaleDateString(undefined, { weekday: 'short' })} {isToday ? '(Today)' : ''}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                      {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Day contest cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {items.length > 0 ? (
                      items.map((c) => {
                        const countdown = formatCountdown(c.start_time, c.end_time);
                        return (
                          <div key={c.contest_id} style={{
                            padding: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.78rem'
                          }}>
                            {/* Platform badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{c.platform}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                {Math.round((c.duration_seconds || 7200) / 3600)}h
                              </span>
                            </div>

                            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                              {c.title}
                            </div>

                            {/* Live Countdown */}
                            <div style={{
                              padding: '0.25rem 0.4rem',
                              borderRadius: '4px',
                              background: countdown.status === 'live' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                              color: countdown.status === 'live' ? '#fda4af' : '#a5b4fc',
                              fontWeight: 600,
                              fontSize: '0.72rem',
                              marginBottom: '0.5rem',
                              textAlign: 'center'
                            }}>
                              {countdown.status === 'live' && <span style={{ marginRight: '0.25rem' }}>●</span>}
                              {countdown.text}
                            </div>

                            {/* Action links */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem' }}
                              >
                                <span>Join</span>
                                <ExternalLink size={10} />
                              </a>
                              <a
                                href={getGoogleCalendarUrl(c)}
                                target="_blank"
                                rel="noreferrer"
                                title="Add to Google Calendar"
                                style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center' }}
                              >
                                <CalendarPlus size={13} />
                              </a>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.78rem', paddingTop: '2rem' }}>
                        No contests
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View / Personalized View */}
        {!loading && (viewMode === 'list' || viewMode === 'personalized') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {contests.length > 0 ? (
              contests.map((c) => {
                const countdown = formatCountdown(c.start_time, c.end_time);
                const startFormatted = new Date(c.start_time).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={c.contest_id} className="glass-card" style={{
                    padding: '1.25rem 1.75rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Trophy size={20} color="var(--accent-amber)" />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            {c.platform}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>•</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Duration: {Math.round((c.duration_seconds || 7200) / 3600)}h
                          </span>
                          {c.is_recommended && (
                            <span className="badge badge-low" style={{ fontSize: '0.68rem' }}>
                              Recommended Match
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>{c.title}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={12} />
                          <span>Starts {startFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Live countdown & buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        background: countdown.status === 'live' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                        color: countdown.status === 'live' ? '#fda4af' : '#a5b4fc',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {countdown.status === 'live' && <span style={{ marginRight: '0.35rem' }}>●</span>}
                        {countdown.text}
                      </div>

                      <a
                        href={getGoogleCalendarUrl(c)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ fontSize: '0.82rem', padding: '0.5rem 0.85rem' }}
                      >
                        <CalendarPlus size={15} />
                        <span>Add to Calendar</span>
                      </a>

                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-gradient"
                        style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                      >
                        <span>Open Contest</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No contests found matching this platform filter.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestTrackerPage;
