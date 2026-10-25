import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  MoreVertical,
  FileText,
  Download,
  Trash2,
  Eye,
  X,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Github,
  BookOpen,
  Briefcase,
  GitPullRequest,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  exportUniversalReportPdf,
  downloadFile
} from '../../utils/exportUtils';

const ReportsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports');
      const apiReports = res.data?.reports || (Array.isArray(res.data) ? res.data : []);
      // Also get local saved reports if any
      const local = JSON.parse(localStorage.getItem('innovatex_saved_reports') || '[]');
      const combined = [...local, ...apiReports];
      setReports(combined);
    } catch (err) {
      console.warn('Reports API load warning:', err.message);
      const local = JSON.parse(localStorage.getItem('innovatex_saved_reports') || '[]');
      setReports(local);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const rType = (report.type || '').toLowerCase();
      const fType = typeFilter.toLowerCase();
      const matchesType =
        typeFilter === 'All' ||
        rType === fType ||
        (fType === 'github' && (rType.includes('git') || rType.includes('profile'))) ||
        (fType === 'jobs' && (rType.includes('job') || rType.includes('resume') || rType.includes('ats'))) ||
        (fType === 'opensource' && (rType.includes('open') || rType.includes('issue') || rType.includes('oss') || rType.includes('guide'))) ||
        (fType === 'research' && (rType.includes('research') || rType.includes('paper')));

      const matchesSearch =
        !search ||
        report.title?.toLowerCase().includes(search.toLowerCase()) ||
        report.type?.toLowerCase().includes(search.toLowerCase()) ||
        report.categoryLabel?.toLowerCase().includes(search.toLowerCase()) ||
        (report.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));

      return matchesType && matchesSearch;
    });
  }, [reports, typeFilter, search]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setReports((prev) => prev.filter((r) => r.id !== id));
    // update localStorage
    try {
      const local = JSON.parse(localStorage.getItem('innovatex_saved_reports') || '[]');
      const updated = local.filter((r) => r.id !== id);
      localStorage.setItem('innovatex_saved_reports', JSON.stringify(updated));
    } catch {}
    setActiveMenuId(null);
    if (selectedReport?.id === id) setSelectedReport(null);
    toast.success('Report removed');
  };

  const handleExport = (report, format, e) => {
    if (e) e.stopPropagation();
    setActiveMenuId(null);
    if (!report) return;
    try {
      if (format === 'markdown') {
        const payload = report.rawData || report.data || {};
        let content = `# ${report.title}\n\n`;
        content += `- **Category:** ${report.categoryLabel || report.type}\n`;
        content += `- **Generated:** ${new Date(report.createdAt || Date.now()).toUTCString()}\n`;
        if (report.score !== null && report.score !== undefined) {
          content += `- **Score Assessment:** ${report.score} ${report.scoreLabel || ''}\n`;
        }
        if (report.summary) {
          content += `\n## Executive Summary\n${report.summary}\n`;
        }
        if (Array.isArray(report.metrics) && report.metrics.length > 0) {
          content += `\n## Key Metrics\n`;
          report.metrics.forEach((m) => {
            content += `- **${m.label}:** ${m.value}\n`;
          });
        }
        if (Array.isArray(report.tags) && report.tags.length > 0) {
          content += `\n**Tags:** ${report.tags.join(', ')}\n`;
        }
        content += `\n## Analytical Payload Data\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n`;

        downloadFile(`${report.title.slice(0, 35).replace(/[^a-zA-Z0-9_-]/g, '_')}.md`, content);
        toast.success('Downloaded Markdown report');
      } else {
        // True PDF export via universal institutional print engine
        exportUniversalReportPdf(report);
        toast.success('Generated PDF document');
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed');
    }
  };

  const getTypeBadgeClass = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('git')) return 'badge-primary';
    if (t.includes('job') || t.includes('resume')) return 'badge-success';
    if (t.includes('research') || t.includes('paper')) return 'badge-warning';
    if (t.includes('open') || t.includes('issue') || t.includes('oss')) return 'badge-info';
    return 'badge-gray';
  };

  return (
    <div className="page-container fade-in" onClick={() => setActiveMenuId(null)}>
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
            Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Saved analyses, summaries, and generated guides
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.125rem',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <Plus size={16} />
          <span>New analysis</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        {/* Type Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                paddingLeft: '0.875rem',
                paddingRight: '2.25rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              <option value="All">All Types</option>
              <option value="github">GitHub Intelligence</option>
              <option value="jobs">Job Match & ATS</option>
              <option value="opensource">Open Source</option>
              <option value="research">Research Synthesis</option>
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-muted)'
              }}
            />
          </div>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '2.35rem',
              paddingRight: '0.875rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Reports Table (Banani UI layout) */}
      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th style={{ width: '55%' }}>Title</th>
              <th style={{ width: '20%' }}>Type</th>
              <th style={{ width: '18%' }}>Created</th>
              <th style={{ width: '7%', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {report.title}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getTypeBadgeClass(report.type)}`}>
                      {report.categoryLabel || report.type}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === report.id ? null : report.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        padding: '0.35rem',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === report.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '2.25rem',
                          zIndex: 50,
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-dropdown)',
                          minWidth: '150px',
                          padding: '0.35rem 0',
                          textAlign: 'left'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReport(report);
                            setActiveMenuId(null);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.875rem',
                            fontSize: '0.8125rem',
                            color: 'var(--text-primary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <Eye size={14} />
                          <span>View details</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleExport(report, 'pdf', e)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.875rem',
                            fontSize: '0.8125rem',
                            color: 'var(--text-primary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <Download size={14} />
                          <span>Export PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleExport(report, 'markdown', e)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.875rem',
                            fontSize: '0.8125rem',
                            color: 'var(--text-primary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <FileText size={14} />
                          <span>Export Markdown</span>
                        </button>

                        <div style={{ borderTop: '1px solid var(--border-light)', margin: '0.25rem 0' }} />

                        <button
                          type="button"
                          onClick={(e) => handleDelete(report.id, e)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.875rem',
                            fontSize: '0.8125rem',
                            color: 'var(--error-text)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No reports match your selected filters.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Report Preview Drawer / Modal */}
      {selectedReport && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            height: '100%',
            backgroundColor: 'var(--bg-card)',
            borderLeft: '1px solid var(--border)',
            boxShadow: 'var(--shadow-dropdown)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Drawer Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span className={`badge ${getTypeBadgeClass(selectedReport.type)}`} style={{ marginBottom: '0.35rem' }}>
                  {selectedReport.categoryLabel || selectedReport.type}
                </span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedReport.title}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Generated on {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString() : 'Recent'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {(() => {
                const raw = selectedReport.rawData || selectedReport.data || {};
                const rType = (selectedReport.type || '').toLowerCase();
                const isGithub = rType === 'github' || rType.includes('git');
                const isJobs = rType === 'jobs' || rType.includes('job') || rType.includes('resume');
                const isResearch = rType === 'research' || rType.includes('research') || rType.includes('paper');
                const isOpenSource = rType === 'opensource' || rType.includes('open') || rType.includes('issue') || rType.includes('oss');

                if (isGithub) {
                  const score = selectedReport.score ?? raw.overallScore ?? raw.overall_score ?? 84;
                  const tier = raw.tier || (score >= 85 ? 'Elite' : score >= 70 ? 'Strong' : 'Developing');
                  const suggestions = raw.recommendations || raw.suggestions || [];
                  const repos = raw.repositories || raw.best_repos || [];

                  return (
                    <div>
                      <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GitHub Audit Score</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Tier: {tier}</div>
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {score}/100
                        </span>
                      </div>

                      {suggestions.length > 0 && (
                        <>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                            Improvement Recommendations
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
                            {suggestions.map((item, idx) => {
                              const text = typeof item === 'string' ? item : (item.title || item.action || item.issue);
                              return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                  <CheckCircle2 size={15} style={{ color: 'var(--primary)', marginTop: '0.2rem', flexShrink: 0 }} />
                                  <span>{text}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      {repos.length > 0 && (
                        <>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                            Audited Repositories
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {repos.slice(0, 6).map((r, idx) => (
                              <div key={idx} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{r.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.language || 'N/A'} • {r.stars || r.stargazers_count || 0} stars</div>
                                </div>
                                <span className={`badge ${r.hasReadme || r.stars > 0 ? 'badge-success' : 'badge-warning'}`}>
                                  {r.hasReadme ? 'README Present' : 'Inspected'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }

                if (isJobs) {
                  const prof = raw.parsedProfile || {};
                  const results = raw.results || raw.jobs || [];
                  const score = selectedReport.score ?? (results.length > 0 ? Math.max(...results.map(r => r.match_score || 0)) : 78);
                  const matched = raw.matchedKeywords || prof.skills || [];
                  const missing = raw.missingKeywords || [];
                  const recs = raw.recommendations || [];

                  return (
                    <div>
                      <div style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.25rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Match Score</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {score}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {prof.current_role || prof.target_role || raw.role || 'Software Engineer'} {raw.company ? `at ${raw.company}` : ''}
                        </div>
                      </div>

                      {matched.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.625rem' }}>
                            Matched Skills & Keywords
                          </h3>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {matched.map((kw, i) => (
                              <span key={i} className="badge badge-success">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {missing.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.625rem' }}>
                            Missing Market Keywords
                          </h3>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {missing.map((kw, i) => (
                              <span key={i} className="badge badge-warning">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {results.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.625rem' }}>
                            Top Matching Openings ({results.length})
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {results.slice(0, 4).map((j, i) => (
                              <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{j.title}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{j.company} • {j.location || 'Remote'}</div>
                                </div>
                                <span className="badge badge-primary">{j.fit_score || j.match_score || 80}% Fit</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {recs.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.625rem' }}>
                            ATS Recommendations
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {recs.map((rec, i) => (
                              <div key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                • {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                if (isResearch) {
                  const exp = raw.explanation || {};
                  const authors = Array.isArray(raw.authors) ? raw.authors.join(', ') : (raw.authors || 'Unknown');
                  const contributions = exp.key_contributions || exp.key_innovations || raw.keyContributions || [];
                  const summary = exp.simple_summary || exp.tldr || exp.what_problem_it_solves || raw.summary || selectedReport.summary;

                  return (
                    <div>
                      <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.25rem'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ArXiv Identifier: {raw.paper_id || 'Research Paper'}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Authors: {authors}</div>
                      </div>

                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Executive Summary
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                        {summary}
                      </p>

                      {contributions.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Key Innovations & Contributions
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {contributions.map((item, idx) => (
                              <div key={idx} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                • {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                if (isOpenSource) {
                  const guide = raw.data?.guide || raw.data?.review || raw.guide || raw.review || raw.data || raw;
                  const isReview = raw.actionType === 'review' || !!(guide?.feedback && guide?.score !== undefined);

                  return (
                    <div>
                      {/* Blueprint or Review Status Header */}
                      <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Repository</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {raw.repoName || 'Open Source Project'} {raw.issueNumber ? `#${raw.issueNumber}` : ''}
                          </div>
                        </div>
                        <span className="badge badge-info">
                          {raw.preferredLanguage || raw.skills?.[0] || 'Open Source'}
                        </span>
                      </div>

                      {/* Code Review Mode */}
                      {isReview && guide ? (
                        <div>
                          {guide.score !== undefined && (
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Code Quality Score</div>
                              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {guide.score} / 100
                              </div>
                            </div>
                          )}

                          {guide.feedback && (
                            <div style={{ marginBottom: '1.25rem' }}>
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Architectural Critique & Feedback
                              </h3>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {guide.feedback}
                              </p>
                            </div>
                          )}

                          {guide.security_notes && (
                            <div style={{ marginBottom: '1.25rem' }}>
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem' }}>
                                Security & Defensive Engineering
                              </h3>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {guide.security_notes}
                              </p>
                            </div>
                          )}

                          {guide.suggested_diff && (
                            <div style={{ marginBottom: '1.25rem' }}>
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Recommended Code Patch
                              </h3>
                              <pre style={{
                                padding: '0.875rem',
                                backgroundColor: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.78rem',
                                overflowX: 'auto',
                                color: '#10b981',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {guide.suggested_diff}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Contribution Blueprint Mode */
                        <div>
                          {(guide?.setup_steps?.length > 0 || guide?.setupCommand) && (
                            <div style={{ marginBottom: '1.25rem' }}>
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Reproduction & Environment Setup
                              </h3>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {(guide.setup_steps || [guide.setupCommand]).map((s, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      padding: '0.5rem 0.75rem',
                                      backgroundColor: 'var(--bg-subtle)',
                                      border: '1px solid var(--border)',
                                      borderRadius: 'var(--radius-sm)',
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '0.8125rem'
                                    }}
                                  >
                                    {s}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(guide?.files_to_edit?.length > 0 || guide?.likelyFiles?.length > 0) && (
                            <div style={{ marginBottom: '1.25rem' }}>
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Target Files to Edit
                              </h3>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(guide.files_to_edit || guide.likelyFiles).map((f, i) => {
                                  const path = typeof f === 'string' ? f : (f.file_path || f.file || f.name);
                                  const reason = typeof f === 'object' ? f.reason : null;
                                  return (
                                    <div key={i} style={{ padding: '0.625rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                                      <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                                        {path}
                                      </div>
                                      {reason && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          {reason}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {guide?.implementation_hints?.length > 0 && (
                            <div style={{ marginBottom: '1.25rem' }}>
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Implementation Hints
                              </h3>
                              <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                                {guide.implementation_hints.map((h, i) => (
                                  <li key={i}>{h}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {guide?.pr_template && (
                            <div style={{ marginBottom: '1.25rem' }}>
                              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Pull Request Template
                              </h3>
                              <pre style={{
                                padding: '0.875rem',
                                backgroundColor: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.78rem',
                                overflowX: 'auto',
                                color: 'var(--text-secondary)',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {guide.pr_template}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                // Universal Fallback for Any Other Report
                return (
                  <div>
                    {selectedReport.summary && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Summary
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {selectedReport.summary}
                        </p>
                      </div>
                    )}

                    {Array.isArray(selectedReport.metrics) && selectedReport.metrics.length > 0 && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Metrics
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                          {selectedReport.metrics.map((m, idx) => (
                            <div key={idx} style={{ padding: '0.625rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.label}</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(selectedReport.tags) && selectedReport.tags.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          Tags
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {selectedReport.tags.map((t, i) => (
                            <span key={i} className="badge badge-gray">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Drawer Footer Actions */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={(e) => handleExport(selectedReport, 'markdown', e)}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
              >
                <FileText size={14} />
                <span>Markdown</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleExport(selectedReport, 'pdf', e)}
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Analysis Action Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Create New Analysis
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => navigate('/profile?tab=github')}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem', padding: '0.875rem' }}
              >
                <Github size={18} style={{ color: 'var(--primary)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Audit GitHub Profile</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan repos, READMEs, topics, and code quality</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/profile?tab=resume')}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem', padding: '0.875rem' }}
              >
                <Briefcase size={18} style={{ color: 'var(--success)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Resume ATS Fit Check</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload resume PDF and match against job descriptions</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/research')}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem', padding: '0.875rem' }}
              >
                <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Synthesize arXiv Research Paper</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Break down preprints into summaries and takeaways</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/opportunities?tab=opensource')}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem', padding: '0.875rem' }}
              >
                <GitPullRequest size={18} style={{ color: 'var(--warning)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Open Source Contribution Guide</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Step-by-step setup and file modification blueprints</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
