import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  GitPullRequest,
  Star,
  ExternalLink,
  ChevronRight,
  Code,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  AlertCircle,
  FileCode2,
  FileText,
  Terminal,
  FolderOpen,
  Lightbulb,
  CheckCircle2,
  ThumbsUp,
  Info,
  Bookmark,
  BookmarkCheck,
  History,
  Printer,
  Search,
  X,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BookOpen,
  GitFork,
  GitBranch,
  ShieldCheck,
  Play,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { exportOpenSourceGuidePdf } from '../../utils/exportUtils';
import EmptyState from '../../components/common/EmptyState';

const SKILL_OPTIONS = [
  'TypeScript', 'React', 'Node.js', 'Python', 'Go',
  'Rust', 'Docker', 'FastAPI', 'GraphQL', 'PostgreSQL', 'JavaScript'
];

const CONTRIBUTION_FLOW_STEPS = [
  {
    step: '01',
    title: 'Triage & Match',
    subtitle: 'Find verified issue',
    token: 'tag: good-first-issue',
    icon: GitPullRequest,
    summary: 'Identify an issue tagged "good first issue" where problem reproduction and scope are clearly defined.',
    commands: [
      '# Query GitHub for active beginner issues',
      'gh issue list --label "good first issue" --state open'
    ],
    rule: 'Rule: Confirm with maintainers by commenting on the issue before writing code to prevent duplicate work.'
  },
  {
    step: '02',
    title: 'Hermetic Setup',
    subtitle: 'Fork & upstream clone',
    token: 'git remote upstream',
    icon: GitFork,
    summary: 'Fork the repository to your account, clone locally, and add the original project as upstream remote.',
    commands: [
      'git clone https://github.com/YOUR_USER/project.git',
      'cd project && git remote add upstream https://github.com/ORIGINAL_OWNER/project.git',
      'git checkout -b fix/issue-number-short-desc'
    ],
    rule: 'Rule: Always branch from latest upstream/main to avoid merge conflicts later.'
  },
  {
    step: '03',
    title: 'Repro Test',
    subtitle: 'Failing test first',
    token: 'pytest -k test_repro',
    icon: Terminal,
    summary: 'Write a targeted unit test that triggers the exact bug reported. Confirm it fails (Red stage) before editing code.',
    commands: [
      '# Run reproduction test (must fail initially)',
      'pytest tests/analyzers/test_dead_code.py -k "test_docs_unreachable"',
      'npm test -- -t "should ignore docs examples"'
    ],
    rule: 'Rule: If you cannot reproduce the bug with a test case, maintainers cannot verify your fix.'
  },
  {
    step: '04',
    title: 'Surgical Patch',
    subtitle: 'Target AST files only',
    token: 'zero diff pollution',
    icon: Code,
    summary: 'Implement the fix touching only the required source files. Avoid formatting untouched files or reordering imports.',
    commands: [
      '# Inspect git diff to ensure zero unrelated changes',
      'git diff --stat',
      'git status'
    ],
    rule: 'Rule: Maintainers reject PRs with noisy diffs or unrelated auto-formatting changes.'
  },
  {
    step: '05',
    title: 'Verified PR',
    subtitle: 'Pre-review & merge',
    token: 'Closes #issue',
    icon: CheckCircle2,
    summary: 'Run linter and test suite. Draft conventional PR title and link the issue number in description.',
    commands: [
      '# Commit following Conventional Commits',
      'git commit -m "fix(core): exclude docs from unreachable check (#2997)"',
      'git push origin fix/issue-number-short-desc'
    ],
    rule: 'Rule: Always include "Closes #123" so GitHub automatically resolves the issue upon merge.'
  }
];

const SAMPLE_WORKING_GUIDE = {
  issue: {
    repo_name: 'repowise-dev/repowise',
    issue_number: 2997,
    issue_title: 'Dead code reports docs site and docs/ example files as unreachable',
    issue_url: 'https://github.com/repowise-dev/repowise/issues/2997',
    language: 'Python',
    repo_stars: 3840,
    match_score: 92,
    why_good_fit: 'Isolated dead-code analysis heuristic with clear reproduction commands and dedicated AST test suite.'
  },
  guide: {
    setup_steps: [
      'git clone https://github.com/repowise-dev/repowise.git',
      'cd repowise',
      'python -m venv .venv && source .venv/bin/activate',
      'pip install -e ".[dev,test]"',
      'pytest tests/analyzers/test_dead_code.py'
    ],
    files_to_edit: [
      {
        file_path: 'src/repowise/analyzers/dead_code.py',
        reason: 'Filter docs and example directories from unreachable code diagnostics.',
        what_to_change: 'Add exclude patterns for `docs/` and `examples/` in `DeadCodeVisitor.visit_Module`.'
      },
      {
        file_path: 'src/repowise/config/defaults.py',
        reason: 'Register default ignore globs for documentation source files.',
        what_to_change: 'Append `docs/**` and `site/**` to `DEFAULT_EXCLUDED_PATTERNS`.'
      },
      {
        file_path: 'tests/analyzers/test_dead_code.py',
        reason: 'Add regression tests ensuring docs example snippets are ignored.',
        what_to_change: 'Add `test_dead_code_ignores_docs_examples` test case.'
      }
    ],
    implementation_hints: [
      'Use Path.match() or fnmatchcase against resolved relative paths to ensure cross-platform Windows and Unix consistency.',
      'Check existing AST traversal in `DeadCodeVisitor` before adding new node checks to avoid performance regressions.',
      'Verify that user-configured `--include-docs` flag still allows users to explicitly scan docs if desired.'
    ],
    things_to_avoid: [
      'Do not hardcode forward slashes without Path.as_posix() or os.path.normpath.',
      'Avoid modifying the global CLI parser defaults without updating documentation in docs/cli.md.',
      'Do not suppress syntax errors occurring in production code paths.'
    ],
    pr_title_suggestion: 'fix(analyzer): exclude docs and example files from unreachable code diagnostics (#2997)',
    pr_description_template: `### Summary of Changes
- Excludes \`docs/\` and \`examples/\` directory trees from default dead-code reporting.
- Preserves explicit opt-in scanning via \`--include-docs\` flag.
- Adds regression unit test verifying docs snippets do not trigger false positive unreachable code warnings.

### Closes
Closes #2997

### Verification
\`\`\`bash
pytest tests/analyzers/test_dead_code.py -v
\`\`\`
All tests passing with 100% branch coverage on modified lines.`
  }
};

const OpenSourcePage = () => {
  const toast = useToast();

  // Navigation tab: 'opportunities' | 'guide' | 'playbook' | 'reviewer' | 'saved'
  const [activeTab, setActiveTab] = useState('opportunities');

  // Inline Flow Diagram State
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [showFlowDiagram, setShowFlowDiagram] = useState(true);

  // Step 1: Filters & Search Config
  const [selectedSkills, setSelectedSkills] = useState(['TypeScript', 'React', 'Node.js']);
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [preferredLanguage, setPreferredLanguage] = useState('typescript');
  const [showConfig, setShowConfig] = useState(false);

  // In-results search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'stars'

  // Loading & Results
  const [finding, setFinding] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');

  // Step 2: PR Guide State
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [guiding, setGuiding] = useState(false);
  const [prGuide, setPrGuide] = useState(null);
  const [guideTab, setGuideTab] = useState('setup'); // 'setup' | 'files' | 'hints' | 'template'

  // Custom Guide On-Demand Inputs
  const [manualRepo, setManualRepo] = useState('');
  const [manualIssueNum, setManualIssueNum] = useState('');
  const [manualIssueUrl, setManualIssueUrl] = useState('');

  // Step 3: PR Reviewer State
  const [userCode, setUserCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [prReview, setPrReview] = useState(null);

  // Bookmarks & History
  const [bookmarkedMap, setBookmarkedMap] = useState({});
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Copied feedback helper
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Fetch bookmarks & past activity from history
  const fetchHistoryAndBookmarks = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/opensource/history');
      const items = res.data || [];
      setHistoryItems(items);

      // Pre-fill bookmarkedMap from bookmarks in history
      const map = {};
      items.filter((item) => item.actionType === 'bookmark').forEach((b) => {
        if (b.issueUrl) map[b.issueUrl] = true;
      });
      setBookmarkedMap(map);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndBookmarks();
  }, []);

  // Search opportunities
  const handleFindOpportunities = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setFinding(true);
    setRecommendations([]);
    setSelectedIssue(null);
    setPrGuide(null);

    try {
      const res = await api.post('/opensource/find', {
        skills: selectedSkills,
        experience_level: experienceLevel,
        preferred_language: preferredLanguage
      });
      const items = res.data || [];
      setRecommendations(items);
      toast.success(`Discovered ${items.length} vetted open source opportunities`);
      fetchHistoryAndBookmarks();
    } catch (err) {
      console.error('Open source error:', err);
      const msg = err.response?.data?.error || 'Failed to fetch issues from GitHub Search API.';
      setError(msg);
      toast.error(msg);
    } finally {
      setFinding(false);
    }
  };

  // Guide Me on Issue
  const handleRequestGuide = async (rec) => {
    setSelectedIssue(rec);
    setGuiding(true);
    setPrGuide(null);
    setPrReview(null);
    setGuideTab('setup');
    setActiveTab('guide');

    try {
      const res = await api.post('/opensource/guide', {
        issue_url: rec.issue_url,
        repo_name: rec.repo_name,
        issue_number: rec.issue_number,
        issue_title: rec.issue_title
      });
      setPrGuide(res.data);
      toast.success('Generated PR Architecture Blueprint');
      fetchHistoryAndBookmarks();
    } catch (err) {
      console.error('Guide error:', err);
      const msg = 'Failed to generate PR guide: ' + (err.response?.data?.error || err.message);
      toast.error(msg);
    } finally {
      setGuiding(false);
    }
  };

  // Load interactive sample guide demo
  const handleLoadSampleGuide = () => {
    setSelectedIssue(SAMPLE_WORKING_GUIDE.issue);
    setPrGuide(SAMPLE_WORKING_GUIDE.guide);
    setGuideTab('setup');
    setActiveTab('guide');
    toast.success('Loaded working contribution blueprint demo');
  };

  // Request Guide manually
  const handleManualGuide = async (e) => {
    e.preventDefault();
    if (!manualRepo.trim() || !manualIssueNum.trim()) {
      toast.error('Please provide a repository name and issue number.');
      return;
    }

    const manualRec = {
      repo_name: manualRepo.trim(),
      issue_number: Number(manualIssueNum.trim()),
      issue_url: manualIssueUrl.trim() || `https://github.com/${manualRepo.trim()}/issues/${manualIssueNum.trim()}`,
      issue_title: `Issue #${manualIssueNum.trim()}`
    };

    handleRequestGuide(manualRec);
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (rec) => {
    try {
      const res = await api.post('/opensource/bookmark', {
        issue_url: rec.issue_url,
        repo_name: rec.repo_name,
        issue_title: rec.issue_title,
        issue_number: rec.issue_number,
        metadata: { match_score: rec.match_score, language: rec.language, repo_stars: rec.repo_stars }
      });
      const isBookmarked = res.data.bookmarked;
      setBookmarkedMap((prev) => ({
        ...prev,
        [rec.issue_url]: isBookmarked
      }));
      toast.info(isBookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
      fetchHistoryAndBookmarks();
    } catch (err) {
      console.error('Bookmark error:', err);
      toast.error('Failed to update bookmark');
    }
  };

  // Review Code
  const handleReviewCode = async (e) => {
    if (e) e.preventDefault();
    if (!userCode.trim()) return;

    setReviewing(true);
    setPrReview(null);

    try {
      const res = await api.post('/opensource/review', {
        user_code: userCode,
        issue_url: selectedIssue?.issue_url || 'https://github.com/opensource/contribution',
        original_code: originalCode || ''
      });
      setPrReview(res.data);
      toast.success('Simulated maintainer review generated');
      fetchHistoryAndBookmarks();
    } catch (err) {
      console.error('Review error:', err);
      const msg = 'Review failed: ' + (err.response?.data?.error || err.message);
      toast.error(msg);
    } finally {
      setReviewing(false);
    }
  };

  // Processed Recommendations (Filter & Sort)
  let processedRecs = [...recommendations];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    processedRecs = processedRecs.filter(
      (r) =>
        (r.repo_name || '').toLowerCase().includes(q) ||
        (r.issue_title || '').toLowerCase().includes(q) ||
        (r.language || '').toLowerCase().includes(q) ||
        (r.why_good_fit || '').toLowerCase().includes(q)
    );
  }
  if (sortBy === 'match') {
    processedRecs.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  } else {
    processedRecs.sort((a, b) => (b.repo_stars || 0) - (a.repo_stars || 0));
  }

  const bookmarkedItems = historyItems.filter((item) => item.actionType === 'bookmark');

  const renderFitBadge = (score) => {
    const isHigh = score >= 85;
    const isGood = score >= 70;
    const color = isHigh ? '#34d399' : isGood ? '#3b82f6' : '#fbbf24';
    const bg = isHigh ? 'rgba(52, 211, 153, 0.10)' : isGood ? 'rgba(59, 130, 246, 0.10)' : 'rgba(251, 191, 36, 0.10)';

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
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: color }} />
        {score}% match
      </span>
    );
  };

  const getVerdictBadge = (verdict) => {
    const v = (verdict || '').toLowerCase();
    if (v === 'approve') {
      return (
        <span
          style={{
            padding: '0.25rem 0.65rem',
            borderRadius: '3px',
            background: 'rgba(52, 211, 153, 0.12)',
            color: '#34d399',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={13} /> Merge Ready & Approved
        </span>
      );
    }
    if (v === 'request_changes') {
      return (
        <span
          style={{
            padding: '0.25rem 0.65rem',
            borderRadius: '3px',
            background: 'rgba(244, 63, 94, 0.12)',
            color: '#fb7185',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            fontWeight: 600
          }}
        >
          <AlertCircle size={13} /> Changes Requested
        </span>
      );
    }
    return (
      <span
        style={{
          padding: '0.25rem 0.65rem',
          borderRadius: '3px',
          background: 'rgba(251, 191, 36, 0.12)',
          color: '#fbbf24',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.74rem',
          fontWeight: 600
        }}
      >
        <Info size={13} /> Approved with Suggestions
      </span>
    );
  };

  const currentFlow = CONTRIBUTION_FLOW_STEPS[activeFlowStep] || CONTRIBUTION_FLOW_STEPS[0];

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
            OPEN SOURCE · CONTRIBUTION FINDER & ARCHITECTURE GUIDANCE
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
          {prGuide && selectedIssue && activeTab === 'guide' && (
            <button
              type="button"
              onClick={() => exportOpenSourceGuidePdf(selectedIssue, prGuide)}
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
              title="Export Contribution Blueprint (PDF)"
            >
              <Printer size={12} />
              <span>Export Blueprint (PDF)</span>
            </button>
          )}

          {recommendations.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setRecommendations([]);
                setSelectedIssue(null);
                setPrGuide(null);
                setPrReview(null);
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
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Page Title & Philosophy */}
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
              Open Source Contributions
            </h1>
            <p
              style={{
                fontSize: '0.96rem',
                color: '#8e8e99',
                margin: 0,
                maxWidth: '650px',
                lineHeight: 1.55
              }}
            >
              Curated first issues matched to your technical stack, with step-by-step PR architecture guides and automated diff pre-review.
            </p>
          </div>

          {/* Quick Metrics Bar */}
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
                {recommendations.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Discovered Issues
              </div>
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: '#1f1f28' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
                {bookmarkedItems.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Bookmarked
              </div>
            </div>

            <div style={{ width: '1px', height: '24px', backgroundColor: '#1f1f28' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)', textTransform: 'capitalize' }}>
                {preferredLanguage}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Target Stack
              </div>
            </div>
          </div>
        </div>

        {/* INLINE VISUAL CONTRIBUTION FLOW DIAGRAM */}
        <div
          style={{
            marginTop: '2.25rem',
            backgroundColor: '#101014',
            border: '1px solid #1a1a22',
            borderRadius: '6px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* Flow Diagram Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#3b82f6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600
                }}
              >
                CONTRIBUTION LIFECYCLE ARCHITECTURE FLOW
              </span>
              <span style={{ fontSize: '0.74rem', color: '#71717a' }}>
                · Interactive 5-phase execution pipeline
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleLoadSampleGuide}
                style={{
                  background: 'transparent',
                  border: '1px solid #282834',
                  color: '#d4d4d8',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '3px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#d4d4d8')}
              >
                <Play size={10} />
                <span>Load Sample Guide</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFlowDiagram(!showFlowDiagram)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>{showFlowDiagram ? 'Hide Inspector' : 'Show Inspector'}</span>
                {showFlowDiagram ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </div>
          </div>

          {/* Visual Track (5 Connected Nodes) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '0.75rem',
              alignItems: 'stretch'
            }}
          >
            {CONTRIBUTION_FLOW_STEPS.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeFlowStep === idx;

              return (
                <div
                  key={item.step}
                  onClick={() => {
                    setActiveFlowStep(idx);
                    setShowFlowDiagram(true);
                  }}
                  style={{
                    backgroundColor: isActive ? '#14141c' : '#0d0d10',
                    border: isActive ? '1px solid #3b82f6' : '1px solid #1a1a22',
                    borderRadius: '4px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.65rem',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = '#2c2c36';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = '#1a1a22';
                  }}
                >
                  {/* Top Step Number & Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: isActive ? '#3b82f6' : '#71717a'
                        }}
                      >
                        {item.step}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#52525b' }}>/ 05</span>
                    </div>

                    <Icon size={14} color={isActive ? '#3b82f6' : '#71717a'} />
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.2, marginBottom: '0.2rem' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#8e8e99' }}>
                      {item.subtitle}
                    </div>
                  </div>

                  {/* Mini Token Indicator */}
                  <div
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      color: isActive ? '#34d399' : '#71717a',
                      backgroundColor: isActive ? 'rgba(52, 211, 153, 0.08)' : '#101014',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.token}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Flow Step Inspector (Interactive Command & Guidance Panel) */}
          {showFlowDiagram && (
            <div
              style={{
                backgroundColor: '#0c0c0f',
                border: '1px solid #1a1a22',
                borderRadius: '4px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      color: '#3b82f6',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '3px',
                      fontWeight: 600
                    }}
                  >
                    PHASE {currentFlow.step}
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff' }}>
                    {currentFlow.title}: {currentFlow.summary}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {activeFlowStep === 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('opportunities')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '0.74rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Explore Matched Issues →
                    </button>
                  )}
                  {activeFlowStep === 1 && (
                    <button
                      type="button"
                      onClick={handleLoadSampleGuide}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '0.74rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      View Blueprint Setup Commands →
                    </button>
                  )}
                  {activeFlowStep === 4 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('reviewer')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '0.74rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Open Diff Pre-Reviewer →
                    </button>
                  )}
                </div>
              </div>

              {/* Shell Commands Box */}
              <div
                style={{
                  backgroundColor: '#101014',
                  border: '1px solid #18181f',
                  borderRadius: '4px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                  {currentFlow.commands.map((cmd, i) => (
                    <code
                      key={i}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: cmd.startsWith('#') ? '#71717a' : '#34d399',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {cmd}
                    </code>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      currentFlow.commands.filter((c) => !c.startsWith('#')).join('\n'),
                      `flow_cmd_${activeFlowStep}`
                    )
                  }
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    flexShrink: 0
                  }}
                  title="Copy command"
                >
                  {copiedKey === `flow_cmd_${activeFlowStep}` ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Maintainer Rule / Heuristic */}
              <div style={{ fontSize: '0.82rem', color: '#a1a1aa', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Lightbulb size={13} color="#fbbf24" style={{ flexShrink: 0 }} />
                <span>{currentFlow.rule}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher: Linear Style */}
        <div
          style={{
            display: 'flex',
            gap: '2.2rem',
            marginTop: '2.5rem',
            borderBottom: '1px solid #18181d',
            overflowX: 'auto'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('opportunities')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'opportunities' ? '2px solid #3b82f6' : '2px solid transparent',
              padding: '0.75rem 0.2rem',
              fontSize: '0.86rem',
              fontWeight: activeTab === 'opportunities' ? 500 : 400,
              color: activeTab === 'opportunities' ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Find Opportunities</span>
            {recommendations.length > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: activeTab === 'opportunities' ? '#3b82f6' : '#71717a',
                  backgroundColor: activeTab === 'opportunities' ? 'rgba(59, 130, 246, 0.12)' : '#121216',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '3px'
                }}
              >
                {recommendations.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'guide' ? '2px solid #3b82f6' : '2px solid transparent',
              padding: '0.75rem 0.2rem',
              fontSize: '0.86rem',
              fontWeight: activeTab === 'guide' ? 500 : 400,
              color: activeTab === 'guide' ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>PR Blueprint Guide</span>
            {selectedIssue && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#34d399',
                  backgroundColor: 'rgba(52, 211, 153, 0.10)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '3px'
                }}
              >
                #{selectedIssue.issue_number}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playbook')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'playbook' ? '2px solid #3b82f6' : '2px solid transparent',
              padding: '0.75rem 0.2rem',
              fontSize: '0.86rem',
              fontWeight: activeTab === 'playbook' ? 500 : 400,
              color: activeTab === 'playbook' ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <BookOpen size={14} />
            <span>Contribution Playbook</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviewer')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'reviewer' ? '2px solid #3b82f6' : '2px solid transparent',
              padding: '0.75rem 0.2rem',
              fontSize: '0.86rem',
              fontWeight: activeTab === 'reviewer' ? 500 : 400,
              color: activeTab === 'reviewer' ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Diff Pre-Reviewer</span>
            {prReview && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#c084fc',
                  backgroundColor: 'rgba(192, 132, 252, 0.12)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '3px'
                }}
              >
                Reviewed
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'saved' ? '2px solid #3b82f6' : '2px solid transparent',
              padding: '0.75rem 0.2rem',
              fontSize: '0.86rem',
              fontWeight: activeTab === 'saved' ? 500 : 400,
              color: activeTab === 'saved' ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Saved & History</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                color: activeTab === 'saved' ? '#3b82f6' : '#71717a',
                backgroundColor: activeTab === 'saved' ? 'rgba(59, 130, 246, 0.12)' : '#121216',
                padding: '0.1rem 0.45rem',
                borderRadius: '3px'
              }}
            >
              {bookmarkedItems.length}
            </span>
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* TAB 1: OPPORTUNITIES FEED & PARAMETER SEARCH             */}
      {/* ======================================================== */}
      {activeTab === 'opportunities' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Quick Parameters Bar */}
          <div
            style={{
              backgroundColor: '#101014',
              border: '1px solid #1a1a22',
              borderRadius: '6px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {/* Top Config Row: Language + Experience + Find Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Language Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                    Language:
                  </span>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    style={{
                      backgroundColor: '#0c0c0f',
                      border: '1px solid #1f1f28',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                </div>

                {/* Experience Tier Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                    Level:
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[
                      { id: 'beginner', label: 'Good First Issue' },
                      { id: 'intermediate', label: 'Intermediate' },
                      { id: 'advanced', label: 'Systems / Core' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setExperienceLevel(t.id)}
                        style={{
                          background: experienceLevel === t.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                          color: experienceLevel === t.id ? '#ffffff' : '#71717a',
                          border: experienceLevel === t.id ? '1px solid #2e2e38' : '1px solid transparent',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '3px',
                          fontSize: '0.76rem',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #202028',
                    color: '#8e8e99',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.76rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8e8e99')}
                >
                  <SlidersHorizontal size={12} />
                  <span>Skills ({selectedSkills.length})</span>
                  {showConfig ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>

                <button
                  type="button"
                  onClick={handleFindOpportunities}
                  disabled={finding}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0B0B0D',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.45rem 1.25rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: finding ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!finding) e.currentTarget.style.backgroundColor = '#e4e4e7';
                  }}
                  onMouseLeave={(e) => {
                    if (!finding) e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <Sparkles size={13} />
                  <span>{finding ? 'Searching GitHub...' : 'Find Matches'}</span>
                </button>
              </div>
            </div>

            {/* Collapsible Skills Selector */}
            {showConfig && (
              <div style={{ paddingTop: '1rem', borderTop: '1px solid #18181f' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Select competencies to bias relevance:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {SKILL_OPTIONS.map((skill) => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '3px',
                          fontSize: '0.74rem',
                          fontFamily: 'var(--font-mono)',
                          background: active ? '#ffffff' : '#0e0e12',
                          color: active ? '#0B0B0D' : '#8e8e99',
                          border: active ? '1px solid #ffffff' : '1px solid #1c1c24',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {active ? '✓ ' : ''}{skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: '#fb7185',
                fontSize: '0.82rem',
                padding: '0.75rem 1rem',
                borderRadius: '4px'
              }}
            >
              {error}
            </div>
          )}

          {/* Finding Progress Bar */}
          {finding && (
            <div style={{ padding: '2rem 0', maxWidth: '560px' }}>
              <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 500, marginBottom: '0.4rem' }}>
                Querying live open-source repositories...
              </div>
              <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '1.25rem' }}>
                Filtering active issues tagged "good first issue" and scoring skill overlap via Groq Llama 3.3
              </div>
              <div style={{ height: '2px', backgroundColor: '#18181f', borderRadius: '1px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '70%', backgroundColor: '#3b82f6', animation: 'pulse 1.5s infinite ease-in-out' }} />
              </div>
            </div>
          )}

          {/* Filter Bar (When Results Exist) */}
          {recommendations.length > 0 && !finding && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #18181d'
              }}
            >
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by repo or keyword..."
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                  SHOWING {processedRecs.length} OF {recommendations.length}
                </div>

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
                    <option value="match">Match Score</option>
                    <option value="stars">GitHub Stars</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Opportunities List (Editorial Feed, No Cards, Divided by 1px rules) */}
          {recommendations.length > 0 && !finding && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {processedRecs.map((rec, idx) => {
                const isBookmarked = !!bookmarkedMap[rec.issue_url];

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1.75rem 0',
                      borderBottom: '1px solid #18181d',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    {/* Top Row: Repo Name, Stars, Language, Match Score & Action */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.86rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#3b82f6' }}>
                            {rec.repo_name}
                          </span>
                          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', backgroundColor: '#141419', padding: '0.15rem 0.45rem', borderRadius: '3px' }}>
                            ★ {rec.repo_stars?.toLocaleString() || '0'}
                          </span>
                          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#a1a1aa' }}>
                            {rec.language}
                          </span>
                          {renderFitBadge(rec.match_score)}
                        </div>

                        {/* Issue Title with External Link */}
                        <a
                          href={rec.issue_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '1.18rem',
                            fontWeight: 600,
                            color: '#ffffff',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.3
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
                        >
                          <span>#{rec.issue_number}: {rec.issue_title}</span>
                          <ArrowUpRight size={13} color="#71717a" />
                        </a>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(rec)}
                          style={{
                            background: isBookmarked ? 'rgba(59, 130, 246, 0.10)' : 'transparent',
                            border: isBookmarked ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #202028',
                            color: isBookmarked ? '#60a5fa' : '#8e8e99',
                            borderRadius: '4px',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.76rem',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this opportunity'}
                        >
                          {isBookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
                          <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRequestGuide(rec)}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#0B0B0D',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e4e4e7')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        >
                          <span>PR Blueprint</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Why Good Fit Note */}
                    <p style={{ fontSize: '0.88rem', color: '#8e8e99', lineHeight: 1.55, margin: '0.2rem 0' }}>
                      {rec.why_good_fit}
                    </p>

                    {/* Skill Overlap & Learning Opportunities */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                      {rec.skills_overlap?.map((sk, i) => (
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

                      {rec.skills_to_learn?.map((sk, i) => (
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
                          + {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {processedRecs.length === 0 && (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: '#71717a', fontSize: '0.88rem' }}>
                  No issues matched your search query. Try clearing your filter.
                </div>
              )}
            </div>
          )}

          {/* Empty State When No Results Loaded */}
          {recommendations.length === 0 && !finding && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '6px',
                  backgroundColor: '#121218',
                  border: '1px solid #1f1f28',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6',
                  margin: '0 auto'
                }}
              >
                <GitPullRequest size={20} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
                  Discover Vetted Open Source Contributions
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#8e8e99', maxWidth: '520px', lineHeight: 1.55, margin: '0 auto' }}>
                  Find active issues tagged <code>good first issue</code>, or inspect the 5-phase contribution lifecycle diagram above.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleFindOpportunities}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0B0B0D',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Find Matches for Selected Stack
                </button>

                <button
                  type="button"
                  onClick={handleLoadSampleGuide}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #282834',
                    color: '#3b82f6',
                    borderRadius: '4px',
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.84rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Play size={12} />
                  <span>Load Working Blueprint Demo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PR BLUEPRINT GUIDE WORKSPACE                      */}
      {/* ======================================================== */}
      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Guide Loading State */}
          {guiding && (
            <div style={{ padding: '3rem 0', maxWidth: '560px' }}>
              <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 500, marginBottom: '0.4rem' }}>
                Synthesizing Pull Request architecture blueprint...
              </div>
              <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '1.25rem' }}>
                Analyzing repository AST, target files, reproduction commands, and PR templates via Groq Llama 3.3
              </div>
              <div style={{ height: '2px', backgroundColor: '#18181f', borderRadius: '1px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '80%', backgroundColor: '#3b82f6', animation: 'pulse 1.5s infinite ease-in-out' }} />
              </div>
            </div>
          )}

          {/* Active Blueprint View */}
          {prGuide && selectedIssue && !guiding && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Active Issue Header Bar */}
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#101014',
                  border: '1px solid #1a1a22',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 600 }}>
                      {selectedIssue.repo_name}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#71717a' }}>·</span>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
                      Issue #{selectedIssue.issue_number}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                    {selectedIssue.issue_title}
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <a
                    href={selectedIssue.issue_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'transparent',
                      border: '1px solid #24242e',
                      color: '#d4d4d8',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.76rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <span>GitHub Issue</span>
                    <ArrowUpRight size={12} />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reviewer');
                    }}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#0B0B0D',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Code size={13} />
                    <span>Review Diff</span>
                  </button>
                </div>
              </div>

              {/* Blueprint Sub-tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderBottom: '1px solid #18181d',
                  paddingBottom: '0.75rem',
                  overflowX: 'auto'
                }}
              >
                {[
                  { id: 'setup', label: '1. Setup & Repro', icon: Terminal },
                  { id: 'files', label: '2. Files to Edit', icon: FolderOpen },
                  { id: 'hints', label: '3. Technical Hints', icon: Lightbulb },
                  { id: 'template', label: '4. PR Template', icon: FileText }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = guideTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setGuideTab(tab.id)}
                      style={{
                        background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        color: isSelected ? '#ffffff' : '#71717a',
                        border: isSelected ? '1px solid #2e2e38' : '1px solid transparent',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* SUB-TAB 1: SETUP STEPS */}
              {guideTab === 'setup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {prGuide.setup_steps?.map((cmd, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#101014',
                        border: '1px solid #18181f',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
                          0{idx + 1}
                        </span>
                        <code
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.82rem',
                            color: '#34d399',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cmd}
                        </code>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(cmd, `cmd_${idx}`)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#71717a',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px'
                        }}
                        title="Copy command"
                      >
                        {copiedKey === `cmd_${idx}` ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SUB-TAB 2: FILES TO EDIT */}
              {guideTab === 'files' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {prGuide.files_to_edit?.map((f, idx) => {
                    const filePath = typeof f === 'string' ? f : (f.file_path || f.file || f.path || f.name || 'Target File');
                    const reason = typeof f === 'object' ? f.reason : '';
                    const whatToChange = typeof f === 'object' ? f.what_to_change : '';

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '1.25rem',
                          backgroundColor: '#101014',
                          border: '1px solid #18181f',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FolderOpen size={14} color="#3b82f6" />
                          <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff', fontSize: '0.86rem' }}>
                            {filePath}
                          </code>
                        </div>

                        {reason && (
                          <div style={{ fontSize: '0.84rem', color: '#a1a1aa', lineHeight: 1.5 }}>
                            <span style={{ color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>REASON: </span>
                            {reason}
                          </div>
                        )}

                        {whatToChange && (
                          <div style={{ fontSize: '0.84rem', color: '#d4d4d8', lineHeight: 1.5 }}>
                            <span style={{ color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>MODIFICATION: </span>
                            {whatToChange}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SUB-TAB 3: TECHNICAL HINTS */}
              {guideTab === 'hints' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {prGuide.implementation_hints?.map((hint, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '1.25rem',
                          backgroundColor: '#101014',
                          border: '1px solid #18181f',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.85rem'
                        }}
                      >
                        <Lightbulb size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.88rem', color: '#d4d4d8', lineHeight: 1.55 }}>
                          {hint}
                        </div>
                      </div>
                    ))}
                  </div>

                  {prGuide.things_to_avoid && prGuide.things_to_avoid.length > 0 && (
                    <div
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'rgba(244, 63, 94, 0.06)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#fb7185', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Traps & Gotchas to Avoid
                      </div>
                      <ul style={{ margin: '0 0 0 1.25rem', padding: 0, fontSize: '0.84rem', color: '#d4d4d8', lineHeight: 1.6 }}>
                        {prGuide.things_to_avoid.map((trap, idx) => (
                          <li key={idx}>{trap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 4: PR TEMPLATE */}
              {guideTab === 'template' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                      Ready-to-Paste GitHub Markdown
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `## ${prGuide.pr_title_suggestion}\n\n${prGuide.pr_description_template}`,
                          'full_template'
                        )
                      }
                      style={{
                        background: 'transparent',
                        border: '1px solid #202028',
                        color: '#d4d4d8',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '3px',
                        fontSize: '0.76rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {copiedKey === 'full_template' ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                      <span>Copy PR Markdown</span>
                    </button>
                  </div>

                  <pre
                    style={{
                      padding: '1.25rem',
                      backgroundColor: '#101014',
                      border: '1px solid #18181f',
                      borderRadius: '4px',
                      color: '#e4e4e7',
                      fontSize: '0.84rem',
                      fontFamily: 'var(--font-mono)',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto',
                      margin: 0
                    }}
                  >
                    {`## ${prGuide.pr_title_suggestion}\n\n${prGuide.pr_description_template}`}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Empty State / Quick Load Sample Working Guide & Custom Generator */}
          {!prGuide && !guiding && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '720px' }}>
              {/* Working Blueprint Demo Card */}
              <div
                style={{
                  padding: '1.75rem',
                  backgroundColor: '#101014',
                  border: '1px solid #1f1f28',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    WORKING BLUEPRINT DEMO
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', margin: '0 0 0.35rem 0' }}>
                    repowise-dev/repowise #2997
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: '#8e8e99', lineHeight: 1.5, margin: 0 }}>
                    Dead code reports docs site and docs/ example files as unreachable. Explore reproduction shell commands, target AST analyzer files, and PR description template.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleLoadSampleGuide}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#0B0B0D',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <Play size={13} />
                    <span>Load Working Guide Demo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('playbook')}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #282834',
                      color: '#d4d4d8',
                      borderRadius: '4px',
                      padding: '0.6rem 1rem',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer'
                    }}
                  >
                    Read Contribution Playbook →
                  </button>
                </div>
              </div>

              {/* Custom On-Demand Generator */}
              <div
                style={{
                  padding: '1.75rem',
                  backgroundColor: '#101014',
                  border: '1px solid #1a1a22',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.35rem' }}>
                    Generate Blueprint on Demand
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: '#8e8e99', lineHeight: 1.5, margin: 0 }}>
                    Enter any public GitHub repository and issue number to automatically generate a step-by-step reproduction and PR guide.
                  </p>
                </div>

                <form onSubmit={handleManualGuide} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Repository (owner/repo)
                    </label>
                    <input
                      type="text"
                      value={manualRepo}
                      onChange={(e) => setManualRepo(e.target.value)}
                      placeholder="e.g. facebook/react or vercel/next.js"
                      style={{
                        width: '100%',
                        backgroundColor: '#0c0c0f',
                        border: '1px solid #1f1f28',
                        color: '#ffffff',
                        fontSize: '0.84rem',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '4px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Issue #
                      </label>
                      <input
                        type="number"
                        value={manualIssueNum}
                        onChange={(e) => setManualIssueNum(e.target.value)}
                        placeholder="e.g. 104"
                        style={{
                          width: '100%',
                          backgroundColor: '#0c0c0f',
                          border: '1px solid #1f1f28',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '4px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Issue URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={manualIssueUrl}
                        onChange={(e) => setManualIssueUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        style={{
                          width: '100%',
                          backgroundColor: '#0c0c0f',
                          border: '1px solid #1f1f28',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={guiding || !manualRepo.trim() || !manualIssueNum.trim()}
                    style={{
                      backgroundColor: manualRepo.trim() && manualIssueNum.trim() ? '#ffffff' : '#18181f',
                      color: manualRepo.trim() && manualIssueNum.trim() ? '#0B0B0D' : '#52525b',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: manualRepo.trim() && manualIssueNum.trim() ? 'pointer' : 'not-allowed',
                      alignSelf: 'flex-start',
                      marginTop: '0.25rem'
                    }}
                  >
                    Generate Blueprint
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CONTRIBUTION PLAYBOOK (MASTER WORKING GUIDE)      */}
      {/* ======================================================== */}
      {activeTab === 'playbook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '860px' }}>
          <div>
            <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
              PRACTICAL OPEN SOURCE PLAYBOOK
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#ffffff', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              The Engineering Lifecycle of a Pull Request
            </h2>
            <p style={{ fontSize: '0.94rem', color: '#8e8e99', lineHeight: 1.6, margin: 0 }}>
              A battle-tested protocol for contributing to open-source codebases, minimizing maintainer friction, and getting PRs merged cleanly.
            </p>
          </div>

          {/* Quick Action Banner */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#101014',
              border: '1px solid #1f1f28',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.2rem' }}>
                Want to practice on a real issue?
              </div>
              <div style={{ fontSize: '0.78rem', color: '#8e8e99' }}>
                Load our verified architecture blueprint demo for repowise-dev/repowise #2997.
              </div>
            </div>
            <button
              type="button"
              onClick={handleLoadSampleGuide}
              style={{
                backgroundColor: '#ffffff',
                color: '#0B0B0D',
                border: 'none',
                borderRadius: '4px',
                padding: '0.45rem 1rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Play size={12} />
              <span>Load Interactive Blueprint</span>
            </button>
          </div>

          {/* 5-Phase Playbook Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Phase 1 */}
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid #18181d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 600 }}>01</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Fork, Clone & Establish Isolated Hermetic Toolchains
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '1rem' }}>
                Always fork the repository on GitHub, then clone your personal fork. Set the original repository as <code>upstream</code> to easily fetch new changes without merging conflicts.
              </p>
              <div
                style={{
                  backgroundColor: '#101014',
                  border: '1px solid #1a1a22',
                  borderRadius: '4px',
                  padding: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#34d399',
                  lineHeight: 1.55
                }}
              >
                <div>git clone https://github.com/YOUR_USERNAME/project.git</div>
                <div>cd project</div>
                <div>git remote add upstream https://github.com/ORIGINAL_OWNER/project.git</div>
                <div>git checkout -b fix/issue-number-short-description</div>
              </div>
            </div>

            {/* Phase 2 */}
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid #18181d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 600 }}>02</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Reproduction-First: Write a Failing Unit Test
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '1rem' }}>
                Never jump straight into modifying core logic. First write a minimal test reproducing the exact failure reported in the issue. Run the test and ensure it fails for the expected reason (Red stage).
              </p>
              <div
                style={{
                  backgroundColor: '#101014',
                  border: '1px solid #1a1a22',
                  borderRadius: '4px',
                  padding: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#fbbf24',
                  lineHeight: 1.55
                }}
              >
                <div># Example: run the targeted test file to confirm reproduction</div>
                <div>pytest tests/analyzers/test_dead_code.py -k "test_docs_unreachable"</div>
                <div># or in Node.js:</div>
                <div>npm test -- -t "should ignore docs examples"</div>
              </div>
            </div>

            {/* Phase 3 */}
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid #18181d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 600 }}>03</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Minimal Surgical Implementation
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '1rem' }}>
                Implement the fix with the smallest possible diff. Avoid auto-formatting unrelated files, renaming untouched functions, or reorganizing imports outside your modification scope. Maintainers reject PRs with noisy diffs.
              </p>
              <ul style={{ margin: '0 0 0 1.25rem', padding: 0, fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.6 }}>
                <li>Keep code idiomatic to the surrounding codebase style.</li>
                <li>Verify your new test passes (Green stage).</li>
                <li>Run the entire test suite to ensure zero regressions across existing modules.</li>
              </ul>
            </div>

            {/* Phase 4 */}
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid #18181d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 600 }}>04</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Pre-Commit Linting & Diff Pre-Review
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '1rem' }}>
                Before pushing to GitHub, run linters, type checks, and pre-commit hooks locally. Paste your diff into the <strong>Diff Pre-Reviewer</strong> tab to simulate a maintainer code review.
              </p>
              <div
                style={{
                  backgroundColor: '#101014',
                  border: '1px solid #1a1a22',
                  borderRadius: '4px',
                  padding: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#e4e4e7',
                  lineHeight: 1.55
                }}
              >
                <div>git diff HEAD~1   # Inspect your diff carefully</div>
                <div>ruff check .      # or eslint / golangci-lint</div>
                <div>mypy src/         # or tsc --noEmit</div>
              </div>
            </div>

            {/* Phase 5 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 600 }}>05</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  Pull Request Drafting & Maintainer Review Cycles
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '1rem' }}>
                Write a concise, descriptive PR title using Conventional Commits (e.g. <code>fix(analyzer): ignore docs from dead code check (#123)</code>). Link the issue with <code>Closes #123</code> so GitHub automatically resolves it upon merge.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#0B0B0D',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Generate PR Blueprint for an Issue →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DIFF PRE-REVIEWER WORKSPACE                       */}
      {/* ======================================================== */}
      {activeTab === 'reviewer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
                  Simulated Maintainer Diff Pre-Review
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#8e8e99', margin: 0 }}>
                  Pre-screen your candidate code diff against repo standards before submitting the pull request.
                </p>
              </div>

              {selectedIssue && (
                <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.10)', padding: '0.3rem 0.65rem', borderRadius: '3px' }}>
                  Target: {selectedIssue.repo_name} #{selectedIssue.issue_number}
                </div>
              )}
            </div>
          </div>

          {/* Code Input Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Baseline Code */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Baseline Code (Optional)
              </label>
              <textarea
                rows={9}
                value={originalCode}
                onChange={(e) => setOriginalCode(e.target.value)}
                placeholder="// Optional: Existing function or baseline snippet..."
                style={{
                  width: '100%',
                  backgroundColor: '#101014',
                  border: '1px solid #1f1f28',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  padding: '0.75rem',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Proposed Solution */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Proposed Solution / Code Diff (Required)
              </label>
              <textarea
                rows={9}
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="// Paste your proposed patch or git diff snippet..."
                style={{
                  width: '100%',
                  backgroundColor: '#101014',
                  border: '1px solid #1f1f28',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.82rem',
                  padding: '0.75rem',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleReviewCode}
            disabled={reviewing || !userCode.trim()}
            style={{
              backgroundColor: userCode.trim() ? '#ffffff' : '#18181f',
              color: userCode.trim() ? '#0B0B0D' : '#52525b',
              border: 'none',
              borderRadius: '4px',
              padding: '0.65rem 1.5rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: userCode.trim() ? 'pointer' : 'not-allowed',
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Sparkles size={14} />
            <span>{reviewing ? 'Analyzing Diff...' : 'Run Simulated Maintainer Review'}</span>
          </button>

          {/* Review Output */}
          {prReview && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1.75rem',
                backgroundColor: '#101014',
                border: '1px solid #1a1a22',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}
            >
              {/* Verdict Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                  MAINTAINER VERDICT
                </span>
                {getVerdictBadge(prReview.verdict)}
              </div>

              <p style={{ fontSize: '0.92rem', color: '#ffffff', lineHeight: 1.6, margin: 0 }}>
                {prReview.overall_feedback}
              </p>

              {/* Observed Strengths & Issues Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {prReview.good_things && prReview.good_things.length > 0 && (
                  <div style={{ padding: '1.25rem', backgroundColor: '#0e0e12', border: '1px solid #18181f', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', marginBottom: '0.5rem', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                      <ThumbsUp size={13} />
                      <span>Strengths Observed</span>
                    </div>
                    <ul style={{ margin: '0 0 0 1.25rem', padding: 0, fontSize: '0.84rem', color: '#a1a1aa', lineHeight: 1.6 }}>
                      {prReview.good_things.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {prReview.issues && prReview.issues.length > 0 && (
                  <div style={{ padding: '1.25rem', backgroundColor: '#0e0e12', border: '1px solid #18181f', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', marginBottom: '0.5rem', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                      <Lightbulb size={13} />
                      <span>Actionable Improvements</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {prReview.issues.map((iss, idx) => (
                        <div key={idx} style={{ fontSize: '0.84rem', color: '#a1a1aa', lineHeight: 1.45 }}>
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>[{iss.type}] {iss.description}: </span>
                          {iss.suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Revised Clean Code Snippet */}
              {prReview.revised_code_suggestion && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase' }}>
                      Recommended Code Revision
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(prReview.revised_code_suggestion, 'revised_code')}
                      style={{
                        background: 'transparent',
                        border: '1px solid #202028',
                        color: '#d4d4d8',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '3px',
                        fontSize: '0.74rem',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {copiedKey === 'revised_code' ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                      <span>Copy Revision</span>
                    </button>
                  </div>

                  <pre
                    style={{
                      padding: '1rem',
                      backgroundColor: '#0c0c0f',
                      border: '1px solid #1a1a22',
                      borderRadius: '4px',
                      color: '#a7f3d0',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      overflowX: 'auto',
                      margin: 0
                    }}
                  >
                    {prReview.revised_code_suggestion}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: SAVED BOOKMARKS & RECENT HISTORY                  */}
      {/* ======================================================== */}
      {activeTab === 'saved' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Section 1: Bookmarks */}
          <div>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #18181d', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                BOOKMARKED ISSUES ({bookmarkedItems.length})
              </span>
            </div>

            {bookmarkedItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {bookmarkedItems.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      padding: '1.5rem 0',
                      borderBottom: '1px solid #18181d',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1.5rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.84rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 600 }}>
                          {item.repoName}
                        </span>
                        {item.issueNumber && (
                          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
                            #{item.issueNumber}
                          </span>
                        )}
                        {item.data?.match_score && renderFitBadge(item.data.match_score)}
                      </div>

                      <a
                        href={item.issueUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 600,
                          color: '#ffffff',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#3b82f6')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
                      >
                        <span>{item.issueTitle}</span>
                        <ArrowUpRight size={12} color="#71717a" />
                      </a>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() =>
                          handleRequestGuide({
                            repo_name: item.repoName,
                            issue_number: item.issueNumber,
                            issue_title: item.issueTitle,
                            issue_url: item.issueUrl
                          })
                        }
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#0B0B0D',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Open Guide
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleBookmark({ issue_url: item.issueUrl, repo_name: item.repoName })}
                        style={{
                          background: 'transparent',
                          border: '1px solid #24242e',
                          color: '#71717a',
                          borderRadius: '4px',
                          padding: '0.4rem 0.65rem',
                          fontSize: '0.76rem',
                          cursor: 'pointer'
                        }}
                        title="Remove bookmark"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem 0', color: '#71717a', fontSize: '0.88rem' }}>
                No saved issues yet. Click "Save" on any opportunity to monitor it here.
              </div>
            )}
          </div>

          {/* Section 2: Recent Activity */}
          <div>
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #18181d', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                RECENT SESSIONS ({historyItems.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {historyItems.slice(0, 8).map((hist) => (
                <div
                  key={hist._id}
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: '#101014',
                    border: '1px solid #18181f',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        color: hist.actionType === 'guide' ? '#34d399' : hist.actionType === 'review' ? '#c084fc' : '#3b82f6',
                        backgroundColor: '#14141a',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '3px'
                      }}
                    >
                      {hist.actionType}
                    </span>
                    <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 500 }}>
                      {hist.repoName || hist.issueTitle || `${hist.preferredLanguage || 'Open Source'} search`}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#52525b', fontFamily: 'var(--font-mono)' }}>
                    {new Date(hist.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenSourcePage;
