import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';
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
  FileCheck
} from 'lucide-react';

const JobSearchPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [parsedProfile, setParsedProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  // Filters & sorting
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'date'
  const [filterType, setFilterType] = useState('ALL');
  const [expandedJobId, setExpandedJobId] = useState(null);

  const loadingMessages = [
    'Parsing resume text with pdfplumber...',
    'Extracting candidate skills and experience using Llama 3.3 70B (Groq)...',
    'Generating 5 optimized role queries for live job APIs...',
    'Fetching live real-time job openings...',
    'Evaluating candidate match scores and gap analysis concurrently...'
  ];

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

    try {
      const res = await api.post('/jobs/search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setParsedProfile(res.data.parsed_profile || {});
      setJobs(res.data.results || []);
    } catch (err) {
      console.error('Job search error:', err);
      setError(err.response?.data?.error || 'Multi-agent job search failed. Verify RapidAPI key and PDF contents.');
    } finally {
      setLoading(false);
    }
  };

  // Filter & sort jobs
  let processedJobs = [...jobs];
  if (filterType !== 'ALL') {
    processedJobs = processedJobs.filter(j => (j.employment_type || '').toUpperCase().includes(filterType));
  }
  if (sortBy === 'match') {
    processedJobs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  } else {
    processedJobs.sort((a, b) => new Date(b.posted_at || 0) - new Date(a.posted_at || 0));
  }

  const getMatchScoreBadge = (score) => {
    if (score >= 80) return <span className="badge badge-low">{score}% Match</span>;
    if (score >= 60) return <span className="badge badge-medium">{score}% Match</span>;
    return <span className="badge badge-high">{score}% Match</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Navbar title="Multi-Agent Job Search" subtitle="Autonomous resume parsing, live JSearch query building, and JD compatibility matching" />

      <div className="page-container">
        {/* Upload Screen */}
        {!searchInitiated && !loading && (
          <div className="glass-panel" style={{ maxWidth: '650px', margin: '3rem auto', padding: '2.5rem', textAlign: 'center' }}>
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
                  padding: '3rem 2rem',
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

              <button
                type="submit"
                className="btn-gradient"
                disabled={!file}
                style={{ width: '100%', fontSize: '0.95rem' }}
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
            {/* Header & Reset */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Found {jobs.length} matching openings</span>
                <h2 style={{ fontSize: '1.6rem' }}>Candidate Intelligence & Matches</h2>
              </div>
              <button
                onClick={() => { setJobs([]); setFile(null); setParsedProfile(null); setSearchInitiated(false); setError(''); }}
                className="btn-secondary"
              >
                <RotateCcw size={16} />
                <span>Search Another Resume</span>
              </button>
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
                return (
                  <div key={job.job_id} className="glass-card" style={{ padding: '1.75rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                          <h3 style={{ fontSize: '1.2rem' }}>{job.title}</h3>
                          {getMatchScoreBadge(job.match_score)}
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
      </div>
    </div>
  );
};

export default JobSearchPage;
