import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
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
  User,
  GraduationCap,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileCheck,
  Bookmark,
  BookmarkCheck,
  Trash2,
  SlidersHorizontal,
  Search,
  Clock,
  Building,
  Check,
  Edit3,
  Printer
} from 'lucide-react';
import { exportJobMatchPdf } from '../../utils/exportUtils';
import EmptyState from '../../components/common/EmptyState';

const STATUS_COLORS = {
  Saved: { bg: 'rgba(99, 102, 241, 0.15)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)' },
  Applied: { bg: 'rgba(6, 182, 212, 0.15)', text: '#67e8f9', border: 'rgba(6, 182, 212, 0.3)' },
  Interviewing: { bg: 'rgba(234, 179, 8, 0.15)', text: '#fde047', border: 'rgba(234, 179, 8, 0.3)' },
  Offer: { bg: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7', border: 'rgba(16, 185, 129, 0.3)' },
  Rejected: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fda4af', border: 'rgba(244, 63, 94, 0.3)' }
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

  // Filters & sorting
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'date'
  const [filterType, setFilterType] = useState('ALL');
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Bookmarking / Tracker State
  const [bookmarks, setBookmarks] = useState([]);
  const [trackerFilter, setTrackerFilter] = useState('ALL');
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  const loadingMessages = [
    'Parsing resume text with pdfplumber...',
    'Extracting candidate skills and experience using Llama 3.3 70B (Groq)...',
    'Synthesizing personalized role queries for live job APIs...',
    'Fetching live real-time job openings from RapidAPI JSearch...',
    'Evaluating candidate match scores and gap analysis concurrently...'
  ];

  // Fetch bookmarks on load
  const fetchBookmarks = async () => {
    try {
      setLoadingBookmarks(true);
      const res = await api.get('/jobs/bookmarks');
      setBookmarks(res.data || []);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
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
        setError('Please upload a PDF resume file.');
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
    e.preventDefault();
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
      toast.success(`Matched ${results.length} live openings with ATS scoring!`);
    } catch (err) {
      console.error('Job search error:', err);
      const msg = err.response?.data?.error || 'Multi-agent job search failed. Verify RapidAPI key and PDF contents.';
      setError(msg);
      toast.error(msg);
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
        toast.info('Removed job from Application Tracker');
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
          toast.success('Saved role to Application Tracker');
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
      toast.success(`Application status updated to "${newStatus}"`);
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update status');
    }
  };

  // Notes update
  const handleSaveNotes = async (bookmarkId) => {
    try {
      const res = await api.patch(`/jobs/bookmark/${bookmarkId}/status`, { notes: noteDraft });
      setBookmarks(bookmarks.map((b) => (b._id === bookmarkId ? res.data.bookmark : b)));
      setEditingNotesId(null);
      setNoteDraft('');
    } catch (err) {
      console.error('Notes update error:', err);
    }
  };

  // Delete Bookmark
  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await api.delete(`/jobs/bookmark/${bookmarkId}`);
      setBookmarks(bookmarks.filter((b) => b._id !== bookmarkId));
    } catch (err) {
      console.error('Delete bookmark error:', err);
    }
  };

  // Filter & sort jobs in search tab
  let processedJobs = [...jobs];
  if (filterType !== 'ALL') {
    processedJobs = processedJobs.filter((j) => (j.employment_type || '').toUpperCase().includes(filterType));
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

  const getMatchScoreBadge = (score) => {
    if (score >= 80) return <span className="badge badge-low">{score}% Match</span>;
    if (score >= 60) return <span className="badge badge-medium">{score}% Match</span>;
    return <span className="badge badge-high">{score}% Match</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Navbar
        title="Multi-Agent Job Intelligence"
        subtitle="Autonomous resume parsing, live JSearch query building, and application pipeline tracking"
      />

      <div className="page-container" style={{ maxWidth: '1300px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('search')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: activeTab === 'search' ? 600 : 500,
                fontSize: '0.85rem',
                background: activeTab === 'search' ? '#1c1c22' : 'transparent',
                color: activeTab === 'search' ? '#fff' : 'var(--text-secondary)',
                border: activeTab === 'search' ? '1px solid #2e2e38' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={15} style={{ color: activeTab === 'search' ? 'var(--accent-emerald)' : 'var(--text-dim)' }} />
              <span>Resume Search & Matches</span>
              {jobs.length > 0 && (
                <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', background: '#27272e', border: '1px solid #383842', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {jobs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tracker')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: activeTab === 'tracker' ? 600 : 500,
                fontSize: '0.85rem',
                background: activeTab === 'tracker' ? '#1c1c22' : 'transparent',
                color: activeTab === 'tracker' ? '#fff' : 'var(--text-secondary)',
                border: activeTab === 'tracker' ? '1px solid #2e2e38' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <BookmarkCheck size={15} style={{ color: activeTab === 'tracker' ? '#fff' : 'var(--text-dim)' }} />
              <span>Application Tracker</span>
              <span style={{
                fontSize: '0.72rem',
                padding: '0.1rem 0.45rem',
                background: bookmarks.length > 0 ? '#27272e' : 'transparent',
                border: bookmarks.length > 0 ? '1px solid #383842' : 'none',
                color: bookmarks.length > 0 ? '#fff' : 'var(--text-dim)',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)'
              }}>
                {bookmarks.length}
              </span>
            </button>
          </div>

          {activeTab === 'search' && searchInitiated && !loading && (
            <button
              onClick={() => {
                setJobs([]);
                setFile(null);
                setParsedProfile(null);
                setSearchInitiated(false);
                setError('');
              }}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
            >
              <RotateCcw size={14} />
              <span>New Search</span>
            </button>
          )}
        </div>

        {/* TAB 1: RESUME SEARCH & MATCHES */}
        {activeTab === 'search' && (
          <>
            {/* Upload Screen */}
            {!searchInitiated && !loading && (
              <div className="glass-panel" style={{ maxWidth: '680px', margin: '2rem auto', padding: '2.5rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>Autonomous Resume Job Matcher</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Upload your engineering resume (PDF). 6 autonomous LangGraph agents parse your profile, query live job postings, and score job matches.
                </p>

                {error && (
                  <div style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    color: '#fda4af',
                    fontSize: '0.85rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left'
                  }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSearch}>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    style={{
                      border: '2px dashed var(--border-focus)',
                      borderRadius: 'var(--radius-md)',
                      padding: '2.5rem 2rem',
                      background: 'rgba(99, 102, 241, 0.04)',
                      cursor: 'pointer',
                      marginBottom: '1.5rem',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => document.getElementById('resume-input').click()}
                  >
                    <input
                      id="resume-input"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <Upload size={38} color="var(--accent-cyan)" style={{ margin: '0 auto 1rem' }} />
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                      {file ? file.name : 'Click to select or drag & drop resume (PDF)'}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports standard single or multi-page resumes up to 10MB'}
                    </p>
                  </div>

                  {/* Collapsible Search Query & Location Overrides */}
                  <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <button
                      type="button"
                      onClick={() => setShowOverrides(!showOverrides)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        padding: '0.4rem 0'
                      }}
                    >
                      <SlidersHorizontal size={14} color="var(--accent-cyan)" />
                      <span>{showOverrides ? 'Hide Search Preferences' : 'Customize Target Role & Location (Optional)'}</span>
                      {showOverrides ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showOverrides && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '1.25rem',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem'
                      }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Target Role / Keywords
                          </label>
                          <input
                            type="text"
                            value={customRole}
                            onChange={(e) => setCustomRole(e.target.value)}
                            placeholder="e.g. AI Engineer, Full Stack"
                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Location / Work Mode
                          </label>
                          <input
                            type="text"
                            value={customLocation}
                            onChange={(e) => setCustomLocation(e.target.value)}
                            placeholder="e.g. Remote, San Francisco, CA"
                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-gradient"
                    disabled={!file}
                    style={{ width: '100%', fontSize: '0.95rem', justifyContent: 'center' }}
                  >
                    <Sparkles size={18} />
                    <span>Trigger Job Search Agents</span>
                  </button>
                </form>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="glass-panel" style={{ maxWidth: '650px', margin: '4rem auto', padding: '2.5rem' }}>
                <LoadingSpinner messages={loadingMessages} />
              </div>
            )}

            {/* Results View */}
            {searchInitiated && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Found {jobs.length} matching openings from live boards
                    </span>
                    <h2 style={{ fontSize: '1.6rem' }}>Candidate Intelligence & Matches</h2>
                  </div>

                  {jobs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => exportJobMatchPdf(jobs, parsedProfile?.name || file?.name || 'Engineering Candidate')}
                      className="btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      title="Export candidate match audit as clean institutional PDF"
                    >
                      <Printer size={14} style={{ color: '#c084fc' }} />
                      <span>Export Fit Dossier (PDF)</span>
                    </button>
                  )}
                </div>

                {error && (
                  <div style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    color: '#fda4af',
                    fontSize: '0.85rem'
                  }}>
                    {error}
                  </div>
                )}

                {/* Candidate Parsed Profile Card */}
                {parsedProfile && (
                  <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '4px solid var(--accent-cyan)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={18} color="var(--accent-cyan)" />
                          <span>{parsedProfile.name || 'Candidate Profile'}</span>
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {parsedProfile.current_role} • {parsedProfile.experience_years ? `${parsedProfile.experience_years} years experience` : 'Experience extracted'} • {parsedProfile.location || 'Flexible'}
                        </div>
                      </div>

                      {parsedProfile.education && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                          <GraduationCap size={16} />
                          <span>{parsedProfile.education}</span>
                        </div>
                      )}
                    </div>

                    {parsedProfile.summary && (
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '1rem' }}>
                        {parsedProfile.summary}
                      </p>
                    )}

                    {/* Skills Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {parsedProfile.skills?.map((sk, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.75rem',
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          color: '#a5b4fc',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filter & Sort Bar */}
                <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Filter Type:</span>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                    >
                      <option value="ALL">All Types</option>
                      <option value="FULLTIME">Full-time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PARTTIME">Part-time</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                    >
                      <option value="match">Highest Fit Score</option>
                      <option value="date">Most Recent</option>
                    </select>
                  </div>
                </div>

                {/* Jobs List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {processedJobs.map((job) => {
                    const isExpanded = expandedJobId === job.job_id;
                    const isBookmarked = bookmarkedMap.has(job.job_id);
                    const bookmarkItem = bookmarkedMap.get(job.job_id);

                    return (
                      <div key={job.job_id} className="glass-card" style={{ padding: '1.75rem' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                              <h3 style={{ fontSize: '1.2rem' }}>{job.title}</h3>
                              {getMatchScoreBadge(job.match_score)}
                              {isBookmarked && (
                                <span style={{
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: STATUS_COLORS[bookmarkItem?.status || 'Saved'].bg,
                                  color: STATUS_COLORS[bookmarkItem?.status || 'Saved'].text,
                                  border: `1px solid ${STATUS_COLORS[bookmarkItem?.status || 'Saved'].border}`,
                                  fontWeight: 600
                                }}>
                                  {bookmarkItem?.status || 'Saved'}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: 500, marginBottom: '0.4rem' }}>
                              {job.company}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={13} /> {job.location}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Briefcase size={13} /> {job.employment_type}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <DollarSign size={13} /> {job.salary_range}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleToggleBookmark(job)}
                              title={isBookmarked ? 'Remove from Saved Roles' : 'Bookmark & Track Role'}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.6rem 0.9rem',
                                borderRadius: 'var(--radius-sm)',
                                background: isBookmarked ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                border: isBookmarked ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                                color: isBookmarked ? '#a5b4fc' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                            </button>

                            <a
                              href={job.apply_link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-gradient"
                              style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}
                            >
                              <span>Apply Now</span>
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>

                        {/* Why this match reason */}
                        <div style={{
                          padding: '0.85rem 1rem',
                          background: 'rgba(99, 102, 241, 0.08)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(99, 102, 241, 0.15)',
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                          marginBottom: '1rem'
                        }}>
                          <strong style={{ color: 'var(--accent-cyan)' }}>Why You Match: </strong>
                          {job.match_reason}
                        </div>

                        {/* Skill Overlap / Missing Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                          {job.skill_overlap?.map((sk, i) => (
                            <span key={i} style={{
                              fontSize: '0.72rem',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#6ee7b7',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)'
                            }}>
                              ✓ {sk}
                            </span>
                          ))}
                          {job.missing_skills?.map((sk, i) => (
                            <span key={i} style={{
                              fontSize: '0.72rem',
                              background: 'rgba(244, 63, 94, 0.15)',
                              color: '#fda4af',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)'
                            }}>
                              ✕ {sk}
                            </span>
                          ))}
                        </div>

                        {/* Expandable JD Bullets */}
                        <button
                          onClick={() => setExpandedJobId(isExpanded ? null : job.job_id)}
                          style={{
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: 0
                          }}
                        >
                          <span>{isExpanded ? 'Hide Key Responsibilities' : 'Show Key Responsibilities (3 Highlights)'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isExpanded && job.jd_bullets && (
                          <ul style={{
                            paddingLeft: '1.25rem',
                            fontSize: '0.82rem',
                            color: 'var(--text-muted)',
                            lineHeight: '1.6',
                            marginTop: '0.75rem',
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: '0.75rem'
                          }}>
                            {job.jd_bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}

                  {processedJobs.length === 0 && (
                    <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No open jobs currently matched the filter criteria. Try adjusting the employment type filter or search terms.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: APPLICATION TRACKER */}
        {activeTab === 'tracker' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Filter pills */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['ALL', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map((status) => {
                  const count = status === 'ALL'
                    ? bookmarks.length
                    : bookmarks.filter((b) => b.status === status).length;

                  return (
                    <button
                      key={status}
                      onClick={() => setTrackerFilter(status)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.82rem',
                        fontWeight: trackerFilter === status ? 600 : 500,
                        background: trackerFilter === status
                          ? (status === 'ALL' ? 'var(--primary)' : STATUS_COLORS[status]?.bg || 'var(--primary)')
                          : 'rgba(255, 255, 255, 0.05)',
                        color: trackerFilter === status
                          ? (status === 'ALL' ? '#fff' : STATUS_COLORS[status]?.text || '#fff')
                          : 'var(--text-muted)',
                        border: trackerFilter === status
                          ? `1px solid ${STATUS_COLORS[status]?.border || 'var(--primary)'}`
                          : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {status} ({count})
                    </button>
                  );
                })}
              </div>

              <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                Showing {filteredBookmarks.length} tracked opportunities
              </span>
            </div>

            {/* Bookmarks List */}
            {filteredBookmarks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {filteredBookmarks.map((bookmark) => {
                  const isEditingNotes = editingNotesId === bookmark._id;
                  const cfg = STATUS_COLORS[bookmark.status] || STATUS_COLORS.Saved;

                  return (
                    <div key={bookmark._id} className="glass-card" style={{ padding: '1.75rem', borderLeft: `4px solid ${cfg.border}` }}>
                      {/* Top Bar */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                            <h3 style={{ fontSize: '1.25rem' }}>{bookmark.title}</h3>
                            {getMatchScoreBadge(bookmark.matchScore)}
                          </div>
                          <div style={{ fontSize: '0.92rem', color: 'var(--accent-cyan)', fontWeight: 500, marginBottom: '0.35rem' }}>
                            {bookmark.company}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={13} /> {bookmark.location}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Briefcase size={13} /> {bookmark.employmentType}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <DollarSign size={13} /> {bookmark.salaryRange}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={13} /> Saved {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Status Switcher & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Stage:</span>
                            <select
                              value={bookmark.status}
                              onChange={(e) => handleStatusChange(bookmark._id, e.target.value)}
                              style={{
                                fontSize: '0.82rem',
                                padding: '0.4rem 0.8rem',
                                background: cfg.bg,
                                color: cfg.text,
                                border: `1px solid ${cfg.border}`,
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600
                              }}
                            >
                              <option value="Saved" style={{ background: '#111827', color: '#fff' }}>Saved</option>
                              <option value="Applied" style={{ background: '#111827', color: '#fff' }}>Applied</option>
                              <option value="Interviewing" style={{ background: '#111827', color: '#fff' }}>Interviewing</option>
                              <option value="Offer" style={{ background: '#111827', color: '#fff' }}>Offer</option>
                              <option value="Rejected" style={{ background: '#111827', color: '#fff' }}>Rejected</option>
                            </select>
                          </div>

                          {bookmark.applyLink && (
                            <a
                              href={bookmark.applyLink}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary"
                              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
                            >
                              <span>Apply</span>
                              <ExternalLink size={13} />
                            </a>
                          )}

                          <button
                            onClick={() => handleDeleteBookmark(bookmark._id)}
                            title="Remove from tracker"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Match reason */}
                      {bookmark.matchReason && (
                        <div style={{
                          padding: '0.75rem 1rem',
                          background: 'rgba(99, 102, 241, 0.06)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.84rem',
                          color: 'var(--text-main)',
                          marginBottom: '0.85rem'
                        }}>
                          <strong style={{ color: 'var(--accent-cyan)' }}>Match Evaluation: </strong>
                          {bookmark.matchReason}
                        </div>
                      )}

                      {/* Notes Section */}
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {isEditingNotes ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <textarea
                              rows={2}
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Add application notes, referral contacts, interview dates..."
                              style={{ width: '100%', fontSize: '0.84rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => setEditingNotesId(null)}
                                className="btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveNotes(bookmark._id)}
                                className="btn-gradient"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                              >
                                Save Notes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.84rem', color: bookmark.notes ? 'var(--text-main)' : 'var(--text-dim)', fontStyle: bookmark.notes ? 'normal' : 'italic' }}>
                              {bookmark.notes || 'No tracking notes added yet. Click to add interview notes, contacts, or dates.'}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNotesId(bookmark._id);
                                setNoteDraft(bookmark.notes || '');
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--accent-cyan)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.78rem'
                              }}
                            >
                              <Edit3 size={13} />
                              <span>{bookmark.notes ? 'Edit' : 'Add Note'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Bookmark}
                badge="APPLICATION TRACKER EMPTY"
                title="No bookmarked roles in your pipeline yet."
                description="Save opportunities from the Search & Matches tab to track your application pipeline through Saved, Applied, Interviewing, and Offer stages."
                actionLabel="Explore Openings"
                onAction={() => setActiveTab('search')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSearchPage;
