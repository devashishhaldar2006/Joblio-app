import React, { useState, useEffect } from 'react';
import {
  Upload,
  Briefcase,
  MapPin,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Sparkles,
  DollarSign,
  Building,
  Layers,
  Globe,
  X
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STAGE_OPTIONS = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

export default function JobSearchPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'pipeline' | 'history'

  // Search form state
  const [file, setFile] = useState(null);
  const [roleQuery, setRoleQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedProfile, setParsedProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [jobSearchFilter, setJobSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'INTERNSHIP' | 'FULLTIME'
  const [platformLinks, setPlatformLinks] = useState([]);

  // Bookmarks / Pipeline state
  const [bookmarks, setBookmarks] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState('ALL');

  // History state
  const [historySessions, setHistorySessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchBookmarks = async () => {
    try {
      setLoadingBookmarks(true);
      const res = await api.get('/jobs/bookmarks');
      setBookmarks(res.data || []);
    } catch (err) {
      console.warn('Bookmarks load warning:', err.message);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/jobs/history');
      setHistorySessions(res.data || []);
    } catch (err) {
      console.warn('History load warning:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
    fetchHistory();
  }, []);

  const normalizeJob = (j, idx = 0) => {
    const jId = j.job_id || j.jobId || j.id || `job_${idx}`;
    const skills = j.skill_overlap || j.matched_skills || j.matchedSkills || [];
    const missing = j.missing_skills || j.missingSkills || [];
    const fit = j.match_score ?? j.fit_score ?? j.fitScore ?? 75;
    const sal = j.salary_range || j.salaryRange || j.salary || 'Competitive';
    const link = j.apply_link || j.applyLink || j.url || '';
    const advice = j.match_reason || j.matchReason || j.ats_advice || '';

    return {
      ...j,
      id: jId,
      job_id: jId,
      jobId: jId,
      title: j.title || j.job_title || 'Software Engineer',
      company: j.company || j.employer_name || 'Tech Company',
      location: j.location || (j.job_city ? `${j.job_city}${j.job_country ? `, ${j.job_country}` : ''}` : 'Remote / Flexible'),
      salary: sal,
      salary_range: sal,
      salaryRange: sal,
      employment_type: j.employment_type || j.job_employment_type || 'Full-time',
      fit_score: fit,
      match_score: fit,
      matchScore: fit,
      matched_skills: skills,
      skill_overlap: skills,
      matchedSkills: skills,
      missing_skills: missing,
      missingSkills: missing,
      ats_advice: advice,
      match_reason: advice,
      matchReason: advice,
      url: link,
      apply_link: link,
      applyLink: link,
      jd_bullets: j.jd_bullets || [],
      source: j.source || ''
    };
  };

  const normalizeProfile = (p) => {
    if (!p) return null;
    return {
      ...p,
      name: p.name || p.detected_role || 'Candidate',
      current_role: p.current_role || p.preferred_roles?.[0] || '',
      top_skills: p.skills || p.top_skills || [],
      skills: p.skills || p.top_skills || [],
      experience_level: p.experience_years ? `${p.experience_years} Years Exp` : (p.experience_level || 'Mid-Level')
    };
  };

  const bookmarkedMap = new Map();
  bookmarks.forEach((b) => {
    if (b.jobId) bookmarkedMap.set(b.jobId, b);
    if (b._id) bookmarkedMap.set(b._id, b);
  });

  const handleFileDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped && (dropped.type === 'application/pdf' || dropped.name.endsWith('.pdf'))) {
      setFile(dropped);
      toast.success(`Resume selected: ${dropped.name}`);
    } else {
      toast.error('Please upload a PDF document.');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected && (selected.type === 'application/pdf' || selected.name.endsWith('.pdf'))) {
      setFile(selected);
      toast.success(`Resume selected: ${selected.name}`);
    } else {
      toast.error('Please select a PDF document.');
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      toast.error('Please select or upload your resume PDF first.');
      return;
    }

    setLoading(true);
    setJobs([]);
    setParsedProfile(null);

    const formData = new FormData();
    formData.append('resume', file);
    if (roleQuery.trim()) formData.append('query', roleQuery.trim());
    if (locationQuery.trim()) formData.append('location', locationQuery.trim());

    try {
      const res = await api.post('/jobs/search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });

      const { parsed_profile, results, platform_links } = res.data;
      setParsedProfile(normalizeProfile(parsed_profile));
      const formatted = (results || []).map((j, idx) => normalizeJob(j, idx));
      setJobs(formatted);
      setPlatformLinks(platform_links || []);
      toast.success(`Matched ${formatted.length} job opportunities with your resume`);
      fetchHistory();
    } catch (err) {
      console.error('Job search failed:', err);
      const msg = err.response?.data?.error || err.message || 'Job match failed. Ensure Python services are active.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (job) => {
    const jId = job.job_id || job.jobId || job.id;
    const existing = bookmarkedMap.get(jId) || bookmarkedMap.get(job.id);
    if (existing) {
      try {
        await api.delete(`/jobs/bookmark/${existing._id}`);
        setBookmarks((prev) => prev.filter((b) => b._id !== existing._id));
        toast.success('Removed from saved jobs');
      } catch (err) {
        toast.error('Failed to remove bookmark.');
      }
    } else {
      try {
        const payload = {
          jobId: jId,
          title: job.title || job.job_title,
          company: job.company || job.employer_name,
          location: job.location,
          employmentType: job.employment_type || job.job_employment_type || 'FULLTIME',
          salaryRange: job.salary || job.salary_range || 'Competitive',
          applyLink: job.apply_link || job.url || '',
          matchScore: job.fit_score ?? job.match_score ?? 75,
          matchReason: job.ats_advice || job.match_reason || '',
          skillOverlap: job.matched_skills || job.skill_overlap || [],
          missingSkills: job.missing_skills || [],
          status: 'Saved',
          rawJobData: job
        };
        const res = await api.post('/jobs/bookmark', payload);
        const saved = res.data?.bookmark || res.data;
        setBookmarks((prev) => [saved, ...prev]);
        toast.success('Job saved to pipeline');
      } catch (err) {
        console.error('Save bookmark error:', err);
        toast.error('Failed to save job.');
      }
    }
  };

  const handleUpdateStage = async (bookmarkId, newStatus) => {
    try {
      const res = await api.patch(`/jobs/bookmark/${bookmarkId}/status`, { status: newStatus });
      setBookmarks((prev) =>
        prev.map((b) => (b._id === bookmarkId ? { ...b, status: res.data.status || newStatus } : b))
      );
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update pipeline stage.');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const isIntern = job.employment_type === 'INTERNSHIP' || job.title?.toLowerCase().includes('intern');
    if (typeFilter === 'INTERNSHIP' && !isIntern) return false;
    if (typeFilter === 'FULLTIME' && isIntern) return false;

    if (!jobSearchFilter) return true;
    const term = jobSearchFilter.toLowerCase();
    return (
      job.title?.toLowerCase().includes(term) ||
      job.company?.toLowerCase().includes(term) ||
      job.location?.toLowerCase().includes(term) ||
      job.source?.toLowerCase().includes(term) ||
      job.matched_skills?.some((s) => s.toLowerCase().includes(term))
    );
  });

  const filteredBookmarks = bookmarks.filter((b) => {
    if (pipelineFilter === 'ALL') return true;
    return b.status?.toUpperCase() === pipelineFilter.toUpperCase();
  });

  return (
    <div className="page-container fade-in">
      {/* Top Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '0.35rem' }}>
          Job Search & ATS Match
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Upload your resume to parse extracted skills, calculate keyword alignment, and track matching job openings
        </p>
      </div>

      {/* View Switcher Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem',
        marginBottom: '1.75rem'
      }}>
        {[
          { id: 'search', label: 'Resume Search & ATS Match', icon: Search },
          { id: 'pipeline', label: `Saved Pipeline (${bookmarks.length})`, icon: Bookmark },
          { id: 'history', label: `Past Searches (${historySessions.length})`, icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.875rem',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Search & Match */}
      {activeTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Resume Upload & Search Card */}
          <div className="card" style={{ padding: '1.75rem', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Upload Resume & Target Role
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Our AI engine parses your resume in real time, scores your profile against market jobs, and identifies skill gaps.
            </p>

            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('resume-file-input')?.click()}
                style={{
                  border: file ? '2px solid var(--primary)' : '2px dashed var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: file ? 'var(--primary-light)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: 'var(--primary)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <Upload size={22} />
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {file ? file.name : 'Click to select or drag & drop resume (PDF)'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {file ? `${(file.size / 1024).toFixed(1)} KB • Ready for ATS evaluation` : 'PDF format up to 10MB'}
                </div>

                {file && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    style={{
                      marginTop: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--error-text)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <X size={13} />
                    <span>Remove file</span>
                  </button>
                )}
              </div>

              {/* Optional filters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Target Role (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack Developer, Systems Engineer, React"
                    value={roleQuery}
                    onChange={(e) => setRoleQuery(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Location / Remote (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote, San Francisco, London, India"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="btn-primary"
                  style={{
                    padding: '0.625rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Search size={15} />
                  <span>{loading ? 'Analyzing Resume & Matching Openings...' : 'Search & Match Jobs'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Parsed Profile Summary from Live Resume */}
          {parsedProfile && (
            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Parsed Candidate Profile
                  </span>
                </div>
                {parsedProfile.experience_level && (
                  <span className="badge badge-primary">{parsedProfile.experience_level}</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                  {parsedProfile.name || parsedProfile.detected_role || 'Candidate'}
                </div>
                {parsedProfile.current_role && (
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    • {parsedProfile.current_role}
                  </span>
                )}
              </div>

              {parsedProfile.top_skills && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                    Extracted Skills from Resume:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {parsedProfile.top_skills.map((skill, idx) => (
                      <span key={idx} className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Matched Jobs Section */}
          {jobs.length > 0 && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Matched Job Openings ({filteredJobs.length})
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Ranked by ATS keyword match and skill overlap with your uploaded resume
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-card)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('ALL')}
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: typeFilter === 'ALL' ? 'var(--primary)' : 'transparent',
                        color: typeFilter === 'ALL' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      All Roles
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('INTERNSHIP')}
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: typeFilter === 'INTERNSHIP' ? 'var(--accent-rose)' : 'transparent',
                        color: typeFilter === 'INTERNSHIP' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      🎓 Internships Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('FULLTIME')}
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: typeFilter === 'FULLTIME' ? 'var(--primary)' : 'transparent',
                        color: typeFilter === 'FULLTIME' ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      💼 Full-Time
                    </button>
                  </div>

                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Filter by title, skill..."
                      value={jobSearchFilter}
                      onChange={(e) => setJobSearchFilter(e.target.value)}
                      style={{ width: '100%', height: '34px', paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Jobs Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredJobs.map((job) => {
                  const isSaved = bookmarkedMap.has(job.id);
                  const isExpanded = expandedJobId === job.id;

                  return (
                    <div
                      key={job.id}
                      className="card"
                      style={{
                        padding: '1.5rem',
                        transition: 'border-color 0.15s ease',
                        border: isSaved ? '1px solid var(--primary)' : '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                              {job.company}
                            </span>
                            {job.location && (
                              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={13} />
                                {job.location}
                              </span>
                            )}
                            {job.salary && (
                              <span className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                                {job.salary}
                              </span>
                            )}
                            {job.source && (
                              <span style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--primary-light)',
                                color: 'var(--primary)',
                                border: '1px solid var(--primary-border)',
                                letterSpacing: '0.02em'
                              }}>
                                via {job.source}
                              </span>
                            )}
                            {(job.employment_type === 'INTERNSHIP' || job.title?.toLowerCase().includes('intern')) && (
                              <span style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                                color: '#f472b6',
                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                letterSpacing: '0.02em'
                              }}>
                                🎓 Internship
                              </span>
                            )}
                          </div>

                          <h4 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {job.title}
                          </h4>

                          {/* Skills Overview */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                            {job.matched_skills?.slice(0, 5).map((s, idx) => (
                              <span key={idx} className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                                ✓ {s}
                              </span>
                            ))}
                            {job.missing_skills?.slice(0, 3).map((s, idx) => (
                              <span key={idx} className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>
                                + {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Match Score & Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            textAlign: 'center',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: job.fit_score >= 80 ? 'var(--success-light)' : 'var(--primary-light)',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${job.fit_score >= 80 ? 'var(--success-border)' : 'var(--primary-border)'}`
                          }}>
                            <div style={{
                              fontSize: '1.125rem',
                              fontWeight: 700,
                              color: job.fit_score >= 80 ? 'var(--success-text)' : 'var(--primary)'
                            }}>
                              {job.fit_score || 75}%
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>ATS Fit</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleBookmark(job)}
                            className={isSaved ? 'btn-primary' : 'btn-secondary'}
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
                            title={isSaved ? 'Remove from saved' : 'Save job to pipeline'}
                          >
                            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                          </button>

                          {job.url && (
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary"
                              style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem', textDecoration: 'none' }}
                            >
                              <span>Apply</span>
                              <ExternalLink size={13} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                            className="btn-secondary"
                            style={{ padding: '0.5rem' }}
                            title="Toggle detailed ATS view"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable ATS Alignment Details */}
                      {isExpanded && (
                        <div style={{
                          borderTop: '1px solid var(--border-light)',
                          marginTop: '1.25rem',
                          paddingTop: '1.25rem',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1rem' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Matched Keywords in Resume:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {job.matched_skills?.map((s, idx) => (
                                  <span key={idx} className="badge badge-success">{s}</span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Missing High-Value Keywords:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {job.missing_skills?.map((s, idx) => (
                                  <span key={idx} className="badge badge-warning">{s}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {job.ats_advice && (
                            <div style={{
                              padding: '0.875rem 1rem',
                              backgroundColor: 'rgba(79, 70, 229, 0.04)',
                              border: '1px solid rgba(79, 70, 229, 0.2)',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--text-secondary)'
                            }}>
                              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>ATS Recommendation: </span>
                              {job.ats_advice}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search on More Platforms Section */}
          {platformLinks.length > 0 && jobs.length > 0 && (
            <div className="card" style={{ padding: '1.75rem', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(236, 72, 153, 0.12))',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <Globe size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Explore on More Platforms
                  </h3>
                </div>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem', marginLeft: '2.625rem' }}>
                Pre-filtered search links based on your resume skills — click to open directly on each platform
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '0.75rem'
              }}>
                {platformLinks.map((platform, idx) => (
                  <a
                    key={idx}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-card)',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = platform.color;
                      e.currentTarget.style.boxShadow = `0 0 0 1px ${platform.color}22, 0 4px 12px ${platform.color}15`;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: `${platform.color}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: platform.color
                      }}>
                        {platform.name.charAt(0)}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.3
                      }}>
                        {platform.name}
                      </div>
                      <div style={{
                        fontSize: '0.6875rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.3
                      }}>
                        Search jobs →
                      </div>
                    </div>
                    <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty State when no search run yet */}
          {jobs.length === 0 && !loading && (
            <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Briefcase size={24} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                No active resume evaluation yet
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto' }}>
                Upload your resume in PDF format above and click "Search & Match Jobs" to parse your competencies and view ATS compatibility with open tech positions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Saved Pipeline */}
      {activeTab === 'pipeline' && (
        <div>
          {/* Pipeline Stage Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {['ALL', ...STAGE_OPTIONS].map((stage) => {
              const count = stage === 'ALL'
                ? bookmarks.length
                : bookmarks.filter((b) => b.status?.toUpperCase() === stage.toUpperCase()).length;
              const isActive = pipelineFilter === stage;

              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setPipelineFilter(stage)}
                  className={isActive ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {stage} ({count})
                </button>
              );
            })}
          </div>

          {filteredBookmarks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredBookmarks.map((bookmark) => (
                <div key={bookmark._id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        {bookmark.company} • {bookmark.location || 'Remote'}
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {bookmark.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <select
                        value={bookmark.status || 'Saved'}
                        onChange={(e) => handleUpdateStage(bookmark._id, e.target.value)}
                        style={{
                          height: '34px',
                          padding: '0 0.75rem',
                          fontSize: '0.8125rem',
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        {STAGE_OPTIONS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>

                      {(bookmark.applyLink || bookmark.url) && (
                        <a
                          href={bookmark.applyLink || bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.delete(`/jobs/bookmark/${bookmark._id}`);
                            setBookmarks((prev) => prev.filter((b) => b._id !== bookmark._id));
                            toast.success('Removed bookmark');
                          } catch {
                            toast.error('Failed to remove bookmark.');
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error-text)',
                          cursor: 'pointer',
                          padding: '0.45rem'
                        }}
                        title="Delete from pipeline"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Bookmark size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                No jobs saved in this pipeline category
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Bookmark matched positions from your resume search to track application stages.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div>
          {historySessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {historySessions.map((hist) => (
                <div key={hist._id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(hist.searchedAt).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                        {hist.parsedProfile?.current_role || hist.parsedProfile?.name || 'Resume Search'}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        {hist.results?.length || 0} jobs evaluated
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setParsedProfile(normalizeProfile(hist.parsedProfile));
                        setJobs((hist.results || []).map((j, idx) => normalizeJob(j, idx)));
                        setActiveTab('search');
                        toast.success('Loaded past search evaluation');
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.45rem 0.875rem', fontSize: '0.8125rem' }}
                    >
                      View Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Clock size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                No evaluation history recorded yet
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Past resume ATS evaluations will appear here for quick review.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
