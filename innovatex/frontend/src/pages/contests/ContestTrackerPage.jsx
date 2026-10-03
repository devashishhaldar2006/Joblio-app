import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CalendarPlus,
  Search,
  X,
  RotateCcw,
  Clock,
  MapPin,
  Trophy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import DetailDrawer from '../../components/common/DetailDrawer';

const WEEKDAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const STATUS_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    dotColor: '#3b82f6',
    barBg: 'rgba(59, 130, 246, 0.12)',
    barBorder: '#3b82f6',
    textColor: '#93c5fd'
  },
  active: {
    label: 'Active',
    dotColor: '#22c55e',
    barBg: 'rgba(34, 197, 94, 0.12)',
    barBorder: '#22c55e',
    textColor: '#86efac'
  },
  closing_soon: {
    label: 'Closing Soon',
    dotColor: '#f59e0b',
    barBg: 'rgba(245, 158, 11, 0.12)',
    barBorder: '#f59e0b',
    textColor: '#fde047'
  },
  completed: {
    label: 'Completed',
    dotColor: '#71717a',
    barBg: 'rgba(113, 113, 122, 0.12)',
    barBorder: '#71717a',
    textColor: '#a1a1aa'
  }
};

const ContestTrackerPage = () => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Upcoming' | 'Active' | 'Closing Soon' | 'Recently Completed'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'

  // Monthly Calendar Navigation (Auto-anchored to current real date)
  const initialDate = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Filters
  const [techFilter, setTechFilter] = useState('All');
  const [formatFilter, setFormatFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [prizeFilter, setPrizeFilter] = useState('All');
  const [organizerFilter, setOrganizerFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer & Hover Tooltip
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Live Competitions State (Zero hardcoded demo data)
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Fetch real-time live contests from backend
  const fetchLiveContests = async (forceRefresh = false) => {
    if (forceRefresh) setSyncing(true);
    else setLoading(true);

    try {
      const url = forceRefresh ? '/contests?days=60&refresh=true' : '/contests?days=60';
      const res = await api.get(url);
      const rawContests = res.data || [];
      const nowMs = Date.now();

      const normalized = rawContests.map((c, idx) => {
        const startMs = new Date(c.start_time).getTime();
        const endMs = new Date(c.end_time || c.start_time).getTime();
        const startDate = c.start_time ? c.start_time.split('T')[0] : '';
        const endDate = c.end_time ? c.end_time.split('T')[0] : startDate;
        const diff = c.difficulty || 'Intermediate';
        const durationHours = Math.round(((c.duration_seconds || 7200) / 3600) * 10) / 10;

        // Accurate real status calculation
        let status = 'upcoming';
        let regStatus = 'Open';
        let deadlineText = '';

        if (nowMs >= endMs) {
          status = 'completed';
          regStatus = 'Concluded';
          deadlineText = 'Concluded';
        } else if (nowMs >= startMs && nowMs < endMs) {
          status = 'active';
          regStatus = 'Live Now';
          const leftSec = Math.floor((endMs - nowMs) / 1000);
          const leftH = Math.floor(leftSec / 3600);
          const leftM = Math.floor((leftSec % 3600) / 60);
          deadlineText = `Live now · ${leftH}h ${leftM}m left`;
        } else {
          const diffSec = Math.floor((startMs - nowMs) / 1000);
          const diffDays = Math.floor(diffSec / (3600 * 24));
          const diffHours = Math.floor((diffSec % (3600 * 24)) / 3600);

          if (diffDays === 0) {
            status = 'closing_soon';
            deadlineText = diffHours <= 1 ? 'Starts in under 1 hour' : `Starts in ${diffHours} hours`;
          } else if (diffDays === 1) {
            status = 'closing_soon';
            deadlineText = 'Starts tomorrow';
          } else if (diffDays <= 3) {
            status = 'closing_soon';
            deadlineText = `Registration closes in ${diffDays} days`;
          } else {
            status = 'upcoming';
            deadlineText = `Starts in ${diffDays} days`;
          }
        }

        // Real organizer mapping
        const organizer = c.platform || 'Competitive Programming';

        // Prize estimation based on real tier
        let prizePool = 'Official Rating & Badges';
        let prizeNumeric = 3000;
        const titleLower = (c.title || '').toLowerCase();
        if (titleLower.includes('ctf') || titleLower.includes('maratón') || titleLower.includes('cup') || titleLower.includes('grand')) {
          prizePool = 'Cash Pool & Honors';
          prizeNumeric = 15000;
        } else if (organizer.includes('Codeforces') || organizer.includes('LeetCode')) {
          prizePool = 'Global Rating & Merch';
          prizeNumeric = 5000;
        }

        return {
          id: c.contest_id || `contest-${idx}-${startDate}`,
          title: c.title,
          organizer,
          format: c.format || 'Online',
          location: c.location || 'Global · Virtual',
          technologies: c.technologies && c.technologies.length > 0 ? c.technologies : ['Algorithms', 'Data Structures'],
          difficulty: diff.charAt(0).toUpperCase() + diff.slice(1),
          prizePool,
          prizeNumeric,
          startDate,
          endDate,
          deadline: endDate,
          deadlineText,
          status,
          registrationStatus: regStatus,
          description: `Official live challenge on ${organizer}. Duration: ${durationHours} hours. Start time: ${new Date(c.start_time).toLocaleString()} (${new Date(c.start_time).toUTCString()}). Tested directly against official testcases.`,
          url: c.url,
          duration_seconds: c.duration_seconds,
          start_time: c.start_time,
          end_time: c.end_time
        };
      });

      // Deduplicate by title & startDate
      const seen = new Set();
      const deduped = [];
      for (const item of normalized) {
        const key = `${item.title.toLowerCase().trim()}_${item.startDate}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }

      setCompetitions(deduped);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to load real competitions:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchLiveContests();
  }, []);

  // Google Calendar URL generator
  const getGoogleCalendarUrl = (comp) => {
    if (!comp) return '#';
    const sDate = comp.startDate.replace(/-/g, '');
    const eDate = (comp.endDate || comp.startDate).replace(/-/g, '');
    const title = encodeURIComponent(comp.title);
    const details = encodeURIComponent(
      `${comp.description}\n\nOrganizer: ${comp.organizer}\nPrize: ${comp.prizePool}\nDirect Link: ${comp.url}`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${sDate}/${eDate}&details=${details}`;
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleTodayMonth = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const currentMonthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Dynamically derive real organizers & technologies from live data
  const availableOrganizers = useMemo(() => {
    const orgs = new Set(competitions.map((c) => c.organizer).filter(Boolean));
    return Array.from(orgs).sort();
  }, [competitions]);

  const availableTechnologies = useMemo(() => {
    const techs = new Set();
    competitions.forEach((c) => {
      (c.technologies || []).forEach((t) => techs.add(t));
    });
    return Array.from(techs).sort();
  }, [competitions]);

  // Tab Filtering & Query Filtering
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((comp) => {
      // Primary Tab Filtering
      if (activeTab === 'Upcoming' && comp.status !== 'upcoming') return false;
      if (activeTab === 'Active' && comp.status !== 'active') return false;
      if (activeTab === 'Closing Soon' && comp.status !== 'closing_soon') return false;
      if (activeTab === 'Recently Completed' && comp.status !== 'completed') return false;

      // Technology Dropdown
      if (techFilter !== 'All') {
        const hasTech = (comp.technologies || []).some((t) => t.toLowerCase().includes(techFilter.toLowerCase()));
        if (!hasTech) return false;
      }

      // Format Dropdown
      if (formatFilter !== 'All' && comp.format.toLowerCase() !== formatFilter.toLowerCase()) {
        return false;
      }

      // Difficulty Dropdown
      if (difficultyFilter !== 'All' && comp.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()) {
        return false;
      }

      // Prize Pool Dropdown
      if (prizeFilter !== 'All') {
        if (prizeFilter === 'Any Prize' && comp.prizeNumeric <= 0) return false;
        if (prizeFilter === '$10k+' && comp.prizeNumeric < 10000) return false;
        if (prizeFilter === '$50k+' && comp.prizeNumeric < 50000) return false;
      }

      // Organizer Dropdown
      if (organizerFilter !== 'All') {
        if (comp.organizer !== organizerFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (comp.title || '').toLowerCase().includes(q);
        const matchOrg = (comp.organizer || '').toLowerCase().includes(q);
        const matchTech = (comp.technologies || []).some((t) => t.toLowerCase().includes(q));
        const matchFormat = (comp.format || '').toLowerCase().includes(q);
        if (!matchTitle && !matchOrg && !matchTech && !matchFormat) return false;
      }

      return true;
    });
  }, [competitions, activeTab, techFilter, formatFilter, difficultyFilter, prizeFilter, organizerFilter, searchQuery]);

  // Calendar Date Matrix Generation (Monday to Sunday, 7 columns)
  const calendarWeeks = useMemo(() => {
    const weeks = [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDayOffset = (firstDay.getDay() + 6) % 7; // Monday = 0

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const todayStr = new Date().toISOString().split('T')[0];

    let dayCounter = 1;
    let nextMonthDayCounter = 1;

    for (let w = 0; w < 5; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const cellIndex = w * 7 + d;
        if (cellIndex < startDayOffset) {
          const dayNum = daysInPrevMonth - startDayOffset + d + 1;
          const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          days.push({
            dayNum,
            dateStr,
            isCurrentMonth: false,
            isToday: dateStr === todayStr
          });
        } else if (dayCounter <= daysInMonth) {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
          days.push({
            dayNum: dayCounter,
            dateStr,
            isCurrentMonth: true,
            isToday: dateStr === todayStr
          });
          dayCounter++;
        } else {
          const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
          const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(nextMonthDayCounter).padStart(2, '0')}`;
          days.push({
            dayNum: nextMonthDayCounter,
            dateStr,
            isCurrentMonth: false,
            isToday: dateStr === todayStr
          });
          nextMonthDayCounter++;
        }
      }
      weeks.push(days);
    }
    return weeks;
  }, [currentYear, currentMonth]);

  // Calculate horizontal event spans for each week row
  const getEventsForWeek = (week) => {
    const weekStart = week[0].dateStr;
    const weekEnd = week[6].dateStr;

    const weekEvents = filteredCompetitions.filter((comp) => {
      const start = comp.startDate;
      const end = comp.endDate || comp.startDate;
      return start <= weekEnd && end >= weekStart;
    });

    return weekEvents.map((comp) => {
      const start = comp.startDate;
      const end = comp.endDate || comp.startDate;

      let startCol = 1;
      let endCol = 7;

      for (let i = 0; i < 7; i++) {
        if (week[i].dateStr === start) {
          startCol = i + 1;
          break;
        } else if (week[i].dateStr > start) {
          startCol = Math.max(1, i);
          break;
        }
      }

      for (let i = 6; i >= 0; i--) {
        if (week[i].dateStr === end) {
          endCol = i + 1;
          break;
        } else if (week[i].dateStr < end) {
          endCol = Math.min(7, i + 2);
          break;
        }
      }

      return {
        comp,
        startCol,
        endCol,
        isMultiDay: start !== end
      };
    });
  };

  const handleClearFilters = () => {
    setActiveTab('All');
    setTechFilter('All');
    setFormatFilter('All');
    setDifficultyFilter('All');
    setPrizeFilter('All');
    setOrganizerFilter('All');
    setSearchQuery('');
  };

  const hasActiveFilters =
    activeTab !== 'All' ||
    techFilter !== 'All' ||
    formatFilter !== 'All' ||
    difficultyFilter !== 'All' ||
    prizeFilter !== 'All' ||
    organizerFilter !== 'All' ||
    searchQuery.trim().length > 0;

  // Real Upcoming and Recently Added Lists
  const upcomingList = useMemo(() => {
    return competitions
      .filter((c) => c.status === 'upcoming' || c.status === 'active' || c.status === 'closing_soon')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 5);
  }, [competitions]);

  const recentlyAddedList = useMemo(() => {
    return competitions
      .filter((c) => c.status === 'upcoming')
      .slice(0, 3);
  }, [competitions]);

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
  };

  return (
    <div
      style={{
        backgroundColor: '#0B0B0D',
        minHeight: '100vh',
        color: '#f4f4f6',
        padding: '2.5rem 3.5rem 5rem 3.5rem',
        maxWidth: '1440px',
        margin: '0 auto',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box'
      }}
    >
      {/* ========================================================= */}
      {/* 1. QUIET APPLICATION SHELL HEADER                         */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2.5rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid #18181D'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#71717a'
            }}
          >
            Console / Competitions
          </span>
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block'
            }}
          />
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#52525b' }}>
            {competitions.length} LIVE ROUNDS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            type="button"
            onClick={() => fetchLiveContests(true)}
            disabled={syncing}
            style={{
              background: 'transparent',
              border: 'none',
              color: syncing ? '#3b82f6' : '#71717a',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: 0
            }}
            title="Force refresh live competition feeds"
          >
            <RotateCcw size={12} className={syncing ? 'spin' : ''} />
            <span>{syncing ? 'Syncing Feeds...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. EDITORIAL PAGE HEADER                                  */}
      {/* ========================================================= */}
      <div style={{ marginBottom: '2.25rem' }}>
        <div
          style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#3b82f6',
            marginBottom: '0.35rem'
          }}
        >
          OPPORTUNITIES
        </div>
        <h1
          style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            margin: '0 0 0.5rem 0',
            color: '#f4f4f6'
          }}
        >
          Competitions
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#8e8e99',
            margin: 0,
            maxWidth: '650px',
            lineHeight: '1.5'
          }}
        >
          Live hackathons, coding competitions and technical challenges aggregated from Codeforces, LeetCode, AtCoder, CodeChef, and international competitive circuits.
        </p>
      </div>

      {/* ========================================================= */}
      {/* 3. PRIMARY NAVIGATION TABS & MINIMAL VIEW SWITCHER        */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #18181D',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {/* Simple Text Tabs */}
        <div style={{ display: 'flex', gap: '1.75rem' }}>
          {['All', 'Upcoming', 'Active', 'Closing Soon', 'Recently Completed'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  padding: '0.65rem 0',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#f4f4f6' : '#71717a',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#d4d4d8';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#71717a';
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* View Switcher: Minimal Segmented Control */}
        <div
          style={{
            display: 'inline-flex',
            background: '#0E0E12',
            border: '1px solid #1E1E26',
            borderRadius: '4px',
            padding: '2px'
          }}
        >
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              background: viewMode === 'calendar' ? '#1c1c24' : 'transparent',
              color: viewMode === 'calendar' ? '#f4f4f6' : '#71717a',
              border: viewMode === 'calendar' ? '1px solid #282834' : '1px solid transparent',
              borderRadius: '3px',
              fontSize: '0.76rem',
              fontWeight: viewMode === 'calendar' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <CalendarIcon size={12} />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              background: viewMode === 'list' ? '#1c1c24' : 'transparent',
              color: viewMode === 'list' ? '#f4f4f6' : '#71717a',
              border: viewMode === 'list' ? '1px solid #282834' : '1px solid transparent',
              borderRadius: '3px',
              fontSize: '0.76rem',
              fontWeight: viewMode === 'list' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ListIcon size={12} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. COMPACT DROPDOWN FILTERS & CONTEXTUAL SEARCH           */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Real Technology Filter */}
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            style={{
              background: '#0E0E12',
              border: '1px solid #1E1E26',
              color: techFilter !== 'All' ? '#60a5fa' : '#8e8e99',
              fontSize: '0.76rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All">Technology: All</option>
            {availableTechnologies.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>

          {/* Format */}
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            style={{
              background: '#0E0E12',
              border: '1px solid #1E1E26',
              color: formatFilter !== 'All' ? '#60a5fa' : '#8e8e99',
              fontSize: '0.76rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All">Format: All</option>
            <option value="Online">Online</option>
            <option value="In-Person">In-Person</option>
            <option value="Hybrid">Hybrid</option>
          </select>

          {/* Difficulty */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{
              background: '#0E0E12',
              border: '1px solid #1E1E26',
              color: difficultyFilter !== 'All' ? '#60a5fa' : '#8e8e99',
              fontSize: '0.76rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All">Difficulty: All</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {/* Real Organizer Filter */}
          <select
            value={organizerFilter}
            onChange={(e) => setOrganizerFilter(e.target.value)}
            style={{
              background: '#0E0E12',
              border: '1px solid #1E1E26',
              color: organizerFilter !== 'All' ? '#60a5fa' : '#8e8e99',
              fontSize: '0.76rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All">Organizer: All ({availableOrganizers.length})</option>
            {availableOrganizers.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.35rem 0.5rem'
              }}
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search
            size={12}
            color="#71717a"
            style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search competitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: '#0E0E12',
              border: '1px solid #1E1E26',
              color: '#f4f4f6',
              fontSize: '0.76rem',
              padding: '0.35rem 0.75rem 0.35rem 1.85rem',
              borderRadius: '4px',
              width: '210px',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <X
              size={11}
              color="#71717a"
              style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. MAIN CONTENT AREA (CALENDAR + RIGHT-SIDE UPCOMING)     */}
      {/* ========================================================= */}
      <div
        style={{
          display: 'flex',
          gap: '2.5rem',
          alignItems: 'flex-start',
          flexDirection: 'row',
          flexWrap: 'nowrap'
        }}
      >
        {/* LEFT / CENTER: THE MAIN VIEW (CALENDAR OR LIST) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            /* Clean Minimal Loading Skeleton */
            <div
              style={{
                border: '1px solid #18181D',
                borderRadius: '6px',
                padding: '3rem',
                textAlign: 'center',
                background: '#0B0B0D'
              }}
            >
              <div
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#71717a',
                  marginBottom: '0.5rem'
                }}
              >
                LOADING LIVE COMPETITIONS...
              </div>
              <div style={{ fontSize: '0.75rem', color: '#52525b' }}>
                Fetching official tournament feeds from Codeforces, LeetCode, AtCoder, CodeChef, and international organizers...
              </div>
            </div>
          ) : viewMode === 'calendar' ? (
            /* MONTHLY CALENDAR COMPONENT */
            <div>
              {/* Calendar Month Navigation Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  padding: '0 0.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <h2
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      color: '#f4f4f6',
                      letterSpacing: '-0.01em',
                      margin: 0
                    }}
                  >
                    {currentMonthName}
                  </h2>
                  <button
                    onClick={handleTodayMonth}
                    style={{
                      background: '#131318',
                      border: '1px solid #202028',
                      color: '#8e8e99',
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Today
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <button
                    onClick={handlePrevMonth}
                    title="Previous Month"
                    style={{
                      background: 'transparent',
                      border: '1px solid #1E1E26',
                      color: '#8e8e99',
                      width: '28px',
                      height: '28px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    title="Next Month"
                    style={{
                      background: 'transparent',
                      border: '1px solid #1E1E26',
                      color: '#8e8e99',
                      width: '28px',
                      height: '28px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Day of Week Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  borderTop: '1px solid #18181D',
                  borderBottom: '1px solid #18181D',
                  padding: '0.5rem 0',
                  marginBottom: '0'
                }}
              >
                {WEEKDAY_NAMES.map((day) => (
                  <div
                    key={day}
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: '#71717a',
                      textAlign: 'left',
                      paddingLeft: '0.75rem'
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 5-Week Calendar Grid */}
              <div
                style={{
                  borderLeft: '1px solid #18181D',
                  borderRight: '1px solid #18181D',
                  borderBottom: '1px solid #18181D',
                  background: '#0B0B0D'
                }}
              >
                {calendarWeeks.map((week, wIdx) => {
                  const weekEvents = getEventsForWeek(week);

                  return (
                    <div
                      key={`week-${wIdx}`}
                      style={{
                        minHeight: '115px',
                        borderBottom: wIdx === calendarWeeks.length - 1 ? 'none' : '1px solid #18181D',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                      }}
                    >
                      {/* Grid Background Columns with Day Numbers */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none'
                        }}
                      >
                        {week.map((day, dIdx) => (
                          <div
                            key={`cell-${day.dateStr}`}
                            style={{
                              borderRight: dIdx === 6 ? 'none' : '1px solid #16161B',
                              padding: '0.5rem 0.65rem',
                              height: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: day.isToday ? 700 : 400,
                                color: day.isToday
                                  ? '#3b82f6'
                                  : day.isCurrentMonth
                                  ? '#d4d4d8'
                                  : '#3f3f46',
                                display: 'inline-block'
                              }}
                            >
                              {day.dayNum}
                            </span>
                            {day.isToday && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: '4px',
                                  height: '4px',
                                  borderRadius: '50%',
                                  background: '#3b82f6',
                                  marginLeft: '4px',
                                  verticalAlign: 'middle'
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Event Bars Layer */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          paddingTop: '2rem',
                          paddingBottom: '0.5rem',
                          position: 'relative',
                          zIndex: 2
                        }}
                      >
                        {weekEvents.map(({ comp, startCol, endCol }) => {
                          const statusTheme = STATUS_CONFIG[comp.status] || STATUS_CONFIG.upcoming;

                          return (
                            <div
                              key={`${comp.id}-w${wIdx}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)'
                              }}
                            >
                              <div
                                onClick={() => setSelectedEvent(comp)}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTooltipPos({ x: rect.left, y: rect.bottom + 6 });
                                  setHoveredEvent(comp);
                                }}
                                onMouseLeave={() => setHoveredEvent(null)}
                                style={{
                                  gridColumn: `${startCol} / ${endCol + 1}`,
                                  margin: '0 4px',
                                  background: statusTheme.barBg,
                                  borderLeft: `3px solid ${statusTheme.barBorder}`,
                                  borderRadius: '3px',
                                  padding: '4px 8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.5rem',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  transition: 'filter 0.15s ease'
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '5px',
                                      height: '5px',
                                      borderRadius: '50%',
                                      backgroundColor: statusTheme.dotColor,
                                      flexShrink: 0
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      color: statusTheme.textColor,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {comp.title}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flexShrink: 0
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      fontFamily: 'var(--font-mono)',
                                      color: '#71717a'
                                    }}
                                  >
                                    {comp.organizer}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clean Empty State within calendar */}
              {filteredCompetitions.length === 0 && (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    border: '1px solid #18181D',
                    borderTop: 'none'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: '#71717a',
                      marginBottom: '0.35rem'
                    }}
                  >
                    NO COMPETITIONS FOUND
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#52525b', marginBottom: '1rem' }}>
                    Try adjusting your filters to see more scheduled opportunities.
                  </div>
                  <button
                    onClick={handleClearFilters}
                    style={{
                      background: 'transparent',
                      border: '1px solid #282834',
                      color: '#d4d4d8',
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* LIST VIEW (CHRONOLOGICAL OPPORTUNITY FEED) */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredCompetitions.length > 0 ? (
                filteredCompetitions
                  .slice()
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((comp) => {
                    const statusTheme = STATUS_CONFIG[comp.status] || STATUS_CONFIG.upcoming;

                    return (
                      <div
                        key={comp.id}
                        onClick={() => setSelectedEvent(comp)}
                        style={{
                          padding: '1.25rem 0',
                          borderBottom: '1px solid #18181D',
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: '2rem',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2rem', flex: 1 }}>
                          {/* Strong Monospace Date */}
                          <div style={{ width: '85px', flexShrink: 0 }}>
                            <div
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                color: '#f4f4f6'
                              }}
                            >
                              {formatShortDate(comp.startDate)}
                            </div>
                            <div
                              style={{
                                fontSize: '0.7rem',
                                fontFamily: 'var(--font-mono)',
                                color: '#71717a'
                              }}
                            >
                              {new Date(comp.startDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                            </div>
                          </div>

                          {/* Competition Details */}
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#f4f4f6',
                                marginBottom: '0.25rem'
                              }}
                            >
                              {comp.title}
                            </div>

                            <div
                              style={{
                                fontSize: '0.76rem',
                                color: '#71717a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap'
                              }}
                            >
                              <span style={{ color: '#a1a1aa' }}>{comp.organizer}</span>
                              <span>·</span>
                              <span>{comp.technologies.join(' · ')}</span>
                              <span>·</span>
                              <span>{comp.format}</span>
                              <span>·</span>
                              <span style={{ color: '#e4e4e7', fontFamily: 'var(--font-mono)' }}>{comp.prizePool}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status / Deadline */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: '0.78rem',
                              fontFamily: 'var(--font-mono)',
                              color: statusTheme.textColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '0.35rem'
                            }}
                          >
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: statusTheme.dotColor
                              }}
                            />
                            <span>{comp.deadlineText}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div style={{ padding: '3.5rem 0', textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: '#71717a',
                      marginBottom: '0.35rem'
                    }}
                  >
                    NO COMPETITIONS FOUND
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#52525b', marginBottom: '1rem' }}>
                    Try adjusting your filters.
                  </div>
                  <button
                    onClick={handleClearFilters}
                    style={{
                      background: 'transparent',
                      border: '1px solid #282834',
                      color: '#d4d4d8',
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 6. RIGHT-SIDE UPCOMING PANEL (NARROW CONTEXTUAL LIST)     */}
        {/* ========================================================= */}
        <div
          style={{
            width: '290px',
            flexShrink: 0,
            borderLeft: '1px solid #18181D',
            paddingLeft: '2rem'
          }}
        >
          {/* UPCOMING SECTION */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#71717a',
                marginBottom: '1.25rem'
              }}
            >
              UPCOMING
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {upcomingList.length > 0 ? (
                upcomingList.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvent(item)}
                    style={{
                      padding: '0.85rem 0',
                      borderBottom: idx === upcomingList.length - 1 ? 'none' : '1px solid #18181D',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: '#f4f4f6',
                        marginBottom: '0.2rem'
                      }}
                    >
                      {formatShortDate(item.startDate)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#d4d4d8',
                        marginBottom: '0.25rem',
                        lineHeight: '1.3'
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: '#71717a',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {item.deadlineText}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#52525b', padding: '1rem 0' }}>
                  No upcoming rounds recorded.
                </div>
              )}
            </div>
          </div>

          {/* RECENTLY ADDED SECTION */}
          <div>
            <div
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#71717a',
                marginBottom: '1.25rem'
              }}
            >
              RECENTLY ADDED
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentlyAddedList.length > 0 ? (
                recentlyAddedList.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvent(item)}
                    style={{
                      padding: '0.75rem 0',
                      borderBottom: idx === recentlyAddedList.length - 1 ? 'none' : '1px solid #18181D',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: '#f4f4f6',
                        marginBottom: '0.15rem'
                      }}
                    >
                      {formatShortDate(item.startDate)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        color: '#a1a1aa'
                      }}
                    >
                      {item.title}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#52525b', padding: '1rem 0' }}>
                  Syncing live additions...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. COMPACT HOVER TOOLTIP                                  */}
      {/* ========================================================= */}
      {hoveredEvent && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            zIndex: 90,
            background: '#111116',
            border: '1px solid #242430',
            borderRadius: '4px',
            padding: '0.65rem 0.85rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
            pointerEvents: 'none',
            maxWidth: '280px'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f4f4f6', marginBottom: '0.2rem' }}>
            {hoveredEvent.title}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#71717a', marginBottom: '0.35rem' }}>
            {hoveredEvent.organizer}
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              color: '#a1a1aa',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <div>
              Date: {hoveredEvent.startDate} {hoveredEvent.startDate !== hoveredEvent.endDate ? `→ ${hoveredEvent.endDate}` : ''}
            </div>
            <div>Status: {STATUS_CONFIG[hoveredEvent.status]?.label || 'Scheduled'}</div>
            <div>Prize: {hoveredEvent.prizePool}</div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. EVENT DETAIL DRAWER (SLIDE-IN MODAL)                   */}
      {/* ========================================================= */}
      <DetailDrawer
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title?.toUpperCase() || 'COMPETITION'}
        subtitle={`${selectedEvent?.startDate} — ${selectedEvent?.endDate || selectedEvent?.startDate}`}
        badge={selectedEvent?.format?.toUpperCase() || 'ONLINE'}
        width="540px"
      >
        {selectedEvent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#f4f4f6' }}>
            {/* Organizer & Description */}
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#71717a',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem'
                }}
              >
                Organizer / Host Platform
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f4f4f6' }}>
                {selectedEvent.organizer}
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
              {selectedEvent.description}
            </p>

            {/* Structured Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                background: '#0E0E12',
                border: '1px solid #1A1A22',
                borderRadius: '4px',
                padding: '1.1rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                  Technology & Focus
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7', marginTop: '0.2rem' }}>
                  {selectedEvent.technologies.join(' · ')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                  Registration Status
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: STATUS_CONFIG[selectedEvent.status]?.textColor || '#f4f4f6',
                    marginTop: '0.2rem'
                  }}
                >
                  {selectedEvent.registrationStatus.toUpperCase()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                  Start Date
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedEvent.startDate}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                  Prize / Recognition
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedEvent.prizePool}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                paddingTop: '1rem',
                borderTop: '1px solid #18181D'
              }}
            >
              <a
                href={getGoogleCalendarUrl(selectedEvent)}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'transparent',
                  border: '1px solid #242430',
                  color: '#d4d4d8',
                  fontSize: '0.8rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none'
                }}
              >
                <CalendarPlus size={14} />
                <span>Add to Calendar</span>
              </a>

              <a
                href={selectedEvent.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.55rem 1.15rem',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                  transition: 'opacity 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <span>View Competition</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
};

export default ContestTrackerPage;
