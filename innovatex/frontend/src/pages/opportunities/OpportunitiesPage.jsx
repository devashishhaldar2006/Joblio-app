import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Bookmark,
  ExternalLink,
  Copy,
  Check,
  CalendarPlus,
  RefreshCw,
  AlertCircle,
  WifiOff,
  Code2,
  Trophy,
  Briefcase,
  X,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Default mock datasets matching Banani UI reference images exactly
const INITIAL_OSS_ISSUES = [
  {
    id: 1,
    repo_name: 'facebook/react',
    issue_number: 28411,
    issue_title: 'Fix focus loss in controlled select on Safari',
    issue_url: 'https://github.com/facebook/react/issues/28411',
    language: 'JavaScript',
    time_ago: '2d ago',
    tags: ['good first issue', 'bug'],
    setup_cmd: 'git clone https://github.com/facebook/react.git\ncd react · yarn install · yarn test',
    files_likely_to_change: [
      'packages/react-dom/src/client/ReactDOMSelect.js',
      'packages/react-dom/src/__tests__/ReactDOMSelect-test.js'
    ],
    rules: 'Comment on the issue to claim it. Open a PR against main with a test. One approval needed. Follow the code of conduct.'
  },
  {
    id: 2,
    repo_name: 'django/django',
    issue_number: 35120,
    issue_title: 'Add validation message for duplicate email in admin',
    issue_url: 'https://github.com/django/django/issues/35120',
    language: 'Python',
    time_ago: '4d ago',
    tags: ['beginner friendly'],
    setup_cmd: 'git clone https://github.com/django/django.git\ncd django · pip install -e .',
    files_likely_to_change: [
      'django/contrib/auth/admin.py',
      'tests/auth_tests/test_admin.py'
    ],
    rules: 'Check Trac ticket first. Run python tests/runtests.py auth_tests before creating pull request.'
  },
  {
    id: 3,
    repo_name: 'vercel/next.js',
    issue_number: 59320,
    issue_title: 'Docs: clarify ISR revalidate example for app router',
    issue_url: 'https://github.com/vercel/next.js/issues/59320',
    language: 'TypeScript',
    time_ago: '5d ago',
    tags: ['documentation'],
    setup_cmd: 'git clone https://github.com/vercel/next.js.git\ncd next.js · pnpm install',
    files_likely_to_change: [
      'docs/02-app/02-api-reference/05-next-config-js/revalidate.mdx'
    ],
    rules: 'Ensure documentation matches current Turbopack behavior. Use pnpm prettier-fix.'
  },
  {
    id: 4,
    repo_name: 'golang/go',
    issue_number: 64100,
    issue_title: 'Improve error message for unused imports in vet',
    issue_url: 'https://github.com/golang/go/issues/64100',
    language: 'Go',
    time_ago: '1w ago',
    tags: ['help wanted'],
    setup_cmd: 'git clone https://go.googlesource.com/go\ncd go/src · ./all.bash',
    files_likely_to_change: [
      'src/cmd/vet/unused.go',
      'src/cmd/vet/testdata/unused.go'
    ],
    rules: 'Follow Go Contribution Guidelines. Gerrit commit message format required.'
  },
  {
    id: 5,
    repo_name: 'pallets/flask',
    issue_number: 5291,
    issue_title: 'Add test coverage for blueprint error handlers',
    issue_url: 'https://github.com/pallets/flask/issues/5291',
    language: 'Python',
    time_ago: '1w ago',
    tags: ['good first issue', 'tests'],
    setup_cmd: 'git clone https://github.com/pallets/flask.git\ncd flask · pytest',
    files_likely_to_change: [
      'src/flask/blueprints.py',
      'tests/test_blueprints.py'
    ],
    rules: 'Maintain 100% test coverage requirement. Run pre-commit run --all-files.'
  }
];

const INITIAL_CONTESTS = [
  {
    id: 'c1',
    name: 'Starters 118',
    platform: 'CodeChef',
    startTime: 'Apr 2, 8:00 pm IST',
    duration: '2 hrs',
    url: 'https://www.codechef.com/contests'
  },
  {
    id: 'c2',
    name: 'Weekly Contest 392',
    platform: 'LeetCode',
    startTime: 'Apr 6, 8:00 am IST',
    duration: '1.5 hrs',
    url: 'https://leetcode.com/contest/'
  },
  {
    id: 'c3',
    name: 'Round #912 Div. 2',
    platform: 'Codeforces',
    startTime: 'Apr 7, 8:05 pm IST',
    duration: '2 hrs',
    url: 'https://codeforces.com/contests'
  },
  {
    id: 'c4',
    name: 'HackFest April',
    platform: 'HackerRank',
    startTime: 'Apr 12, 12:00 pm IST',
    duration: '3 days',
    url: 'https://www.hackerrank.com/contests'
  },
  {
    id: 'c5',
    name: 'GSSoC Info Session + Sprint',
    platform: 'GirlScript',
    startTime: 'Apr 14, 6:00 pm IST',
    duration: '1 hr',
    url: 'https://gssoc.girlscript.tech'
  }
];

const INITIAL_JOBS = [
  {
    id: 'j1',
    company: 'Loom',
    avatar: 'L',
    avatarBg: '#f3f4f6',
    title: 'Frontend Intern',
    location: 'Remote · India',
    posted: 'Posted Mar 27, 2026',
    matchPct: 68,
    type: 'Internship',
    url: 'https://loom.com/careers'
  },
  {
    id: 'j2',
    company: 'Razorpay',
    avatar: 'R',
    avatarBg: '#e0f2fe',
    title: 'Backend Intern (Python)',
    location: 'Bengaluru · Hybrid',
    posted: 'Posted Mar 25, 2026',
    matchPct: 74,
    type: 'Internship',
    url: 'https://razorpay.com/jobs'
  },
  {
    id: 'j3',
    company: 'Freshworks',
    avatar: 'F',
    avatarBg: '#fef3c7',
    title: 'Junior Full-stack Developer',
    location: 'Chennai · On-site',
    posted: 'Posted Mar 22, 2026',
    matchPct: 61,
    type: 'Full-time',
    url: 'https://careers.freshworks.com'
  },
  {
    id: 'j4',
    company: 'Zeta',
    avatar: 'Z',
    avatarBg: '#ecfdf5',
    title: 'Software Engineer Intern',
    location: 'Remote · India',
    posted: 'Posted Mar 20, 2026',
    matchPct: 70,
    type: 'Internship',
    url: 'https://zeta.tech/careers'
  },
  {
    id: 'j5',
    company: 'Smallcase',
    avatar: 'S',
    avatarBg: '#fce7f3',
    title: 'React Developer (Trainee)',
    location: 'Bengaluru · Hybrid',
    posted: 'Posted Mar 18, 2026',
    matchPct: 66,
    type: 'Internship',
    url: 'https://smallcase.com/careers'
  }
];

export default function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'opensource';
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(currentTab);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab') || 'opensource';
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // --- TAB 1: OPEN SOURCE STATE ---
  const [ossIssues, setOssIssues] = useState(INITIAL_OSS_ISSUES);
  const [selectedIssue, setSelectedIssue] = useState(INITIAL_OSS_ISSUES[0]);
  const [ossLanguage, setOssLanguage] = useState('All');
  const [ossDifficulty, setOssDifficulty] = useState('Beginner');
  const [ossSearch, setOssSearch] = useState('');
  const [savedOssCount, setSavedOssCount] = useState(4);
  const [ossLoading, setOssLoading] = useState(false);
  const [ossError, setOssError] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch live OSS issues if available
  const fetchLiveOss = async () => {
    setOssLoading(true);
    setOssError(false);
    try {
      const res = await api.post('/opensource/find', {
        skills: ['JavaScript', 'Python', 'Go', 'TypeScript'],
        experience_level: ossDifficulty.toLowerCase(),
        preferred_language: ossLanguage === 'All' ? 'javascript' : ossLanguage.toLowerCase()
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((item, idx) => ({
          id: idx + 10,
          repo_name: item.repo_name || item.repo || 'github/project',
          issue_number: item.issue_number || item.number || 1000 + idx,
          issue_title: item.issue_title || item.title || 'Contribute bug fix or feature',
          issue_url: item.issue_url || item.html_url || 'https://github.com',
          language: item.language || 'JavaScript',
          time_ago: 'Recently',
          tags: [ossDifficulty.toLowerCase(), 'open-source'],
          setup_cmd: `git clone https://github.com/${item.repo_name || 'project'}.git\ncd ${item.repo_name ? item.repo_name.split('/')[1] : 'project'}`,
          files_likely_to_change: ['src/index.js', 'tests/index.test.js'],
          rules: 'Follow GitHub pull request guidelines. Add tests for newly added logic.'
        }));
        setOssIssues(mapped);
        setSelectedIssue(mapped[0]);
      }
    } catch (err) {
      // Keep verified dataset active
      console.warn('Live OSS fetch notice, retaining reference set:', err.message);
    } finally {
      setOssLoading(false);
    }
  };

  // Filter OSS issues
  const filteredOssIssues = useMemo(() => {
    return ossIssues.filter((issue) => {
      const matchesLang = ossLanguage === 'All' || issue.language.toLowerCase() === ossLanguage.toLowerCase();
      const matchesSearch =
        !ossSearch.trim() ||
        issue.repo_name.toLowerCase().includes(ossSearch.toLowerCase()) ||
        issue.issue_title.toLowerCase().includes(ossSearch.toLowerCase());
      return matchesLang && matchesSearch;
    });
  }, [ossIssues, ossLanguage, ossSearch]);

  const handleCopySetup = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success('Setup command copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // --- TAB 2: CONTESTS STATE ---
  const [contests, setContests] = useState(INITIAL_CONTESTS);
  const [contestPlatform, setContestPlatform] = useState('All');
  const [contestTimeframe, setContestTimeframe] = useState('This week');
  const [contestSearch, setContestSearch] = useState('');
  const [reminders, setReminders] = useState({});

  useEffect(() => {
    let isMounted = true;
    api.get('/contests')
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.contests || [];
        if (list.length > 0) {
          const mapped = list.slice(0, 10).map((c, i) => ({
            id: c.contest_id || `contest-${i}`,
            name: c.title,
            platform: c.platform || 'Codeforces',
            startTime: c.start_time
              ? new Date(c.start_time).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Upcoming',
            duration: c.duration_seconds
              ? `${Math.round(c.duration_seconds / 3600)} hrs`
              : '2 hrs',
            url: c.url || 'https://clist.by'
          }));
          setContests(mapped);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredContests = useMemo(() => {
    return contests.filter((c) => {
      const matchesPlatform =
        contestPlatform === 'All' ||
        c.platform.toLowerCase().includes(contestPlatform.toLowerCase());
      const matchesSearch =
        !contestSearch.trim() ||
        c.name.toLowerCase().includes(contestSearch.toLowerCase()) ||
        c.platform.toLowerCase().includes(contestSearch.toLowerCase());
      return matchesPlatform && matchesSearch;
    });
  }, [contests, contestPlatform, contestSearch]);

  const handleAddReminder = (contest) => {
    const isAdded = reminders[contest.id];
    setReminders((prev) => ({ ...prev, [contest.id]: !isAdded }));
    if (!isAdded) {
      toast.success(`Reminder set for ${contest.name}`);
    } else {
      toast.info(`Reminder removed for ${contest.name}`);
    }
  };

  // --- TAB 3: JOBS STATE ---
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [jobLocation, setJobLocation] = useState('All');
  const [jobType, setJobType] = useState('Internship');
  const [jobSearch, setJobSearch] = useState('');
  const [savedJobs, setSavedJobs] = useState({});

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesType = jobType === 'All' || j.type.toLowerCase() === jobType.toLowerCase();
      const matchesLocation =
        jobLocation === 'All' ||
        j.location.toLowerCase().includes(jobLocation.toLowerCase());
      const matchesSearch =
        !jobSearch.trim() ||
        j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        j.company.toLowerCase().includes(jobSearch.toLowerCase());
      return matchesType && matchesLocation && matchesSearch;
    });
  }, [jobs, jobType, jobLocation, jobSearch]);

  const handleToggleSaveJob = (job) => {
    const isSaved = savedJobs[job.id];
    setSavedJobs((prev) => ({ ...prev, [job.id]: !isSaved }));
    if (!isSaved) {
      toast.success(`Saved ${job.title} at ${job.company}`);
    } else {
      toast.info(`Removed ${job.title} from saved`);
    }
  };

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Opportunities</h1>
          <p className="page-subtitle">Open issues, contests and jobs matched to your skills.</p>
        </div>
        {activeTab === 'opensource' && (
          <button type="button" className="btn-secondary">
            Saved ({savedOssCount})
          </button>
        )}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="nav-tabs">
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'opensource' ? 'active' : ''}`}
          onClick={() => handleTabChange('opensource')}
        >
          Open source
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'contests' ? 'active' : ''}`}
          onClick={() => handleTabChange('contests')}
        >
          Contests
        </button>
        <button
          type="button"
          className={`nav-tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => handleTabChange('jobs')}
        >
          Jobs
        </button>
      </div>

      {/* ============================================================
          TAB 1: OPEN SOURCE
         ============================================================ */}
      {activeTab === 'opensource' && (
        <div>
          {/* Filters */}
          <div className="filter-bar">
            <select
              className="filter-select"
              value={ossLanguage}
              onChange={(e) => setOssLanguage(e.target.value)}
            >
              <option value="All">Language: All</option>
              <option value="JavaScript">Language: JavaScript</option>
              <option value="Python">Language: Python</option>
              <option value="TypeScript">Language: TypeScript</option>
              <option value="Go">Language: Go</option>
            </select>

            <select
              className="filter-select"
              value={ossDifficulty}
              onChange={(e) => setOssDifficulty(e.target.value)}
            >
              <option value="Beginner">Difficulty: Beginner</option>
              <option value="Intermediate">Difficulty: Intermediate</option>
              <option value="Advanced">Difficulty: Advanced</option>
            </select>

            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search repositories or issues..."
                value={ossSearch}
                onChange={(e) => setOssSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Skeleton Loading State matching OpportunitiesLoading.jpeg */}
          {ossLoading && (
            <div className="oss-loading-card">
              <div className="skeleton-row" style={{ width: '40%' }} />
              <div className="skeleton-row" style={{ width: '55%' }} />
              <div className="skeleton-row" style={{ width: '70%' }} />
              <div className="skeleton-row" style={{ width: '50%' }} />
              <div className="skeleton-row" style={{ width: '45%' }} />
              <p className="loading-helper-text">Finding issues that match your skills...</p>
            </div>
          )}

          {/* Error State matching OpportunitiesError.jpeg */}
          {ossError && (
            <div className="oss-error-card">
              <div className="error-icon-box">
                <WifiOff size={22} className="error-icon" />
              </div>
              <h3 className="error-title">Could not load opportunities</h3>
              <p className="error-subtitle">Check your connection and try again. Your filters were kept.</p>
              <button type="button" className="btn-primary" onClick={fetchLiveOss}>
                Try again
              </button>
            </div>
          )}

          {/* Split View: Issue List on Left + Setup Guide on Right */}
          {!ossLoading && !ossError && (
            <div className="oss-split-grid">
              {/* Left: Issue List */}
              <div className="oss-issue-list">
                {filteredOssIssues.map((issue) => {
                  const isSelected = selectedIssue?.id === issue.id;
                  return (
                    <div
                      key={issue.id}
                      className={`oss-issue-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedIssue(issue)}
                    >
                      <div className="oss-card-header">
                        <div className="oss-repo-name">{issue.repo_name}</div>
                      </div>
                      <div className="oss-issue-title">{issue.issue_title}</div>
                      <div className="oss-card-footer">
                        <div className="oss-tags-row">
                          {issue.tags.map((t) => (
                            <span key={t} className="badge badge-gray">
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="oss-meta-row">
                          <span className="oss-meta-lang">{issue.language}</span>
                          <span className="oss-meta-time">{issue.time_ago}</span>
                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIssue(issue);
                            }}
                          >
                            View issue
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Setup Guide Panel */}
              {selectedIssue && (
                <div className="oss-guide-panel">
                  <div className="guide-header">
                    <div>
                      <div className="guide-repo-number">
                        {selectedIssue.repo_name} #{selectedIssue.issue_number}
                      </div>
                      <div className="guide-subtitle">Setup guide</div>
                    </div>
                    <button
                      type="button"
                      className="guide-close-btn"
                      onClick={() => setSelectedIssue(null)}
                      aria-label="Close guide"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="guide-section">
                    <div className="guide-step-title">1. Clone and install</div>
                    <div className="code-block-wrap">
                      <pre className="code-content">{selectedIssue.setup_cmd}</pre>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopySetup(selectedIssue.setup_cmd)}
                        title="Copy command"
                      >
                        {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="guide-section">
                    <div className="guide-step-title">2. Files likely to change</div>
                    <div className="files-list">
                      {selectedIssue.files_likely_to_change.map((file) => (
                        <div key={file} className="code-file-box">
                          <code>{file}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="guide-section">
                    <div className="guide-step-title">3. Contribution rules</div>
                    <p className="rules-text">{selectedIssue.rules}</p>
                  </div>

                  <div className="guide-action-wrap">
                    <a
                      href={selectedIssue.issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full text-center"
                    >
                      Open issue on GitHub
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 2: CONTESTS (matching OpportunitiesContests.jpeg)
         ============================================================ */}
      {activeTab === 'contests' && (
        <div>
          {/* Filters */}
          <div className="filter-bar">
            <select
              className="filter-select"
              value={contestPlatform}
              onChange={(e) => setContestPlatform(e.target.value)}
            >
              <option value="All">Platform: All</option>
              <option value="CodeChef">CodeChef</option>
              <option value="LeetCode">LeetCode</option>
              <option value="Codeforces">Codeforces</option>
              <option value="HackerRank">HackerRank</option>
            </select>

            <select
              className="filter-select"
              value={contestTimeframe}
              onChange={(e) => setContestTimeframe(e.target.value)}
            >
              <option value="This week">This week</option>
              <option value="Next week">Next week</option>
              <option value="All">All upcoming</option>
            </select>

            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search contests..."
                value={contestSearch}
                onChange={(e) => setContestSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Contests Table */}
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Platform</th>
                  <th>Start time</th>
                  <th>Duration</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredContests.map((c) => {
                  const isReminderSet = reminders[c.id];
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.platform}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.startTime}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.duration}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={isReminderSet ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                          onClick={() => handleAddReminder(c)}
                        >
                          {isReminderSet ? 'Reminder set' : 'Add reminder'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: JOBS (matching OpportunitiesJobs.jpeg)
         ============================================================ */}
      {activeTab === 'jobs' && (
        <div>
          {/* Filters */}
          <div className="filter-bar">
            <select
              className="filter-select"
              value={jobLocation}
              onChange={(e) => setJobLocation(e.target.value)}
            >
              <option value="All">Location: All</option>
              <option value="Remote">Remote</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Chennai">Chennai</option>
            </select>

            <select
              className="filter-select"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option value="Internship">Type: Internship</option>
              <option value="Full-time">Type: Full-time</option>
              <option value="All">Type: All</option>
            </select>

            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search title or company..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Job Listings List */}
          <div className="jobs-list">
            {filteredJobs.map((job) => {
              const isSaved = savedJobs[job.id];
              return (
                <div key={job.id} className="job-row-card">
                  <div className="job-left-content">
                    <div
                      className="job-company-avatar"
                      style={{ backgroundColor: job.avatarBg }}
                    >
                      {job.avatar}
                    </div>
                    <div>
                      <div className="job-title-row">
                        <span className="job-title">{job.title}</span>
                        <span className="job-sep">·</span>
                        <span className="job-company">{job.company}</span>
                      </div>
                      <div className="job-meta-row">
                        <span>{job.location}</span>
                        <span className="job-sep">·</span>
                        <span>{job.posted}</span>
                        <span className="job-sep">·</span>
                        <span className="job-match-badge">{job.matchPct}% match</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn-outline ${isSaved ? 'btn-saved' : ''}`}
                    onClick={() => handleToggleSaveJob(job)}
                  >
                    <Bookmark
                      size={15}
                      fill={isSaved ? 'var(--primary)' : 'none'}
                      color={isSaved ? 'var(--primary)' : 'currentColor'}
                    />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .btn-sm {
          padding: 0.35rem 0.75rem;
          font-size: 0.8125rem;
        }

        .w-full {
          width: 100%;
        }

        /* OSS Split Grid */
        .oss-split-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .oss-split-grid {
            grid-template-columns: 1fr;
          }
        }

        .oss-issue-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .oss-issue-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
          box-shadow: var(--shadow-card);
          cursor: pointer;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .oss-issue-card:hover {
          border-color: var(--border-strong);
        }

        .oss-issue-card.selected {
          border-color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary);
        }

        .oss-repo-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }

        .oss-issue-title {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.875rem;
        }

        .oss-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .oss-tags-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .oss-meta-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        /* Setup Guide Panel */
        .oss-guide-panel {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          box-shadow: var(--shadow-card);
          position: sticky;
          top: 80px;
        }

        .guide-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          padding-bottom: 0.875rem;
          border-bottom: 1px solid var(--border);
        }

        .guide-repo-number {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .guide-subtitle {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }

        .guide-close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
        }

        .guide-close-btn:hover {
          color: var(--text-primary);
        }

        .guide-section {
          margin-bottom: 1.25rem;
        }

        .guide-step-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .code-block-wrap {
          position: relative;
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.75rem 0.875rem;
        }

        .code-content {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          line-height: 1.5;
          color: var(--text-primary);
          white-space: pre-wrap;
          word-break: break-all;
        }

        .copy-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0.25rem;
          color: var(--text-muted);
          cursor: pointer;
        }

        .files-list {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .code-file-box {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
        }

        .code-file-box code {
          font-family: var(--font-mono);
          font-size: 0.76rem;
          color: var(--text-primary);
          word-break: break-all;
        }

        .rules-text {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .guide-action-wrap {
          margin-top: 1.5rem;
        }

        /* Loading Skeleton */
        .oss-loading-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .skeleton-row {
          height: 14px;
          background-color: var(--bg-subtle);
          border-radius: var(--radius-sm);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .loading-helper-text {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 1rem;
        }

        /* Error state */
        .oss-error-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .error-icon-box {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background-color: var(--danger-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .error-icon {
          color: var(--danger-text);
        }

        .error-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }

        .error-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
          max-width: 380px;
        }

        /* Job rows */
        .jobs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .job-row-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.125rem 1.5rem;
          box-shadow: var(--shadow-card);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .job-left-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .job-company-avatar {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .job-title-row {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .job-sep {
          color: var(--text-dim);
        }

        .job-company {
          font-weight: 500;
          color: var(--text-secondary);
        }

        .job-meta-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .job-match-badge {
          color: var(--primary);
          font-weight: 500;
        }

        .btn-saved {
          color: var(--primary);
          border-color: var(--primary-border);
          background-color: var(--primary-light);
        }
      `}</style>
    </div>
  );
}
