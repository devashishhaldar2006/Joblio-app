import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Upload,
  Briefcase,
  MapPin,
  DollarSign,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  Trash2,
  SlidersHorizontal,
  Edit3,
  Printer,
  FileText,
  X,
  ArrowUpRight,
  Search,
  Check,
  Clock,
  Columns,
  List,
  Sparkles,
  Filter
} from 'lucide-react';
import { exportJobMatchPdf } from '../../utils/exportUtils';
import EmptyState from '../../components/common/EmptyState';

const STAGE_CONFIG = {
  Saved: { label: 'Saved', color: '#93c5fd', bg: 'rgba(59, 130, 246, 0.10)', border: 'rgba(59, 130, 246, 0.22)' },
  Applied: { label: 'Applied', color: '#67e8f9', bg: 'rgba(6, 182, 212, 0.10)', border: 'rgba(6, 182, 212, 0.22)' },
  Interviewing: { label: 'Interviewing', color: '#fde047', bg: 'rgba(234, 179, 8, 0.10)', border: 'rgba(234, 179, 8, 0.22)' },
  Offer: { label: 'Offer', color: '#86efac', bg: 'rgba(34, 197, 94, 0.10)', border: 'rgba(34, 197, 94, 0.22)' },
  Rejected: { label: 'Archived', color: '#fda4af', bg: 'rgba(244, 63, 94, 0.10)', border: 'rgba(244, 63, 94, 0.22)' }
};

const JobSearchPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'tracker'

  // Search State
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [parsedProfile, setParsedProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  // Search Overrides
  const [customRole, setCustomRole] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showOverrides, setShowOverrides] = useState(false);

  // In-results Filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'date'
  const [filterType, setFilterType] = useState('ALL');
  const [minFitScore, setMinFitScore] = useState(0); // 0, 70, 85
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Bookmarking / Tracker State
  const [bookmarks, setBookmarks] = useState([]);
  const [trackerFilter, setTrackerFilter] = useState('ALL');
  const [trackerViewMode, setTrackerViewMode] = useState('board'); // 'board' | 'list'
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  // History State
  const [historySessions, setHistorySessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadingSteps = [
    'Deconstructing resume layout and ATS syntax tokens',
    'Synthesizing candidate profile with Groq Llama 3.3',
    'Querying live engineering postings across career platforms',
    'Computing multi-dimensional vector match and skill overlap'
  ];
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % loadingSteps.length);
      }, 1600);
    } else {
      setLoadingStepIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/jobs/bookmarks');
      setBookmarks(res.data || []);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/jobs/history');
      setHistorySessions(res.data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
    fetchHistory();
  }, []);

  const bookmarkedMap = new Map(bookmarks.map((b) => [b.jobId, b]));

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type === 'application/pdf' || dropped.name.endsWith('.pdf')) {
        setFile(dropped);
        setError('');
      } else {
        setError('Please upload a PDF document.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf' || selected.name.endsWith('.pdf')) {
        setFile(selected);
        setError('');
      } else {
        setError('Please select a PDF document.');
      }
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!file) return;

    setError('');
    setLoading(true);
    setSearchInitiated(true);
    setParsedProfile(null);
    setJobs([]);

    const formData = new FormData();
    formData.append('resume', file);
    if (customRole.trim()) {
      formData.append('query', customRole.trim());
    }
    if (customLocation.trim()) {
      formData.append('location', customLocation.trim());
    }

    try {
      const res = await api.post('/jobs/search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setParsedProfile(res.data.parsed_profile || {});
      const results = res.data.results || [];
      setJobs(results);
      fetchHistory(); // refresh history list
      toast.success(`Evaluated ${results.length} active openings with ATS fit`);
    } catch (err) {
      console.error('Job search error:', err);
      const msg = err.response?.data?.error || 'Multi-agent evaluation failed. Verify PDF contents.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async (historyId) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/jobs/history/${historyId}`);
      if (res.data) {
        setParsedProfile(res.data.parsedProfile || {});
        setJobs(res.data.results || []);
        setSearchInitiated(true);
        toast.success('Loaded saved candidate evaluation session');
      }
    } catch (err) {
      console.error('Load history error:', err);
      toast.error('Failed to load past session');
    } finally {
      setLoading(false);
    }
  };

  // Bookmark / Unbookmark Toggle
  const handleToggleBookmark = async (job) => {
    const isBookmarked = bookmarkedMap.has(job.job_id);

    try {
      if (isBookmarked) {
        const existing = bookmarkedMap.get(job.job_id);
        await api.delete(`/jobs/bookmark/${existing._id}`);
        setBookmarks(bookmarks.filter((b) => b._id !== existing._id));
        toast.info('Removed role from pipeline');
      } else {
        const res = await api.post('/jobs/bookmark', {
          jobId: job.job_id,
          title: job.title,
          company: job.company,
          location: job.location,
          employmentType: job.employment_type,
          salaryRange: job.salary_range,
          applyLink: job.apply_link,
          matchScore: job.match_score,
          matchReason: job.match_reason,
          skillOverlap: job.skill_overlap,
          missingSkills: job.missing_skills,
          status: 'Saved',
          rawJobData: job
        });
        if (res.data.bookmark) {
          setBookmarks([res.data.bookmark, ...bookmarks]);
          toast.success('Added role to Application Pipeline');
        }
      }
    } catch (err) {
      console.error('Bookmark toggle error:', err);
      toast.error('Failed to update saved job');
    }
  };

  // Status Change
  const handleStatusChange = async (bookmarkId, newStatus) => {
    try {
      const res = await api.patch(`/jobs/bookmark/${bookmarkId}/status`, { status: newStatus });
      setBookmarks(bookmarks.map((b) => (b._id === bookmarkId ? res.data.bookmark : b)));
      toast.success(`Pipeline stage updated to "${STAGE_CONFIG[newStatus]?.label || newStatus}"`);
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update stage');
    }
  };

  // Notes update
  const handleSaveNotes = async (bookmarkId) => {
    try {
      const res = await api.patch(`/jobs/bookmark/${bookmarkId}/status`, { notes: noteDraft });
      setBookmarks(bookmarks.map((b) => (b._id === bookmarkId ? res.data.bookmark : b)));
      setEditingNotesId(null);
      setNoteDraft('');
      toast.success('Notes saved');
    } catch (err) {
      console.error('Notes update error:', err);
      toast.error('Failed to save notes');
    }
  };

  // Delete Bookmark
  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await api.delete(`/jobs/bookmark/${bookmarkId}`);
      setBookmarks(bookmarks.filter((b) => b._id !== bookmarkId));
      toast.info('Role removed from tracker');
    } catch (err) {
      console.error('Delete bookmark error:', err);
    }
  };

  // Filter & sort jobs in search tab
  let processedJobs = [...jobs];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    processedJobs = processedJobs.filter(
      (j) =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.company || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q) ||
        (j.match_reason || '').toLowerCase().includes(q)
    );
  }
  if (filterType !== 'ALL') {
    processedJobs = processedJobs.filter((j) => (j.employment_type || '').toUpperCase().includes(filterType));
  }
  if (minFitScore > 0) {
    processedJobs = processedJobs.filter((j) => (j.match_score || 0) >= minFitScore);
  }
  if (sortBy === 'match') {
    processedJobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  } else {
    processedJobs.sort((a, b) => new Date(b.posted_at || 0) - new Date(a.posted_at || 0));
  }

  // Filter bookmarks in tracker tab
  const filteredBookmarks = trackerFilter === 'ALL'
    ? bookmarks
    : bookmarks.filter((b) => b.status === trackerFilter);

  const renderFitBadge = (score) => {
    const isHigh = score >= 85;
    const isGood = score >= 70;
    const isFair = score >= 55;
    const color = isHigh ? '#34d399' : isGood ? '#3b82f6' : isFair ? '#fbbf24' : '#fb7185';
    const bg = isHigh ? 'rgba(52, 211, 153, 0.10)' : isGood ? 'rgba(59, 130, 246, 0.10)' : isFair ? 'rgba(251, 191, 36, 0.10)' : 'rgba(251, 113, 133, 0.10)';

    return (
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: 600,
          color,
          backgroundColor: bg,
          padding: '0.2rem 0.55rem',
          borderRadius: '3px',
          letterSpacing: '-0.01em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: color
          }}
        />
        {score}% fit
      </span>
    );
  };

  const highMatchCount = jobs.filter((j) => (j.match_score || 0) >= 80).length;
  const avgMatchScore = jobs.length > 0 ? Math.round(jobs.reduce((acc, j) => acc + (j.match_score || 0), 0) / jobs.length) : 0;

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
      {/* Top Telemetry & Controls */}
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
            CAREER INTELLIGENCE · TALENT MAPPING & APPLICATION PIPELINE
          </span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'inline-block'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {jobs.length > 0 && activeTab === 'search' && (
            <button
              type="button"
              onClick={() => exportJobMatchPdf(jobs, parsedProfile?.name || file?.name || 'Engineering Candidate')}
              style={{
                background: 'transparent',
                border: '1px solid #202026',
                color: '#d4d4d8',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
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
              title="Export Fit Dossier as Clean Institutional PDF"
            >
              <Printer size={12} />
              <span>Export Dossier (PDF)</span>
            </button>
          )}

          {searchInitiated && !loading && (
            <button
              type="button"
              onClick={() => {
                setJobs([]);
                setFile(null);
                setParsedProfile(null);
                setSearchInitiated(false);
                setError('');
                setSearchQuery('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                padding: '0.35rem 0.5rem'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
            >
              <RotateCcw size={11} />
              <span>New Analysis</span>
            </button>
          )}
        </div>
      </div>

      {/* Page Title & Intelligence Summary Header */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1
              style={{
                fontSize: '2.25rem',
                fontWeight: 600,
                letterSpacing: '-0.035em',
                color: '#ffffff',
                margin: '0 0 0.5rem 0',
                lineHeight: 1.15
              }}
            >
              Role Matching & Career Intelligence
            </h1>
            <p
              style={{
                fontSize: '0.96rem',
                color: '#8e8e99',
                margin: 0,
                maxWidth: '640px',
                lineHeight: 1.55
              }}
            >
              Autonomous resume parsing paired with semantic vector scoring across live engineering roles and active hiring pipelines.
            </p>
          </div>

          {/* Quick Metrics Bar (Editorial typographic signals) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2.5rem',
              padding: '0.75rem 1.25rem',
              backgroundColor: '#101014',
              border: '1px solid #18181f',
              borderRadius: '6px'
            }}
          >
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {bookmarks.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tracked Roles
              </div>
            </div>

            {jobs.length > 0 && (
              <>
                <div style={{ width: '1px', height: '24px', backgroundColor: '#1f1f28' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    {highMatchCount}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Strong Fits (&gt;80%)
                  </div>
                </div>

                <div style={{ width: '1px', height: '24px', backgroundColor: '#1f1f28' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {avgMatchScore}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Avg Alignment
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tab Switcher: Linear Style */}
        <div
          style={{
            display: 'flex',
            gap: '2.5rem',
            marginTop: '2.5rem',
            borderBottom: '1px solid #18181d'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'search' ? '2px solid #3b82f6' : '2px solid transparent',
              padding: '0.75rem 0.2rem',
              fontSize: '0.86rem',
              fontWeight: activeTab === 'search' ? 500 : 400,
              color: activeTab === 'search' ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              transition: 'color 0.15s ease'
            }}
          >
            <span>Opportunities & Evaluation</span>
            {jobs.length > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: activeTab === 'search' ? '#3b82f6' : '#71717a',
                  backgroundColor: activeTab === 'search' ? 'rgba(59, 130, 246, 0.12)' : '#121216',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '3px'
                }}
              >
                {jobs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tracker' ? '2px solid #3b82f6' : '2px solid transparent',
              padding: '0.75rem 0.2rem',
              fontSize: '0.86rem',
              fontWeight: activeTab === 'tracker' ? 500 : 400,
              color: activeTab === 'tracker' ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              transition: 'color 0.15s ease'
            }}
          >
            <span>Application Pipeline</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                color: activeTab === 'tracker' ? '#3b82f6' : '#71717a',
                backgroundColor: activeTab === 'tracker' ? 'rgba(59, 130, 246, 0.12)' : '#121216',
                padding: '0.1rem 0.45rem',
                borderRadius: '3px'
              }}
            >
              {bookmarks.length}
            </span>
          </button>
        </div>
      </section>

      {/* TAB 1: RESUME SEARCH & LIVE MATCHES */}
      {activeTab === 'search' && (
        <>
          {/* UPLOAD & EVALUATION WORKFLOW (WHEN IDLE) */}
          {!searchInitiated && !loading && (
            <div style={{ maxWidth: '720px', marginTop: '1rem' }}>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('resume-file-input').click()}
                style={{
                  border: '1px dashed #24242e',
                  backgroundColor: '#101014',
                  borderRadius: '6px',
                  padding: '3rem 2.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  marginBottom: '1.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#121218';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#24242e';
                  e.currentTarget.style.backgroundColor = '#101014';
                }}
              >
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '6px',
                    backgroundColor: '#16161d',
                    border: '1px solid #252530',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem auto',
                    color: '#3b82f6'
                  }}
                >
                  <Upload size={18} />
                </div>

                <div style={{ fontSize: '0.96rem', fontWeight: 500, color: '#ffffff', marginBottom: '0.4rem' }}>
                  {file ? file.name : 'Drop your engineering resume (PDF) or click to browse'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#71717a' }}>
                  {file ? `${(file.size / 1024).toFixed(1)} KB · Ready to evaluate` : 'Parsed privately via Groq Llama 3.3 · Structured ATS extraction & vector alignment'}
                </div>
              </div>

              {/* Selected File Token */}
              {file && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 1rem',
                    backgroundColor: '#121217',
                    border: '1px solid #202028',
                    borderRadius: '4px',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <FileText size={15} color="#3b82f6" />
                    <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 500 }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#71717a',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                    title="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Collapsible Overrides */}
              <div style={{ marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setShowOverrides(!showOverrides)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8e8e99',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8e8e99')}
                >
                  <SlidersHorizontal size={12} />
                  <span>{showOverrides ? 'Hide target parameters' : 'Customize target role or location (optional)'}</span>
                  {showOverrides ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {showOverrides && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginTop: '1rem',
                      padding: '1.25rem',
                      backgroundColor: '#101014',
                      border: '1px solid #1a1a22',
                      borderRadius: '4px'
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Target Role Focus
                      </label>
                      <input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="e.g. Distributed Systems, ML Infrastructure"
                        style={{
                          width: '100%',
                          backgroundColor: '#0c0c0f',
                          border: '1px solid #1f1f28',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '3px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Preferred Location / Mode
                      </label>
                      <input
                        type="text"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        placeholder="e.g. Remote, San Francisco, New York"
                        style={{
                          width: '100%',
                          backgroundColor: '#0c0c0f',
                          border: '1px solid #1f1f28',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '3px'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#fb7185',
                    fontSize: '0.82rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    marginBottom: '1.5rem'
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSearch}
                disabled={!file}
                style={{
                  backgroundColor: file ? '#ffffff' : '#18181f',
                  color: file ? '#0B0B0D' : '#52525b',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: file ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (file) e.currentTarget.style.backgroundColor = '#e4e4e7';
                }}
                onMouseLeave={(e) => {
                  if (file) e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <span>Evaluate Live Role Matches</span>
                <ArrowUpRight size={14} />
              </button>

              {/* Past Resume Sessions Quick-Select */}
              {historySessions.length > 0 && (
                <div style={{ marginTop: '3.5rem', paddingTop: '2rem', borderTop: '1px solid #18181d' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      RECENT EVALUATIONS
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#52525b' }}>
                      Click to reload session without re-uploading
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {historySessions.slice(0, 4).map((h) => (
                      <div
                        key={h._id}
                        onClick={() => handleLoadHistory(h._id)}
                        style={{
                          padding: '0.85rem 1rem',
                          backgroundColor: '#101014',
                          border: '1px solid #18181f',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease, background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#2c2c36';
                          e.currentTarget.style.backgroundColor = '#131318';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#18181f';
                          e.currentTarget.style.backgroundColor = '#101014';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FileText size={14} color="#71717a" />
                          <div>
                            <span style={{ fontSize: '0.84rem', fontWeight: 500, color: '#ffffff' }}>
                              {h.parsedProfile?.name || 'Evaluated Candidate'}
                            </span>
                            {h.parsedProfile?.current_role && (
                              <span style={{ fontSize: '0.8rem', color: '#71717a', marginLeft: '0.5rem' }}>
                                · {h.parsedProfile.current_role}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#3b82f6' }}>
                            {h.results?.length || 0} roles matched
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#52525b', fontFamily: 'var(--font-mono)' }}>
                            {new Date(h.searchedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div
              style={{
                maxWidth: '600px',
                margin: '4rem 0',
                padding: '2rem 0'
              }}
            >
              <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 500, marginBottom: '0.4rem' }}>
                {loadingSteps[loadingStepIdx]}...
              </div>
              <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '1.5rem' }}>
                Multi-agent inference across candidate technical footprint and live hiring feeds
              </div>
              <div
                style={{
                  height: '2px',
                  backgroundColor: '#18181f',
                  borderRadius: '1px',
                  overflow: 'hidden',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${((loadingStepIdx + 1) / loadingSteps.length) * 100}%`,
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>
          )}

          {/* RESULTS VIEW */}
          {searchInitiated && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {/* Parsed Profile Executive Dossier */}
              {parsedProfile && (
                <div
                  style={{
                    padding: '2rem',
                    backgroundColor: '#101014',
                    border: '1px solid #1a1a22',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                          {parsedProfile.name || 'Candidate Profile'}
                        </h2>
                        {parsedProfile.current_role && (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontFamily: 'var(--font-mono)',
                              color: '#3b82f6',
                              backgroundColor: 'rgba(59, 130, 246, 0.10)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '3px'
                            }}
                          >
                            {parsedProfile.current_role}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#71717a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span>{parsedProfile.experience_years ? `${parsedProfile.experience_years} years experience` : 'Full-stack background'}</span>
                        <span>·</span>
                        <span>{parsedProfile.location || 'Location flexible'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => exportJobMatchPdf(jobs, parsedProfile?.name || 'Candidate')}
                        style={{
                          background: 'transparent',
                          border: '1px solid #202028',
                          color: '#d4d4d8',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '3px',
                          fontSize: '0.74rem',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#202028')}
                      >
                        <Printer size={12} />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>

                  {parsedProfile.summary && (
                    <div style={{ fontSize: '0.88rem', color: '#a1a1aa', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                      {parsedProfile.summary}
                    </div>
                  )}

                  {/* Skills Chips */}
                  {parsedProfile.skills && parsedProfile.skills.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        IDENTIFIED CORE COMPETENCIES ({parsedProfile.skills.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {parsedProfile.skills.map((sk, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
                              fontFamily: 'var(--font-mono)',
                              color: '#d4d4d8',
                              backgroundColor: '#14141a',
                              border: '1px solid #202028',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '3px'
                            }}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Search, Filter & Sort Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #18181d'
                }}
              >
                {/* Search in results */}
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by role, company..."
                    style={{
                      width: '100%',
                      backgroundColor: '#101014',
                      border: '1px solid #1f1f28',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      padding: '0.45rem 0.75rem 0.45rem 2rem',
                      borderRadius: '4px'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Min Fit Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>FIT:</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {[
                        { label: 'All', val: 0 },
                        { label: '70%+', val: 70 },
                        { label: '85%+', val: 85 }
                      ].map((btn) => (
                        <button
                          key={btn.val}
                          type="button"
                          onClick={() => setMinFitScore(btn.val)}
                          style={{
                            background: minFitScore === btn.val ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                            color: minFitScore === btn.val ? '#ffffff' : '#71717a',
                            border: minFitScore === btn.val ? '1px solid #2e2e38' : '1px solid transparent',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '3px',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer'
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>TYPE:</span>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{
                        background: '#101014',
                        border: '1px solid #1f1f28',
                        color: '#d4d4d8',
                        fontSize: '0.76rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '3px'
                      }}
                    >
                      <option value="ALL">All types</option>
                      <option value="FULLTIME">Full-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PARTTIME">Part-time</option>
                    </select>
                  </div>

                  {/* Sort Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>SORT:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        background: '#101014',
                        border: '1px solid #1f1f28',
                        color: '#d4d4d8',
                        fontSize: '0.76rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '3px'
                      }}
                    >
                      <option value="match">ATS Fit Score</option>
                      <option value="date">Posting Date</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feed Status Count */}
              <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                SHOWING {processedJobs.length} OF {jobs.length} EVALUATED OPENINGS
              </div>

              {/* Jobs List (Editorial Feed, Divided by 1px rules) */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {processedJobs.map((job) => {
                  const isExpanded = expandedJobId === job.job_id;
                  const isBookmarked = bookmarkedMap.has(job.job_id);

                  return (
                    <div
                      key={job.job_id}
                      style={{
                        padding: '2rem 0',
                        borderBottom: '1px solid #18181d',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                      }}
                    >
                      {/* Top Row: Title, Company, Score, Actions */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.35rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                              {job.title}
                            </h3>
                            {renderFitBadge(job.match_score)}
                          </div>

                          <div style={{ fontSize: '0.86rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 500, color: '#ffffff' }}>{job.company}</span>
                            <span>·</span>
                            <span>{job.location}</span>
                            <span>·</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{job.employment_type}</span>
                            {job.salary_range && (
                              <>
                                <span>·</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#86efac' }}>
                                  {job.salary_range}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleBookmark(job)}
                            style={{
                              background: isBookmarked ? 'rgba(59, 130, 246, 0.10)' : 'transparent',
                              border: isBookmarked ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #202028',
                              color: isBookmarked ? '#60a5fa' : '#8e8e99',
                              borderRadius: '4px',
                              padding: '0.42rem 0.8rem',
                              fontSize: '0.76rem',
                              fontFamily: 'var(--font-mono)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isBookmarked) {
                                e.currentTarget.style.color = '#ffffff';
                                e.currentTarget.style.borderColor = '#363642';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isBookmarked) {
                                e.currentTarget.style.color = '#8e8e99';
                                e.currentTarget.style.borderColor = '#202028';
                              }
                            }}
                          >
                            {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                            <span>{isBookmarked ? 'In Pipeline' : 'Track Role'}</span>
                          </button>

                          <a
                            href={job.apply_link}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              backgroundColor: '#ffffff',
                              color: '#0B0B0D',
                              borderRadius: '4px',
                              padding: '0.42rem 0.9rem',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e4e4e7')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                          >
                            <span>Apply</span>
                            <ArrowUpRight size={12} />
                          </a>
                        </div>
                      </div>

                      {/* Why You Match Note */}
                      <p style={{ fontSize: '0.88rem', color: '#8e8e99', lineHeight: 1.55, margin: '0.2rem 0' }}>
                        {job.match_reason}
                      </p>

                      {/* Skill Overlap & Missing Skills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        {job.skill_overlap?.map((sk, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.7rem',
                              fontFamily: 'var(--font-mono)',
                              color: '#34d399',
                              backgroundColor: 'rgba(52, 211, 153, 0.08)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Check size={10} />
                            <span>{sk}</span>
                          </span>
                        ))}

                        {job.missing_skills?.map((sk, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.7rem',
                              fontFamily: 'var(--font-mono)',
                              color: '#71717a',
                              backgroundColor: '#121217',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '2px'
                            }}
                          >
                            gap: {sk}
                          </span>
                        ))}
                      </div>

                      {/* Expand Key Scope Details */}
                      {job.jd_bullets && job.jd_bullets.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedJobId(isExpanded ? null : job.job_id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#71717a',
                              fontSize: '0.74rem',
                              fontFamily: 'var(--font-mono)',
                              cursor: 'pointer',
                              padding: '0.35rem 0 0 0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#d4d4d8')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                          >
                            <span>{isExpanded ? 'Hide scope details' : 'View scope details'}</span>
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>

                          {isExpanded && (
                            <ul
                              style={{
                                margin: '0.75rem 0 0 1.25rem',
                                padding: 0,
                                fontSize: '0.82rem',
                                color: '#a1a1aa',
                                lineHeight: 1.6
                              }}
                            >
                              {job.jd_bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {processedJobs.length === 0 && (
                  <div style={{ padding: '4rem 0', textAlign: 'center', color: '#71717a', fontSize: '0.88rem' }}>
                    No roles match your active filter criteria. Adjust your search or fit threshold.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: APPLICATION TRACKER */}
      {activeTab === 'tracker' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header Controls: Stage Pills & View Mode */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1rem',
              borderBottom: '1px solid #18181d',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            {/* Status Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {['ALL', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map((status) => {
                const count = status === 'ALL'
                  ? bookmarks.length
                  : bookmarks.filter((b) => b.status === status).length;
                const isSelected = trackerFilter === status;
                const displayLabel = status === 'Rejected' ? 'Archived' : status === 'ALL' ? 'All Roles' : status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setTrackerFilter(status)}
                    style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      color: isSelected ? '#ffffff' : '#71717a',
                      border: isSelected ? '1px solid #2e2e38' : '1px solid transparent',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '3px',
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {displayLabel} ({count})
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle: Board vs List */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  backgroundColor: '#101014',
                  border: '1px solid #1f1f28',
                  borderRadius: '4px',
                  padding: '2px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setTrackerViewMode('board')}
                  style={{
                    background: trackerViewMode === 'board' ? '#1c1c24' : 'transparent',
                    border: 'none',
                    color: trackerViewMode === 'board' ? '#ffffff' : '#71717a',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                  title="Pipeline Board View"
                >
                  <Columns size={12} />
                  <span>Board</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTrackerViewMode('list')}
                  style={{
                    background: trackerViewMode === 'list' ? '#1c1c24' : 'transparent',
                    border: 'none',
                    color: trackerViewMode === 'list' ? '#ffffff' : '#71717a',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                  title="Detailed List View"
                >
                  <List size={12} />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {/* APPLICATION TRACKER BOARD (KANBAN) VIEW */}
          {filteredBookmarks.length > 0 && trackerViewMode === 'board' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                alignItems: 'start'
              }}
            >
              {['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map((stage) => {
                const stageJobs = bookmarks.filter((b) => b.status === stage);
                const cfg = STAGE_CONFIG[stage];

                return (
                  <div
                    key={stage}
                    style={{
                      backgroundColor: '#101014',
                      border: '1px solid #18181f',
                      borderRadius: '6px',
                      padding: '1rem',
                      minHeight: '400px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    {/* Stage Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #1a1a22' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: cfg.color
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff' }}>
                          {cfg.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
                        {stageJobs.length}
                      </span>
                    </div>

                    {/* Stage Job Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {stageJobs.map((bm) => (
                        <div
                          key={bm._id}
                          style={{
                            backgroundColor: '#141419',
                            border: '1px solid #202028',
                            borderRadius: '4px',
                            padding: '0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            transition: 'border-color 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.25 }}>
                              {bm.title}
                            </div>
                            {renderFitBadge(bm.matchScore)}
                          </div>

                          <div style={{ fontSize: '0.78rem', color: '#8e8e99' }}>
                            {bm.company} · {bm.location}
                          </div>

                          {/* Quick Stage Selector */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid #1a1a22' }}>
                            <select
                              value={bm.status}
                              onChange={(e) => handleStatusChange(bm._id, e.target.value)}
                              style={{
                                background: 'transparent',
                                color: cfg.color,
                                border: 'none',
                                fontSize: '0.72rem',
                                fontFamily: 'var(--font-mono)',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              <option value="Saved" style={{ background: '#0B0B0D', color: '#ffffff' }}>Move to Saved</option>
                              <option value="Applied" style={{ background: '#0B0B0D', color: '#ffffff' }}>Move to Applied</option>
                              <option value="Interviewing" style={{ background: '#0B0B0D', color: '#ffffff' }}>Move to Interviewing</option>
                              <option value="Offer" style={{ background: '#0B0B0D', color: '#ffffff' }}>Move to Offer</option>
                              <option value="Rejected" style={{ background: '#0B0B0D', color: '#ffffff' }}>Move to Archived</option>
                            </select>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {bm.applyLink && (
                                <a
                                  href={bm.applyLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: '#71717a', display: 'flex' }}
                                  title="Open job link"
                                >
                                  <ArrowUpRight size={12} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteBookmark(bm._id)}
                                style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 0 }}
                                title="Remove"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {stageJobs.length === 0 && (
                        <div style={{ padding: '2rem 0', textAlign: 'center', color: '#52525b', fontSize: '0.74rem', fontStyle: 'italic' }}>
                          Empty stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* APPLICATION TRACKER LIST VIEW */}
          {filteredBookmarks.length > 0 && trackerViewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredBookmarks.map((bookmark) => {
                const isEditingNotes = editingNotesId === bookmark._id;
                const cfg = STAGE_CONFIG[bookmark.status] || STAGE_CONFIG.Saved;

                return (
                  <div
                    key={bookmark._id}
                    style={{
                      padding: '1.75rem 0',
                      borderBottom: '1px solid #18181d',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    {/* Top Row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.35rem' }}>
                          <h3 style={{ fontSize: '1.18rem', fontWeight: 600, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                            {bookmark.title}
                          </h3>
                          {renderFitBadge(bookmark.matchScore)}
                        </div>

                        <div style={{ fontSize: '0.86rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <span style={{ fontWeight: 500, color: '#ffffff' }}>{bookmark.company}</span>
                          <span>·</span>
                          <span>{bookmark.location}</span>
                          <span>·</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{bookmark.employmentType}</span>
                        </div>
                      </div>

                      {/* Stage Selector & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <select
                          value={bookmark.status}
                          onChange={(e) => handleStatusChange(bookmark._id, e.target.value)}
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            borderRadius: '3px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.76rem',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Saved" style={{ background: '#0B0B0D', color: '#ffffff' }}>Saved</option>
                          <option value="Applied" style={{ background: '#0B0B0D', color: '#ffffff' }}>Applied</option>
                          <option value="Interviewing" style={{ background: '#0B0B0D', color: '#ffffff' }}>Interviewing</option>
                          <option value="Offer" style={{ background: '#0B0B0D', color: '#ffffff' }}>Offer</option>
                          <option value="Rejected" style={{ background: '#0B0B0D', color: '#ffffff' }}>Archived</option>
                        </select>

                        {bookmark.applyLink && (
                          <a
                            href={bookmark.applyLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: 'transparent',
                              border: '1px solid #24242e',
                              color: '#d4d4d8',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '3px',
                              fontSize: '0.76rem',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <span>Open</span>
                            <ArrowUpRight size={11} />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteBookmark(bookmark._id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#52525b',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#52525b')}
                          title="Remove from pipeline"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Match evaluation note */}
                    {bookmark.matchReason && (
                      <p style={{ fontSize: '0.86rem', color: '#8e8e99', lineHeight: 1.5, margin: 0 }}>
                        {bookmark.matchReason}
                      </p>
                    )}

                    {/* Notes Row */}
                    <div style={{ marginTop: '0.35rem' }}>
                      {isEditingNotes ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '640px' }}>
                          <textarea
                            rows={2}
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Add recruiter contacts, salary negotiations, or interview notes..."
                            style={{
                              backgroundColor: '#101014',
                              border: '1px solid #24242e',
                              color: '#ffffff',
                              fontSize: '0.82rem',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '3px'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleSaveNotes(bookmark._id)}
                              style={{
                                backgroundColor: '#ffffff',
                                color: '#0B0B0D',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '0.28rem 0.75rem',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Save note
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNotesId(null)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #24242e',
                                color: '#71717a',
                                borderRadius: '3px',
                                padding: '0.28rem 0.65rem',
                                fontSize: '0.74rem',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <span style={{ fontSize: '0.8rem', color: bookmark.notes ? '#a1a1aa' : '#52525b', fontStyle: bookmark.notes ? 'normal' : 'italic' }}>
                            {bookmark.notes || 'No tracking notes added.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNotesId(bookmark._id);
                              setNoteDraft(bookmark.notes || '');
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#71717a',
                              fontSize: '0.72rem',
                              fontFamily: 'var(--font-mono)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: 0
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                          >
                            <Edit3 size={11} />
                            <span>{bookmark.notes ? 'Edit' : 'Add note'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredBookmarks.length === 0 && (
            <EmptyState
              icon={Briefcase}
              badge="APPLICATION PIPELINE EMPTY"
              title="No tracked roles in this view."
              description="Save engineering opportunities from Resume & Opportunities to monitor your active application stages."
              actionLabel="Explore Openings"
              onAction={() => setActiveTab('search')}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default JobSearchPage;
