import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  Star,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Search,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  AlertCircle,
  FileText,
  ChevronRight,
  Terminal,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  Filter
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SKILL_OPTIONS = ['TypeScript', 'Python', 'React', 'Go', 'Rust', 'Docker', 'Node.js', 'FastAPI', 'Java', 'C++'];

export default function OpenSourcePage() {
  const toast = useToast();
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [error, setError] = useState(null);

  // Filters
  const [selectedSkills, setSelectedSkills] = useState(['TypeScript', 'Python', 'React']);
  const [difficulty, setDifficulty] = useState('good-first-issue'); // all, good-first-issue, intermediate, high-impact
  const [search, setSearch] = useState('');

  // Code reviewer tool
  const [codeDiff, setCodeDiff] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);

  // Bookmarking & Copy
  const [bookmarkedUrls, setBookmarkedUrls] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleScanIssues = async () => {
    if (selectedSkills.length === 0) {
      toast.error('Select at least one skill to search for issues.');
      return;
    }

    setScanning(true);
    setError(null);
    try {
      const preferred = selectedSkills[0]?.toLowerCase() || 'typescript';
      const res = await api.post('/opensource/find', {
        skills: selectedSkills,
        experience_level: difficulty === 'good-first-issue' ? 'beginner' : difficulty === 'high-impact' ? 'advanced' : 'intermediate',
        preferred_language: preferred
      });

      const items = Array.isArray(res.data) ? res.data : [];
      if (items.length > 0) {
        const formatted = items.map((item, idx) => ({
          repo_name: item.repo_name || item.repo || 'open-source/project',
          issue_number: item.issue_number || item.number || (1000 + idx),
          issue_title: item.issue_title || item.title || 'Improve module performance and test coverage',
          issue_url: item.issue_url || item.html_url || `https://github.com/${item.repo_name || 'project'}/issues/${item.issue_number || idx}`,
          language: item.language || preferred,
          repo_stars: item.repo_stars || item.stars || 1200,
          match_score: item.match_score || 90,
          tag: difficulty !== 'all' ? difficulty : 'good-first-issue',
          guide: item.guide || null
        }));
        setIssues(formatted);
        setSelectedIssue(formatted[0]);
        toast.success(`Found ${formatted.length} live issues on GitHub matching your skills`);
      } else {
        toast.info('No new issues found matching current filters. Try selecting different languages.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      const msg = err.response?.data?.error || err.message || 'Live GitHub scan failed. Check connection.';
      setError(msg);
      toast.error(msg);
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateGuide = async (issue) => {
    setGeneratingId(issue.issue_number);
    try {
      const res = await api.post('/opensource/guide', {
        issue_url: issue.issue_url,
        repo_name: issue.repo_name,
        issue_number: issue.issue_number,
        issue_title: issue.issue_title
      });

      if (res.data) {
        const g = res.data;
        const newGuide = {
          setup_command: g.setup_steps?.[0] || `git clone https://github.com/${issue.repo_name}.git && cd ${issue.repo_name.split('/')[1] || ''}`,
          files_to_edit: (g.files_to_edit || []).map((f) => ({
            file_path: f.file_path || 'src/index.ts',
            diff_desc: f.reason || f.what_to_change || 'Update component logic'
          })),
          maintainer_rule: g.things_to_avoid?.[0] || 'Maintainer Rule: Run full unit test suite before creating pull request.',
          pr_title: g.pr_title_suggestion || `fix(${issue.language.toLowerCase()}): resolve ${issue.issue_title.slice(0, 30)} (#${issue.issue_number})`,
          pr_desc: g.pr_description_template || `### Summary of Changes\n- Fixes issue #${issue.issue_number}\n- Adds unit test coverage.`
        };

        const enriched = { ...issue, guide: newGuide };
        setIssues((prev) => prev.map((item) => (item.issue_number === issue.issue_number ? enriched : item)));
        setSelectedIssue(enriched);
        toast.success('PR Contribution Blueprint generated');
      }
    } catch (err) {
      console.error('Failed to generate blueprint:', err);
      toast.error('Failed to generate blueprint for this issue.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleBookmark = async (issue) => {
    const issueUrl = issue.issue_url || issue.url;
    if (!issueUrl) return;
    const isBookmarked = !!bookmarkedUrls[issueUrl];
    setBookmarkedUrls((prev) => ({ ...prev, [issueUrl]: !isBookmarked }));
    try {
      const payload = {
        issue_url: issueUrl,
        repo_name: issue.repo_name || issue.repo || 'repository',
        issue_title: issue.title || issue.issue_title || 'Open Source Issue',
        issue_number: issue.number || issue.issue_number,
        metadata: issue
      };
      await api.post('/opensource/bookmark', payload);
      toast.success(isBookmarked ? 'Bookmark removed' : 'Saved to bookmarks');
    } catch (err) {
      console.warn('Bookmark warning:', err.message);
      setBookmarkedUrls((prev) => ({ ...prev, [issueUrl]: isBookmarked }));
      toast.error('Failed to update bookmark');
    }
  };

  const handleReviewCode = async (e) => {
    e.preventDefault();
    if (!codeDiff.trim()) {
      toast.error('Please paste code or diff to review.');
      return;
    }
    if (!selectedIssue) {
      toast.error('Please select an issue first.');
      return;
    }

    setReviewing(true);
    setReviewResult(null);
    try {
      const res = await api.post('/opensource/review', {
        user_code: codeDiff.trim(),
        issue_url: selectedIssue.issue_url,
        original_code: ''
      });
      setReviewResult(res.data);
      toast.success('Code review complete');
    } catch (err) {
      console.error('Review error:', err);
      toast.error(err.response?.data?.error || 'PR code review failed.');
    } finally {
      setReviewing(false);
    }
  };

  const filteredIssues = issues.filter((issue) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      issue.issue_title?.toLowerCase().includes(term) ||
      issue.repo_name?.toLowerCase().includes(term) ||
      issue.language?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container fade-in">
      {/* Top Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '0.35rem' }}>
          Open Source Contributor
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Find active GitHub issues matching your skills, generate step-by-step PR blueprints, and verify diffs with AI code reviews
        </p>
      </div>

      {/* Skill & Search Controls Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Skill Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Select Languages & Frameworks:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {SKILL_OPTIONS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={isSelected ? 'btn-primary' : 'btn-secondary'}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty and Scan Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ height: '38px', padding: '0 0.875rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)' }}
              >
                <option value="good-first-issue">Good First Issue (Beginner)</option>
                <option value="intermediate">Intermediate Features</option>
                <option value="high-impact">High Impact / Advanced</option>
                <option value="all">All Difficulty Levels</option>
              </select>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter issues..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', height: '38px', paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleScanIssues}
              disabled={scanning}
              className="btn-primary"
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {scanning ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              <span>{scanning ? 'Scanning GitHub...' : 'Find GitHub Issues'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error alert */}
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

      {/* Main Two-Column View: Issues List (Left) + PR Blueprint & Reviewer (Right) */}
      {issues.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 420px) 1fr',
          gap: '1.75rem',
          alignItems: 'flex-start'
        }}>
          {/* Left: Issues List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Showing {filteredIssues.length} issues
            </div>

            {filteredIssues.map((issue) => {
              const isSelected = selectedIssue?.issue_number === issue.issue_number;
              const isBookmarked = !!bookmarkedUrls[issue.issue_url];

              return (
                <div
                  key={issue.issue_number}
                  onClick={() => setSelectedIssue(issue)}
                  className="card"
                  style={{
                    padding: '1.125rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-gray" style={{ fontSize: '0.6875rem', fontWeight: 600 }}>
                        {issue.language}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ★ {issue.repo_stars?.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(issue);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isBookmarked ? 'var(--primary)' : 'var(--text-muted)', padding: '0.2rem' }}
                      title="Bookmark"
                    >
                      {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {issue.repo_name} #{issue.issue_number}
                  </div>

                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                    {issue.issue_title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <a
                      href={issue.issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                    >
                      <span>View on GitHub</span>
                      <ExternalLink size={12} />
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateGuide(issue);
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      {generatingId === issue.issue_number ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Blueprint</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Issue Guide & PR Code Reviewer */}
          {selectedIssue && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Issue Details & Blueprint Card */}
              <div className="card" style={{ padding: '1.75rem', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-primary">{selectedIssue.language}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{selectedIssue.repo_name}</span>
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {selectedIssue.issue_title}
                    </h2>
                  </div>

                  <a
                    href={selectedIssue.issue_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
                  >
                    <span>Open GitHub</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* Blueprint details */}
                {selectedIssue.guide ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Setup Command */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        1. Clone & Branch Setup
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-subtle)', padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <code style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                          {selectedIssue.guide.setup_command}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedIssue.guide.setup_command, 'setup')}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          {copiedKey === 'setup' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Files to Edit */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        2. Target Files to Modify
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedIssue.guide.files_to_edit?.map((f, i) => (
                          <div key={i} style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
                              {f.file_path}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              {f.diff_desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Maintainer Rule */}
                    <div style={{
                      padding: '0.875rem 1rem',
                      backgroundColor: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <span style={{ fontWeight: 600, color: '#d97706' }}>Maintainer Rule: </span>
                      {selectedIssue.guide.maintainer_rule}
                    </div>

                    {/* Suggested PR Title & Description */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        3. Suggested PR Description
                      </div>
                      <div style={{ position: 'relative' }}>
                        <pre style={{
                          padding: '0.875rem',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.8125rem',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5,
                          color: 'var(--text-primary)'
                        }}>
                          {selectedIssue.guide.pr_desc}
                        </pre>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedIssue.guide.pr_desc, 'pr-desc')}
                          className="btn-secondary"
                          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          {copiedKey === 'pr-desc' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Generate an actionable contribution blueprint with exact git setup commands, target files to edit, and PR description template.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleGenerateGuide(selectedIssue)}
                      disabled={generatingId === selectedIssue.issue_number}
                      className="btn-primary"
                      style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}
                    >
                      {generatingId === selectedIssue.issue_number ? 'Generating Blueprint...' : 'Generate PR Blueprint'}
                    </button>
                  </div>
                )}
              </div>

              {/* PR Code Reviewer Tool */}
              <div className="card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Pre-PR Code Reviewer
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Paste your code changes or diff to evaluate architecture cleanliness, edge cases, and maintainer standards before submitting.
                </p>

                <form onSubmit={handleReviewCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <textarea
                    rows={6}
                    placeholder="Paste your diff or updated function code here..."
                    value={codeDiff}
                    onChange={(e) => setCodeDiff(e.target.value)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8125rem',
                      lineHeight: 1.5,
                      padding: '0.875rem',
                      width: '100%'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={reviewing || !codeDiff.trim()}
                      className="btn-primary"
                      style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {reviewing ? <Loader2 size={14} className="animate-spin" /> : <Code2 size={14} />}
                      <span>{reviewing ? 'Analyzing Code Changes...' : 'Review My Code'}</span>
                    </button>
                  </div>
                </form>

                {/* Review Results */}
                {reviewResult && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        AI PR Review Feedback
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                      {reviewResult.overall_feedback || reviewResult.feedback || JSON.stringify(reviewResult)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="card" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
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
            <GitPullRequest size={24} />
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Find Open Source Issues on GitHub
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Select your preferred programming languages above and click "Find GitHub Issues" to discover beginner-friendly and high-impact issues ready for your contribution.
          </p>
          <button
            type="button"
            onClick={handleScanIssues}
            disabled={scanning}
            className="btn-primary"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            <span>{scanning ? 'Scanning...' : 'Scan GitHub Issues'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
