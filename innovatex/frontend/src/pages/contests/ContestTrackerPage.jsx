import React, { useState, useEffect, useMemo } from 'react';
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
  Flame,
  RotateCcw,
  Search,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Radio,
  Timer,
  ChevronRight,
  Info,
  X,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import DetailDrawer from '../../components/common/DetailDrawer';
import EmptyState from '../../components/common/EmptyState';

const PLATFORM_CONFIG = {
  codeforces: {
    label: 'Codeforces',
    color: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.28)'
  },
  leetcode: {
    label: 'LeetCode',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.28)'
  },
  codechef: {
    label: 'CodeChef',
    color: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.28)'
  },
  atcoder: {
    label: 'AtCoder',
    color: '#f472b6',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.28)'
  },
  hackerrank: {
    label: 'HackerRank',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.28)'
  },
  geeksforgeeks: {
    label: 'GFG',
    color: '#4ade80',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.28)'
  },
  default: {
    label: 'Contest',
    color: '#a1a1aa',
    bg: 'rgba(161, 161, 170, 0.10)',
    border: 'rgba(161, 161, 170, 0.22)'
  }
};

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
  const toast = useToast();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'list' | 'personalized' | 'saved'
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [timeFilter, setTimeFilter] = useState('7'); // '1' | '2' | '7'
  const [skillLevel, setSkillLevel] = useState('intermediate'); // for personalized
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedContest, setSelectedContest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayKey, setSelectedDayKey] = useState('all'); // 'all' or 'YYYY-MM-DD'

  // Saved / Bookmarked Contests in localStorage
  const [savedContestIds, setSavedContestIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('innovatex_saved_contests') || '[]');
    } catch {
      return [];
    }
  });

  const toggleSaveContest = (contestId) => {
    let next;
    if (savedContestIds.includes(contestId)) {
      next = savedContestIds.filter((id) => id !== contestId);
      toast.info('Removed contest from your reminders');
    } else {
      next = [...savedContestIds, contestId];
      toast.success('Saved to your contest reminders');
    }
    setSavedContestIds(next);
    localStorage.setItem('innovatex_saved_contests', JSON.stringify(next));
  };

  // Next upcoming contest for Competitive Radar
  const nextUpcomingContest = useMemo(() => {
    const upcoming = contests.filter((c) => new Date(c.start_time).getTime() > currentTime);
    return upcoming.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || null;
  }, [contests, currentTime]);

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
      toast.error('Unable to retrieve contest feeds');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, [viewMode, selectedPlatform, timeFilter, skillLevel]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchContests();
    toast.info('Refreshing live competitive tournament feeds');
  };

  // Format countdown string
  const formatCountdown = (startIso, endIso) => {
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();
    const now = currentTime;

    if (now >= endMs) {
      return { status: 'ended', text: 'Concluded', label: 'Ended' };
    }
    if (now >= startMs && now < endMs) {
      const remainingSec = Math.max(0, Math.floor((endMs - now) / 1000));
      const hours = Math.floor(remainingSec / 3600);
      const minutes = Math.floor((remainingSec % 3600) / 60);
      const seconds = remainingSec % 60;
      return {
        status: 'live',
        text: `${hours}h ${minutes}m ${seconds}s left`,
        label: 'LIVE NOW'
      };
    }

    const diffSec = Math.floor((startMs - now) / 1000);
    const days = Math.floor(diffSec / (3600 * 24));
    const hours = Math.floor((diffSec % (3600 * 24)) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    if (days > 0) {
      return {
        status: 'upcoming',
        text: `Starts in ${days}d ${hours}h ${minutes}m`,
        label: `${days}d ${hours}h`
      };
    }
    return {
      status: 'imminent',
      text: `Starts in ${hours}h ${minutes}m ${seconds}s`,
      label: `${hours}h ${minutes}m`
    };
  };

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = (contest) => {
    const start = new Date(contest.start_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(contest.end_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(contest.title);
    const details = encodeURIComponent(`Contest URL: ${contest.url}\nPlatform: ${contest.platform}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  };

  // Filtered contests based on search query
  const filteredContests = useMemo(() => {
    let list = contests;
    if (viewMode === 'saved') {
      list = contests.filter((c) => savedContestIds.includes(c.contest_id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.platform?.toLowerCase().includes(q) ||
          c.difficulty?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contests, searchQuery, viewMode, savedContestIds]);

  // Construct 7-Day Window for the Weekly Navigation Strip & Grouping
  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDate = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      const isToday = i === 0;

      // Find contests matching this dateKey
      const dayContests = filteredContests.filter((c) => {
        if (!c.start_time) return false;
        return c.start_time.split('T')[0] === dateKey;
      });

      const hasLive = dayContests.some((c) => {
        const s = new Date(c.start_time).getTime();
        const e = new Date(c.end_time).getTime();
        return currentTime >= s && currentTime < e;
      });

      days.push({
        dateKey,
        dayName,
        monthDay,
        fullDate,
        isToday,
        items: dayContests,
        count: dayContests.length,
        hasLive
      });
    }
    return days;
  }, [filteredContests, currentTime]);

  const totalWeeklyRounds = useMemo(() => {
    return weekDays.reduce((acc, d) => acc + d.count, 0);
  }, [weekDays]);

  const getPlatformStyle = (platform = '') => {
    const key = (platform || '').toLowerCase();
    return PLATFORM_CONFIG[key] || PLATFORM_CONFIG.default;
  };

  return (
    <div
      style={{
        backgroundColor: '#0B0B0D',
        minHeight: '100vh',
        color: '#f4f4f6',
        padding: '3rem 3.5rem 5rem 3.5rem',
        maxWidth: '1320px',
        margin: '0 auto',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Telemetry & Global Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #18181d'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#71717a'
            }}
          >
            COMPETITIONS · 7-DAY SCHEDULE & CONTEST TELEMETRY
          </span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            style={{
              background: 'transparent',
              border: '1px solid #202026',
              color: '#d4d4d8',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: refreshing || loading ? 'not-allowed' : 'pointer',
              padding: '0.35rem 0.75rem',
              borderRadius: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#363642';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#202026';
              e.currentTarget.style.color = '#d4d4d8';
            }}
          >
            <RotateCcw size={12} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Feeds'}</span>
          </button>
        </div>
      </div>

      {/* Main Title Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 0.5rem 0',
            color: '#f4f4f6'
          }}
        >
          Competitive Programming Hub
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#8e8e99',
            margin: 0,
            maxWidth: '700px',
            lineHeight: '1.5'
          }}
        >
          Synchronized agendas, division brackets, second-precision countdowns, and personalized algorithmic matchmaking across Codeforces, LeetCode, CodeChef, and AtCoder.
        </p>
      </div>

      {/* Top COMPETITIVE RADAR // Next Round Banner */}
      {nextUpcomingContest && (
        <div
          style={{
            background: '#0E0E12',
            border: '1px solid #1E1E26',
            borderLeft: '3px solid #6366f1',
            borderRadius: '6px',
            padding: '1.25rem 1.75rem',
            marginBottom: '2.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ flex: '1 1 380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: 'rgba(99, 102, 241, 0.14)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#818cf8'
                }}
              >
                NEXT RADAR LOCK
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: getPlatformStyle(nextUpcomingContest.platform).color
                }}
              >
                {nextUpcomingContest.platform}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#52525b' }}>•</span>
              <span style={{ fontSize: '0.72rem', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                {Math.round((new Date(nextUpcomingContest.end_time) - new Date(nextUpcomingContest.start_time)) / 3600000)}h Duration
              </span>
            </div>

            <h2
              style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                color: '#f4f4f6',
                margin: '0 0 0.4rem 0',
                letterSpacing: '-0.01em'
              }}
            >
              {nextUpcomingContest.title}
            </h2>

            <div
              style={{
                fontSize: '0.78rem',
                color: '#71717a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Clock size={12} color="#71717a" />
              <span>
                {new Date(nextUpcomingContest.start_time).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span style={{ color: '#3f3f46' }}>|</span>
              <span style={{ color: '#52525b' }}>
                UTC: {new Date(nextUpcomingContest.start_time).toISOString().replace('T', ' ').substring(0, 16)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div
              style={{
                background: '#131318',
                border: '1px solid #22222c',
                padding: '0.5rem 1rem',
                borderRadius: '5px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#71717a', letterSpacing: '0.05em' }}>
                COUNTDOWN
              </div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: '#34d399',
                  marginTop: '0.1rem'
                }}
              >
                {formatCountdown(nextUpcomingContest.start_time, nextUpcomingContest.end_time).label}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedContest(nextUpcomingContest)}
              style={{
                background: 'transparent',
                border: '1px solid #272732',
                color: '#d4d4d8',
                fontSize: '0.8rem',
                padding: '0.55rem 0.9rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3e3e4f';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#272732';
                e.currentTarget.style.color = '#d4d4d8';
              }}
            >
              Telemetry
            </button>

            <a
              href={getGoogleCalendarUrl(nextUpcomingContest)}
              target="_blank"
              rel="noreferrer"
              title="Add to Google Calendar"
              style={{
                background: 'transparent',
                border: '1px solid #272732',
                color: '#a1a1aa',
                padding: '0.55rem 0.75rem',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none'
              }}
            >
              <CalendarPlus size={15} />
            </a>

            <a
              href={nextUpcomingContest.url}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#ffffff',
                color: '#000000',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.55rem 1rem',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none',
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span>Register</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}

      {/* Main Control Panel */}
      <div
        style={{
          background: '#0E0E12',
          border: '1px solid #18181D',
          borderRadius: '6px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          {/* View Mode Switcher */}
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              background: '#070709',
              border: '1px solid #1E1E26',
              padding: '0.25rem',
              borderRadius: '5px'
            }}
          >
            {[
              { id: 'weekly', label: 'Weekly Schedule', icon: CalendarDays },
              { id: 'list', label: 'Chronological List', icon: Layers },
              { id: 'personalized', label: 'Personalized Picks', icon: Sparkles },
              { id: 'saved', label: `Saved (${savedContestIds.length})`, icon: Bookmark }
            ].map((tab) => {
              const active = viewMode === tab.id;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: active ? 600 : 500,
                    background: active ? '#1E1E28' : 'transparent',
                    color: active ? '#ffffff' : '#8e8e99',
                    border: active ? '1px solid #2B2B38' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComponent size={13} color={active ? '#60a5fa' : '#71717a'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search & Auxiliary Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={13}
                color="#71717a"
                style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Filter by title (e.g. Div. 2, Starters)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: '#070709',
                  border: '1px solid #1E1E26',
                  color: '#f4f4f6',
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.75rem 0.4rem 2rem',
                  borderRadius: '4px',
                  width: '240px',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
              />
              {searchQuery && (
                <X
                  size={12}
                  color="#71717a"
                  style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>

            {viewMode === 'list' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>Range:</span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  style={{
                    background: '#070709',
                    border: '1px solid #1E1E26',
                    color: '#d4d4d8',
                    fontSize: '0.78rem',
                    padding: '0.4rem 0.65rem',
                    borderRadius: '4px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="1">Next 24 Hours</option>
                  <option value="2">Next 48 Hours</option>
                  <option value="7">Next 7 Days</option>
                </select>
              </div>
            )}

            {viewMode === 'personalized' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>Focus:</span>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  style={{
                    background: '#070709',
                    border: '1px solid #1E1E26',
                    color: '#d4d4d8',
                    fontSize: '0.78rem',
                    padding: '0.4rem 0.65rem',
                    borderRadius: '4px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="beginner">Beginner (Div. 3 / Div. 4 / LeetCode)</option>
                  <option value="intermediate">Intermediate (Div. 2 / CodeChef Starters)</option>
                  <option value="advanced">Advanced (Div. 1 / AtCoder AGC/ARC)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Platform Filter Chips */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.45rem',
            marginTop: '1rem',
            paddingTop: '0.9rem',
            borderTop: '1px solid #18181D'
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#71717a', fontFamily: 'var(--font-mono)', marginRight: '0.25rem' }}>
            PLATFORMS:
          </span>
          {PLATFORM_FILTERS.map((p) => {
            const active = selectedPlatform === p.id;
            const pStyle = PLATFORM_CONFIG[p.id] || PLATFORM_CONFIG.default;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                style={{
                  padding: '0.22rem 0.65rem',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: active ? 600 : 500,
                  background: active ? pStyle.bg : 'transparent',
                  color: active ? pStyle.color : '#8e8e99',
                  border: active ? `1px solid ${pStyle.border}` : '1px solid #1C1C24',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
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
        <div
          style={{
            background: '#0E0E12',
            border: '1px solid #18181D',
            borderRadius: '6px',
            padding: '3rem',
            textAlign: 'center'
          }}
        >
          <LoadingSpinner
            messages={[
              'Connecting to Codeforces, LeetCode, AtCoder, and CodeChef feeds...',
              'Aggregating tournament start schedules & division brackets...',
              'Synchronizing real-time countdown clocks...'
            ]}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. WEEKLY SCHEDULE VIEW (REDESIGNED CORE VIEW)             */}
      {/* ========================================================= */}
      {!loading && viewMode === 'weekly' && (
        <div>
          {/* Interactive 7-Day Weekday Navigation Bar */}
          <div
            style={{
              background: '#0E0E12',
              border: '1px solid #18181D',
              borderRadius: '6px',
              padding: '0.85rem 1rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              overflowX: 'auto'
            }}
          >
            {/* All Days Overview Button */}
            <button
              onClick={() => setSelectedDayKey('all')}
              style={{
                flex: '0 0 auto',
                background: selectedDayKey === 'all' ? '#1E1E28' : 'transparent',
                border: selectedDayKey === 'all' ? '1px solid #363646' : '1px solid #18181D',
                borderRadius: '5px',
                padding: '0.6rem 0.9rem',
                color: selectedDayKey === 'all' ? '#ffffff' : '#8e8e99',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>WEEK VIEW</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>All 7 Days</div>
              <div style={{ fontSize: '0.68rem', color: '#60a5fa', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                {totalWeeklyRounds} rounds
              </div>
            </button>

            <div style={{ width: '1px', height: '40px', background: '#1E1E26', margin: '0 0.25rem' }} />

            {/* 7 Individual Days Pills */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '0.5rem',
                flex: 1,
                minWidth: '700px'
              }}
            >
              {weekDays.map((day) => {
                const isSelected = selectedDayKey === day.dateKey;
                return (
                  <button
                    key={day.dateKey}
                    onClick={() => setSelectedDayKey(isSelected ? 'all' : day.dateKey)}
                    style={{
                      background: isSelected
                        ? '#1c1c26'
                        : day.isToday
                        ? 'rgba(99, 102, 241, 0.08)'
                        : 'transparent',
                      border: isSelected
                        ? '1px solid #6366f1'
                        : day.isToday
                        ? '1px solid rgba(99, 102, 241, 0.35)'
                        : '1px solid #18181D',
                      borderRadius: '5px',
                      padding: '0.55rem 0.65rem',
                      color: isSelected ? '#ffffff' : '#f4f4f6',
                      cursor: 'pointer',
                      textAlign: 'center',
                      position: 'relative',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = '#2A2A38';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !day.isToday) e.currentTarget.style.borderColor = '#18181D';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: day.isToday ? '#818cf8' : '#71717a'
                      }}
                    >
                      <span>{day.dayName}</span>
                      {day.isToday && (
                        <span
                          style={{
                            fontSize: '0.55rem',
                            padding: '1px 3px',
                            background: 'rgba(99, 102, 241, 0.25)',
                            color: '#c7d2fe',
                            borderRadius: '2px'
                          }}
                        >
                          TODAY
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.15rem' }}>
                      {day.monthDay}
                    </div>

                    <div
                      style={{
                        marginTop: '0.25rem',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        color: day.count > 0 ? (day.hasLive ? '#34d399' : '#818cf8') : '#52525b'
                      }}
                    >
                      {day.hasLive && (
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: '#34d399',
                            display: 'inline-block'
                          }}
                        />
                      )}
                      <span>{day.count === 0 ? '0 rounds' : `${day.count} ${day.count === 1 ? 'round' : 'rounds'}`}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Pill when a specific day is focused */}
          {selectedDayKey !== 'all' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#131318',
                border: '1px solid #202028',
                padding: '0.6rem 1rem',
                borderRadius: '5px',
                marginBottom: '1.5rem',
                fontSize: '0.78rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#71717a' }}>Filtering:</span>
                <span style={{ fontWeight: 600, color: '#f4f4f6' }}>
                  {weekDays.find((d) => d.dateKey === selectedDayKey)?.fullDate || selectedDayKey}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#60a5fa',
                    background: 'rgba(96, 165, 250, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '3px'
                  }}
                >
                  {weekDays.find((d) => d.dateKey === selectedDayKey)?.count || 0} competitions
                </span>
              </div>
              <button
                onClick={() => setSelectedDayKey('all')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#93c5fd',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: 0
                }}
              >
                <span>Reset to All 7 Days</span>
                <X size={13} />
              </button>
            </div>
          )}

          {/* Day-by-Day Agenda List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {weekDays
              .filter((day) => selectedDayKey === 'all' || day.dateKey === selectedDayKey)
              .map((day) => {
                const hasContests = day.items.length > 0;

                // If day has no contests in "all" view, show sleek compact status line
                if (!hasContests && selectedDayKey === 'all') {
                  return (
                    <div
                      key={day.dateKey}
                      style={{
                        padding: '0.65rem 1rem',
                        background: '#0D0D10',
                        border: '1px solid #16161C',
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#52525b'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#71717a' }}>
                          {day.dayName}, {day.monthDay}
                        </span>
                        {day.isToday && (
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontFamily: 'var(--font-mono)',
                              color: '#818cf8',
                              padding: '1px 5px',
                              background: 'rgba(99, 102, 241, 0.1)',
                              borderRadius: '2px'
                            }}
                          >
                            TODAY
                          </span>
                        )}
                        <span>— No scheduled competitions (Rest or algorithmic practice)</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#3f3f46' }}>0 ROUNDS</span>
                    </div>
                  );
                }

                // If single day is focused and has no contests
                if (!hasContests && selectedDayKey !== 'all') {
                  return (
                    <div
                      key={day.dateKey}
                      style={{
                        background: '#0E0E12',
                        border: '1px solid #18181D',
                        borderRadius: '6px',
                        padding: '3rem',
                        textAlign: 'center'
                      }}
                    >
                      <EmptyState
                        title="No Competitions on this Day"
                        description={`There are no competitive programming rounds scheduled for ${day.fullDate}. Click below to view the rest of the week.`}
                        actionLabel="View All 7 Days"
                        onAction={() => setSelectedDayKey('all')}
                      />
                    </div>
                  );
                }

                return (
                  <div key={day.dateKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Day Group Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid #1C1C24'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase',
                            color: day.isToday ? '#818cf8' : '#e4e4e7',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {day.dayName}, {day.monthDay}
                        </span>
                        {day.isToday && (
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: '#6366f1',
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              padding: '1px 6px',
                              borderRadius: '3px'
                            }}
                          >
                            TODAY
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#71717a'
                        }}
                      >
                        {day.items.length} {day.items.length === 1 ? 'TOURNAMENT' : 'TOURNAMENTS'}
                      </span>
                    </div>

                    {/* Day Tournament Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {day.items.map((c) => {
                        const countdown = formatCountdown(c.start_time, c.end_time);
                        const pStyle = getPlatformStyle(c.platform);
                        const isSaved = savedContestIds.includes(c.contest_id);
                        const startTime = new Date(c.start_time);
                        const endTime = new Date(c.end_time);
                        const durationHours = Math.round((endTime - startTime) / 3600000);

                        return (
                          <div
                            key={c.contest_id}
                            style={{
                              background: '#0E0E12',
                              border: countdown.status === 'live' ? '1px solid #059669' : '1px solid #18181D',
                              borderRadius: '6px',
                              padding: '1.15rem 1.4rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1.25rem',
                              flexWrap: 'wrap',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (countdown.status !== 'live') e.currentTarget.style.borderColor = '#262633';
                            }}
                            onMouseLeave={(e) => {
                              if (countdown.status !== 'live') e.currentTarget.style.borderColor = '#18181D';
                            }}
                          >
                            {/* Column 1: Time & Countdown Indicator */}
                            <div style={{ flex: '0 0 170px' }}>
                              <div
                                style={{
                                  fontSize: '0.95rem',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                  color: '#f4f4f6'
                                }}
                              >
                                {startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </div>

                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#71717a',
                                  fontFamily: 'var(--font-mono)',
                                  marginTop: '0.15rem'
                                }}
                              >
                                {durationHours}h Duration · UTC {startTime.toISOString().substring(11, 16)}
                              </div>

                              <div style={{ marginTop: '0.45rem' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    fontSize: '0.68rem',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 600,
                                    padding: '2px 7px',
                                    borderRadius: '3px',
                                    background:
                                      countdown.status === 'live'
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : countdown.status === 'imminent'
                                        ? 'rgba(99, 102, 241, 0.14)'
                                        : 'rgba(255, 255, 255, 0.04)',
                                    color:
                                      countdown.status === 'live'
                                        ? '#34d399'
                                        : countdown.status === 'imminent'
                                        ? '#a5b4fc'
                                        : '#8e8e99',
                                    border:
                                      countdown.status === 'live'
                                        ? '1px solid rgba(16, 185, 129, 0.35)'
                                        : '1px solid transparent'
                                  }}
                                >
                                  {countdown.status === 'live' && (
                                    <span
                                      style={{
                                        width: '5px',
                                        height: '5px',
                                        borderRadius: '50%',
                                        background: '#34d399',
                                        boxShadow: '0 0 5px #34d399'
                                      }}
                                    />
                                  )}
                                  {countdown.text}
                                </span>
                              </div>
                            </div>

                            {/* Column 2: Platform Badge & Contest Title */}
                            <div style={{ flex: '1 1 360px', minWidth: '240px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 600,
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    background: pStyle.bg,
                                    color: pStyle.color,
                                    border: `1px solid ${pStyle.border}`
                                  }}
                                >
                                  {c.platform}
                                </span>

                                {c.difficulty && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      fontFamily: 'var(--font-mono)',
                                      color: '#a1a1aa',
                                      background: 'rgba(255, 255, 255, 0.04)',
                                      padding: '1px 6px',
                                      borderRadius: '3px'
                                    }}
                                  >
                                    {c.difficulty.toUpperCase()}
                                  </span>
                                )}

                                {c.is_recommended && (
                                  <span
                                    style={{
                                      fontSize: '0.65rem',
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: 600,
                                      color: '#34d399',
                                      background: 'rgba(52, 211, 153, 0.12)',
                                      padding: '1px 6px',
                                      borderRadius: '3px'
                                    }}
                                  >
                                    MATCHED TO PROFILE
                                  </span>
                                )}
                              </div>

                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: '0.98rem',
                                  fontWeight: 600,
                                  color: '#f4f4f6',
                                  textDecoration: 'none',
                                  display: 'inline-block',
                                  lineHeight: '1.4'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#93c5fd')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#f4f4f6')}
                              >
                                {c.title}
                              </a>
                            </div>

                            {/* Column 3: Action Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <button
                                type="button"
                                onClick={() => toggleSaveContest(c.contest_id)}
                                title={isSaved ? 'Remove from reminders' : 'Save contest to reminders'}
                                style={{
                                  background: isSaved ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                  border: isSaved ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #202028',
                                  color: isSaved ? '#fbbf24' : '#71717a',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSaved) e.currentTarget.style.borderColor = '#363644';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSaved) e.currentTarget.style.borderColor = '#202028';
                                }}
                              >
                                {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                              </button>

                              <a
                                href={getGoogleCalendarUrl(c)}
                                target="_blank"
                                rel="noreferrer"
                                title="Add to Google Calendar"
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #202028',
                                  color: '#71717a',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  textDecoration: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#363644';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#202028';
                                  e.currentTarget.style.color = '#71717a';
                                }}
                              >
                                <CalendarPlus size={14} />
                              </a>

                              <button
                                type="button"
                                onClick={() => setSelectedContest(c)}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #202028',
                                  color: '#d4d4d8',
                                  fontSize: '0.75rem',
                                  padding: '0.45rem 0.8rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-sans)',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#363644';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#202028';
                                  e.currentTarget.style.color = '#d4d4d8';
                                }}
                              >
                                Details
                              </button>

                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: '#191922',
                                  border: '1px solid #2c2c3a',
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  textDecoration: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#222230';
                                  e.currentTarget.style.borderColor = '#404054';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#191922';
                                  e.currentTarget.style.borderColor = '#2c2c3a';
                                }}
                              >
                                <span>Join</span>
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CHRONOLOGICAL LIST / PERSONALIZED / SAVED VIEWS         */}
      {/* ========================================================= */}
      {!loading && viewMode !== 'weekly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredContests.length > 0 ? (
            filteredContests.map((c) => {
              const countdown = formatCountdown(c.start_time, c.end_time);
              const pStyle = getPlatformStyle(c.platform);
              const isSaved = savedContestIds.includes(c.contest_id);
              const startFormatted = new Date(c.start_time).toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              const durationHours = Math.round((new Date(c.end_time) - new Date(c.start_time)) / 3600000);

              return (
                <div
                  key={c.contest_id}
                  style={{
                    background: '#0E0E12',
                    border: countdown.status === 'live' ? '1px solid #059669' : '1px solid #18181D',
                    borderRadius: '6px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (countdown.status !== 'live') e.currentTarget.style.borderColor = '#262633';
                  }}
                  onMouseLeave={(e) => {
                    if (countdown.status !== 'live') e.currentTarget.style.borderColor = '#18181D';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: '1 1 450px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '6px',
                        background: pStyle.bg,
                        border: `1px solid ${pStyle.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Trophy size={18} color={pStyle.color} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            color: pStyle.color
                          }}
                        >
                          {c.platform}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#52525b' }}>•</span>
                        <span style={{ fontSize: '0.72rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                          {durationHours}h Duration
                        </span>

                        {c.personalized_score && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              color: '#34d399',
                              background: 'rgba(52, 211, 153, 0.1)',
                              padding: '1px 5px',
                              borderRadius: '3px'
                            }}
                          >
                            {c.personalized_score}% Match
                          </span>
                        )}

                        {c.is_recommended && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontFamily: 'var(--font-mono)',
                              color: '#60a5fa',
                              background: 'rgba(96, 165, 250, 0.1)',
                              padding: '1px 5px',
                              borderRadius: '3px'
                            }}
                          >
                            Target Skill Match
                          </span>
                        )}
                      </div>

                      <h3
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 600,
                          color: '#f4f4f6',
                          margin: '0 0 0.35rem 0',
                          lineHeight: '1.3'
                        }}
                      >
                        {c.title}
                      </h3>

                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#71717a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        <Clock size={12} color="#71717a" />
                        <span>Starts {startFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Countdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '4px',
                        background:
                          countdown.status === 'live'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(255, 255, 255, 0.04)',
                        color: countdown.status === 'live' ? '#34d399' : '#a1a1aa',
                        fontSize: '0.75rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        border:
                          countdown.status === 'live'
                            ? '1px solid rgba(16, 185, 129, 0.35)'
                            : '1px solid #1E1E26'
                      }}
                    >
                      {countdown.status === 'live' && <span style={{ marginRight: '0.35rem' }}>●</span>}
                      {countdown.text}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSaveContest(c.contest_id)}
                      title={isSaved ? 'Remove from reminders' : 'Save to reminders'}
                      style={{
                        background: isSaved ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                        border: isSaved ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #202028',
                        color: isSaved ? '#fbbf24' : '#71717a',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    </button>

                    <a
                      href={getGoogleCalendarUrl(c)}
                      target="_blank"
                      rel="noreferrer"
                      title="Add to Google Calendar"
                      style={{
                        background: 'transparent',
                        border: '1px solid #202028',
                        color: '#71717a',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        textDecoration: 'none'
                      }}
                    >
                      <CalendarPlus size={14} />
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedContest(c)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #202028',
                        color: '#d4d4d8',
                        fontSize: '0.78rem',
                        padding: '0.45rem 0.8rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      Details
                    </button>

                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#ffffff',
                        color: '#000000',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '0.45rem 0.95rem',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        textDecoration: 'none'
                      }}
                    >
                      <span>Open</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                background: '#0E0E12',
                border: '1px solid #18181D',
                borderRadius: '6px',
                padding: '3rem',
                textAlign: 'center'
              }}
            >
              <EmptyState
                title={viewMode === 'saved' ? 'No Saved Reminders' : 'No Contests Found'}
                description={
                  viewMode === 'saved'
                    ? 'Click the bookmark icon on any contest across the weekly schedule to store your upcoming tournament reminders here.'
                    : 'No tournaments match your active platform or search parameters.'
                }
                actionLabel={viewMode === 'saved' ? 'Explore Weekly Schedule' : 'Clear Filters'}
                onAction={() => {
                  if (viewMode === 'saved') {
                    setViewMode('weekly');
                  } else {
                    setSelectedPlatform('all');
                    setSearchQuery('');
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Contest Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedContest}
        onClose={() => setSelectedContest(null)}
        title={selectedContest?.title || 'Contest Details'}
        subtitle={`Platform: ${selectedContest?.platform || 'Codeforces'}`}
        badge="TOURNAMENT TELEMETRY"
      >
        {selectedContest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: '#111117', border: '1px solid #1E1E26', padding: '0.85rem', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>PLATFORM</div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: getPlatformStyle(selectedContest.platform).color,
                    marginTop: '0.2rem'
                  }}
                >
                  {selectedContest.platform}
                </div>
              </div>

              <div style={{ background: '#111117', border: '1px solid #1E1E26', padding: '0.85rem', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>STATUS</div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color:
                      formatCountdown(selectedContest.start_time, selectedContest.end_time).status === 'live'
                        ? '#34d399'
                        : '#60a5fa',
                    marginTop: '0.2rem'
                  }}
                >
                  {formatCountdown(selectedContest.start_time, selectedContest.end_time).label.toUpperCase()}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#111117',
                border: '1px solid #1E1E26',
                borderRadius: '4px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#71717a' }}>Start Time (Local):</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {new Date(selectedContest.start_time).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#71717a' }}>Start Time (UTC):</span>
                <span style={{ color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                  {new Date(selectedContest.start_time).toUTCString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: '#71717a' }}>Duration:</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {Math.round((new Date(selectedContest.end_time) - new Date(selectedContest.start_time)) / 3600000)} Hours
                </span>
              </div>
              {selectedContest.difficulty && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: '#71717a' }}>Bracket Tier:</span>
                  <span style={{ color: '#60a5fa', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                    {selectedContest.difficulty}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => toggleSaveContest(selectedContest.contest_id)}
                style={{
                  background: 'transparent',
                  border: '1px solid #272732',
                  color: savedContestIds.includes(selectedContest.contest_id) ? '#fbbf24' : '#d4d4d8',
                  fontSize: '0.8rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {savedContestIds.includes(selectedContest.contest_id) ? (
                  <>
                    <BookmarkCheck size={14} />
                    <span>Saved to Reminders</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={14} />
                    <span>Remind Me</span>
                  </>
                )}
              </button>

              <a
                href={getGoogleCalendarUrl(selectedContest)}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'transparent',
                  border: '1px solid #272732',
                  color: '#d4d4d8',
                  fontSize: '0.8rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textDecoration: 'none'
                }}
              >
                <CalendarPlus size={14} />
                <span>Google Calendar</span>
              </a>

              <a
                href={selectedContest.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.55rem 1rem',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textDecoration: 'none'
                }}
              >
                <span>Register</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

export default ContestTrackerPage;
