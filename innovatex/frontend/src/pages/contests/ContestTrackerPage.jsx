import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Tag,
  CheckCircle2,
  AlertCircle,
  Bell,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import DetailDrawer from '../../components/common/DetailDrawer';

// =========================================================================
// COMPETITIONS DATA CATALOG (Curated premier hackathons & technical rounds)
// =========================================================================
const CURATED_COMPETITIONS = [
  {
    id: 'hack-with-ai-2026',
    title: 'HackWithAI',
    organizer: 'Google Cloud & Anthropic',
    format: 'Online',
    location: 'Global · Virtual',
    technologies: ['AI / ML', 'GenAI', 'Cloud'],
    difficulty: 'Intermediate',
    prizePool: '$40,000',
    prizeNumeric: 40000,
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    deadline: '2026-10-03',
    deadlineText: 'Submissions close today at 23:59 UTC',
    status: 'closing_soon',
    registrationStatus: 'Closing Soon',
    description: 'Build cutting-edge multi-agent applications and frontier LLM workflows using Claude 3.5 Sonnet and Google Vertex AI. Open to solo developers and teams of up to 4.',
    url: 'https://cloud.google.com/hackathons',
    recentlyAdded: false
  },
  {
    id: 'aws-builder-challenge-2026',
    title: 'AWS Builder Challenge',
    organizer: 'Amazon Web Services',
    format: 'Online',
    location: 'Global · Virtual',
    technologies: ['Cloud', 'AWS', 'Web'],
    difficulty: 'Intermediate',
    prizePool: '$50,000',
    prizeNumeric: 50000,
    startDate: '2026-10-07',
    endDate: '2026-10-09',
    deadline: '2026-10-08',
    deadlineText: 'Registration closes in 3 days',
    status: 'upcoming',
    registrationStatus: 'Open',
    description: 'Build innovative serverless architectures and distributed systems using AWS Bedrock, Lambda, and DynamoDB. Mentorship and $500 in AWS credits included.',
    url: 'https://aws.amazon.com/events/builder-challenge/',
    recentlyAdded: false
  },
  {
    id: 'codeforces-round-998',
    title: 'Codeforces Round 998 (Div. 2)',
    organizer: 'Codeforces',
    format: 'Online',
    location: 'Global · Virtual',
    technologies: ['Algorithms', 'Systems & C++', 'Data Structures'],
    difficulty: 'Intermediate',
    prizePool: 'Rating & T-Shirts',
    prizeNumeric: 5000,
    startDate: '2026-10-10',
    endDate: '2026-10-10',
    deadline: '2026-10-10',
    deadlineText: 'Starts in 7 days · 2 hours duration',
    status: 'upcoming',
    registrationStatus: 'Open',
    description: 'Rated competitive programming contest for Division 2 participants (rating < 2100). 6 algorithmic problems covering dynamic programming, graph theory, and combinatorics.',
    url: 'https://codeforces.com/contests',
    recentlyAdded: false
  },
  {
    id: 'google-genai-hackathon-2026',
    title: 'Google GenAI Hackathon',
    organizer: 'Google',
    format: 'Online',
    location: 'Global · Virtual',
    technologies: ['AI / ML', 'GenAI', 'Web'],
    difficulty: 'Advanced',
    prizePool: '$75,000',
    prizeNumeric: 75000,
    startDate: '2026-10-14',
    endDate: '2026-10-16',
    deadline: '2026-10-14',
    deadlineText: 'Registration opens in 6 days',
    status: 'upcoming',
    registrationStatus: 'Upcoming',
    description: 'Develop production-grade generative agents using Gemini 1.5 Pro, Project Astra APIs, and Google Cloud Run. Key tracks include Developer Tooling, Education, and Healthcare.',
    url: 'https://developers.google.com/events',
    recentlyAdded: false
  },
  {
    id: 'leetcode-weekly-419',
    title: 'LeetCode Weekly Contest 419',
    organizer: 'LeetCode',
    format: 'Online',
    location: 'Global · Virtual',
    technologies: ['Algorithms', 'Web', 'Python'],
    difficulty: 'Beginner',
    prizePool: 'LeetCode Coins & Badges',
    prizeNumeric: 2000,
    startDate: '2026-10-18',
    endDate: '2026-10-18',
    deadline: '2026-10-18',
    deadlineText: 'Starts at 02:30 UTC · 90m duration',
    status: 'upcoming',
    registrationStatus: 'Open',
    description: 'Standard 4-problem weekly algorithm contest ranging from easy array manipulations to hard graph and segment tree algorithms.',
    url: 'https://leetcode.com/contest/',
    recentlyAdded: false
  },
  {
    id: 'devfolio-winter-hackathon-2026',
    title: 'Devfolio Winter Hackathon',
    organizer: 'Devfolio',
    format: 'Hybrid',
    location: 'Bengaluru & Virtual',
    technologies: ['Fullstack / Web', 'Web3', 'AI / ML'],
    difficulty: 'Intermediate',
    prizePool: '$30,000',
    prizeNumeric: 30000,
    startDate: '2026-10-20',
    endDate: '2026-10-23',
    deadline: '2026-10-19',
    deadlineText: 'Starts in 12 days',
    status: 'upcoming',
    registrationStatus: 'Open',
    description: '36-hour sprint for building decentralized apps, AI developer tools, and fintech prototypes. Judged by leading founders and senior engineering leaders.',
    url: 'https://devfolio.co/hackathons',
    recentlyAdded: false
  },
  {
    id: 'atcoder-grand-contest-070',
    title: 'AtCoder Grand Contest 070',
    organizer: 'AtCoder',
    format: 'Online',
    location: 'Tokyo · Global Online',
    technologies: ['Algorithms', 'Systems & C++', 'Math'],
    difficulty: 'Advanced',
    prizePool: '$10,000',
    prizeNumeric: 10000,
    startDate: '2026-10-24',
    endDate: '2026-10-24',
    deadline: '2026-10-24',
    deadlineText: 'Starts at 12:00 UTC · 3h duration',
    status: 'upcoming',
    registrationStatus: 'Open',
    description: 'Premier world-class algorithmic contest featuring elegant mathematical puzzles and extreme combinatorial challenges. High rating impact.',
    url: 'https://atcoder.jp/contests/',
    recentlyAdded: false
  },
  {
    id: 'mlh-global-hack-week-2026',
    title: 'MLH Global Hack Week',
    organizer: 'Major League Hacking',
    format: 'Online',
    location: 'Global · Virtual',
    technologies: ['Open Source', 'Fullstack / Web', 'AI / ML'],
    difficulty: 'Beginner',
    prizePool: 'Grants & Swag',
    prizeNumeric: 15000,
    startDate: '2026-10-28',
    endDate: '2026-11-01',
    deadline: '2026-10-27',
    deadlineText: 'Registration opens in 20 days',
    status: 'upcoming',
    registrationStatus: 'Upcoming',
    description: 'A week-long celebration of learning, building, and sharing technical projects with workshops, mini-events, and collaborative hacking sessions.',
    url: 'https://ghw.mlh.io/',
    recentlyAdded: false
  },
  {
    id: 'flipkart-grid-6',
    title: 'Flipkart GRID 6.0',
    organizer: 'Flipkart',
    format: 'Hybrid',
    location: 'Bengaluru, India',
    technologies: ['Robotics', 'AI / ML', 'Fullstack / Web'],
    difficulty: 'Advanced',
    prizePool: '$25,000',
    prizeNumeric: 25000,
    startDate: '2026-11-05',
    endDate: '2026-11-07',
    deadline: '2026-11-04',
    deadlineText: 'Registration closing in November',
    status: 'upcoming',
    registrationStatus: 'Open',
    description: 'Flagship engineering campus challenge featuring tracks in Autonomous Robotics, Smart Bagging, and High-Scale E-Commerce Microservices.',
    url: 'https://unstop.com/hackathons/flipkart-grid-60',
    recentlyAdded: true
  },
  {
    id: 'hackerearth-november-circuits',
    title: 'HackerEarth November Circuits',
    organizer: 'HackerEarth',
    format: 'Online',
    location: 'Global · Virtual',
    technologies: ['Algorithms', 'Data Structures', 'Systems & C++'],
    difficulty: 'Intermediate',
    prizePool: '$15,000',
    prizeNumeric: 15000,
    startDate: '2026-11-12',
    endDate: '2026-11-15',
    deadline: '2026-11-11',
    deadlineText: 'Registration opening soon',
    status: 'upcoming',
    registrationStatus: 'Open',
    description: 'Multi-day marathon programming tournament with 8 progressively difficult problems designed by international competitive programmers.',
    url: 'https://www.hackerearth.com/challenges/',
    recentlyAdded: true
  },
  {
    id: 'ethglobal-hackathon-2026',
    title: 'ETHGlobal Hackathon',
    organizer: 'ETHGlobal',
    format: 'In-Person',
    location: 'San Francisco, CA',
    technologies: ['Web3', 'Fullstack / Web', 'Security'],
    difficulty: 'Advanced',
    prizePool: '$100,000',
    prizeNumeric: 100000,
    startDate: '2026-09-24',
    endDate: '2026-09-27',
    deadline: '2026-09-24',
    deadlineText: 'Ended on Sep 27',
    status: 'completed',
    registrationStatus: 'Closed',
    description: 'World leading Ethereum ecosystem hackathon bringing together 1,000+ builders, protocol researchers, and leading crypto venture funds.',
    url: 'https://ethglobal.com',
    recentlyAdded: false
  }
];

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
  // Navigation & View
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Upcoming' | 'Active' | 'Closing Soon' | 'Recently Completed'
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'

  // Monthly Calendar Navigation (Oct 2026 as standard anchor)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October

  // Filter Dropdowns
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

  // Loading & External API Data Integration
  const [loading, setLoading] = useState(false);
  const [competitions, setCompetitions] = useState(CURATED_COMPETITIONS);

  // Fetch real-time live contests from backend and merge cleanly
  useEffect(() => {
    let isMounted = true;
    const loadLiveContests = async () => {
      try {
        const res = await api.get('/contests?days=30');
        if (res.data && Array.isArray(res.data) && isMounted) {
          // Normalize and merge live contests without duplicating
          const normalized = res.data.map((c) => {
            const start = c.start_time ? c.start_time.split('T')[0] : '2026-10-10';
            const end = c.end_time ? c.end_time.split('T')[0] : start;
            const diff = c.difficulty || 'Intermediate';
            return {
              id: `live-${c.contest_id || c.title}`,
              title: c.title,
              organizer: c.platform || 'Competitive Programming',
              format: 'Online',
              location: 'Global · Virtual',
              technologies: ['Algorithms', 'Problem Solving'],
              difficulty: diff.charAt(0).toUpperCase() + diff.slice(1),
              prizePool: 'Rating & Global Ranking',
              prizeNumeric: 3000,
              startDate: start,
              endDate: end,
              deadline: end,
              deadlineText: `Duration: ${Math.round((c.duration_seconds || 7200) / 3600)} hours`,
              status: new Date(c.start_time) < new Date('2026-10-03T12:00:00') ? 'active' : 'upcoming',
              registrationStatus: 'Open',
              description: `Live official competition on ${c.platform}. Test your algorithmic reasoning and real-time execution.`,
              url: c.url,
              recentlyAdded: false
            };
          });

          // Deduplicate based on title similarity
          setCompetitions((prev) => {
            const existingTitles = new Set(prev.map((p) => p.title.toLowerCase()));
            const fresh = normalized.filter((n) => !existingTitles.has(n.title.toLowerCase()));
            return [...prev, ...fresh];
          });
        }
      } catch (err) {
        // Graceful fallback to curated dataset
        console.warn('Live contest feed sync fallback:', err);
      }
    };

    loadLiveContests();
    return () => {
      isMounted = false;
    };
  }, []);

  // Google Calendar URL generator
  const getGoogleCalendarUrl = (comp) => {
    if (!comp) return '#';
    const sDate = comp.startDate.replace(/-/g, '');
    const eDate = (comp.endDate || comp.startDate).replace(/-/g, '');
    const title = encodeURIComponent(comp.title);
    const details = encodeURIComponent(
      `${comp.description}\n\nOrganizer: ${comp.organizer}\nPrize Pool: ${comp.prizePool}\nLink: ${comp.url}`
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
    setCurrentYear(2026);
    setCurrentMonth(9); // October
  };

  const currentMonthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

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
        const hasTech = comp.technologies.some((t) => t.toLowerCase().includes(techFilter.toLowerCase()));
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
        if (prizeFilter === '$25k+' && comp.prizeNumeric < 25000) return false;
        if (prizeFilter === '$50k+' && comp.prizeNumeric < 50000) return false;
        if (prizeFilter === '$100k+' && comp.prizeNumeric < 100000) return false;
      }

      // Organizer Dropdown
      if (organizerFilter !== 'All') {
        if (!comp.organizer.toLowerCase().includes(organizerFilter.toLowerCase())) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = comp.title.toLowerCase().includes(q);
        const matchOrg = comp.organizer.toLowerCase().includes(q);
        const matchTech = comp.technologies.some((t) => t.toLowerCase().includes(q));
        const matchFormat = comp.format.toLowerCase().includes(q);
        if (!matchTitle && !matchOrg && !matchTech && !matchFormat) return false;
      }

      return true;
    });
  }, [competitions, activeTab, techFilter, formatFilter, difficultyFilter, prizeFilter, organizerFilter, searchQuery]);

  // Calendar Date Matrix Generation (Monday to Sunday, 7 columns)
  const calendarWeeks = useMemo(() => {
    const weeks = [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    // JS getDay(): 0 is Sun, 1 is Mon... convert to Mon = 0
    const startDayOffset = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    let dayCounter = 1;
    let nextMonthDayCounter = 1;

    // We build 5 or 6 weeks as required
    for (let w = 0; w < 5; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const cellIndex = w * 7 + d;
        if (cellIndex < startDayOffset) {
          // Preceding month days
          const dayNum = daysInPrevMonth - startDayOffset + d + 1;
          const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          days.push({
            dayNum,
            dateStr,
            isCurrentMonth: false,
            isToday: dateStr === '2026-10-03'
          });
        } else if (dayCounter <= daysInMonth) {
          // Current month days
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
          days.push({
            dayNum: dayCounter,
            dateStr,
            isCurrentMonth: true,
            isToday: dateStr === '2026-10-03'
          });
          dayCounter++;
        } else {
          // Following month days
          const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
          const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(nextMonthDayCounter).padStart(2, '0')}`;
          days.push({
            dayNum: nextMonthDayCounter,
            dateStr,
            isCurrentMonth: false,
            isToday: dateStr === '2026-10-03'
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

    // Filter events that intersect with this week
    const weekEvents = filteredCompetitions.filter((comp) => {
      const start = comp.startDate;
      const end = comp.endDate || comp.startDate;
      return start <= weekEnd && end >= weekStart;
    });

    return weekEvents.map((comp) => {
      const start = comp.startDate;
      const end = comp.endDate || comp.startDate;

      // Find start column (1-7)
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

  // Reset all filters helper
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

  // Upcoming Panel Events (Filtered to future / active upcoming events)
  const upcomingList = useMemo(() => {
    return competitions
      .filter((c) => c.status === 'upcoming' || c.status === 'active' || c.status === 'closing_soon')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 4);
  }, [competitions]);

  const recentlyAddedList = useMemo(() => {
    return competitions.filter((c) => c.recentlyAdded).slice(0, 2);
  }, [competitions]);

  // Format date helper for list/panel
  const formatShortDate = (dateStr) => {
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
              backgroundColor: '#3b82f6',
              display: 'inline-block'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              color: '#52525b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Clock size={12} color="#52525b" />
            <span>UTC 2026-10-03 · 12:00</span>
          </span>
          <span style={{ width: '1px', height: '14px', background: '#202028' }} />
          <button
            type="button"
            onClick={handleClearFilters}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              fontSize: '0.74rem',
              cursor: 'pointer',
              padding: 0
            }}
            title="Reset Filters"
          >
            Sync
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
          Discover hackathons, coding competitions and technical challenges that match your interests.
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
          {/* Technology */}
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
            <option value="AI / ML">AI / ML</option>
            <option value="Cloud">Cloud</option>
            <option value="Fullstack / Web">Web / Fullstack</option>
            <option value="Algorithms">Algorithms</option>
            <option value="Web3">Web3</option>
            <option value="Systems & C++">Systems & C++</option>
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

          {/* Prize Pool */}
          <select
            value={prizeFilter}
            onChange={(e) => setPrizeFilter(e.target.value)}
            style={{
              background: '#0E0E12',
              border: '1px solid #1E1E26',
              color: prizeFilter !== 'All' ? '#60a5fa' : '#8e8e99',
              fontSize: '0.76rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All">Prize: All</option>
            <option value="Any Prize">Any Prize</option>
            <option value="$25k+">$25,000+</option>
            <option value="$50k+">$50,000+</option>
            <option value="$100k+">$100,000+</option>
          </select>

          {/* Organizer */}
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
            <option value="All">Organizer: All</option>
            <option value="Amazon Web Services">Amazon Web Services</option>
            <option value="Google">Google</option>
            <option value="Devfolio">Devfolio</option>
            <option value="Major League Hacking">Major League Hacking</option>
            <option value="Codeforces">Codeforces</option>
            <option value="LeetCode">LeetCode</option>
            <option value="AtCoder">AtCoder</option>
            <option value="Flipkart">Flipkart</option>
            <option value="HackerEarth">HackerEarth</option>
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
          {viewMode === 'calendar' ? (
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
                                    {comp.startDate.substring(5).replace('-', '/')}
                                    {comp.startDate !== comp.endDate && ` → ${comp.endDate.substring(5).replace('-', '/')}`}
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
              {upcomingList.map((item, idx) => (
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
              ))}
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
              {recentlyAddedList.map((item, idx) => (
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
              ))}
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
            maxWidth: '260px'
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
              Date: {hoveredEvent.startDate} → {hoveredEvent.endDate || hoveredEvent.startDate}
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
                Organizer
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
                  Technology
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7', marginTop: '0.2rem' }}>
                  {selectedEvent.technologies.join(' · ')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                  Registration
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
                  Deadline
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e4e4e7', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedEvent.deadline}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                  Prize Pool
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
