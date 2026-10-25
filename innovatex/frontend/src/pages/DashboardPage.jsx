import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitFork,
  Briefcase,
  Trophy,
  CheckCircle2,
  Info,
  Check,
  FileText,
  Bookmark,
  BookOpen,
  Bell,
  ArrowRight,
  ExternalLink,
  Plus,
  Github,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [greeting, setGreeting] = useState('Good afternoon');
  const [userName, setUserName] = useState('');

  // Live telemetry counts
  const [stats, setStats] = useState({
    reposAnalysed: 0,
    reposWithReadme: 0,
    applicationsTracked: 0,
    applicationsClosing: 0,
    contestsThisWeek: 0,
    nextContest: null,
    readinessScore: 0,
    hasAudit: false
  });

  const [tasks, setTasks] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setUserName(user?.name ? user.name.split(' ')[0] : 'Developer');

    // Fetch real live backend data
    let isMounted = true;
    Promise.allSettled([
      api.get('/github/latest'),
      api.get('/contests?days=14'),
      api.get('/jobs/bookmarks'),
      api.get('/reports')
    ]).then(([ghRes, contestRes, jobsRes, reportsRes]) => {
      if (!isMounted) return;

      let reposCount = 0;
      let reposReadme = 0;
      let score = 0;
      let hasAudit = false;
      let dynamicTasks = [];

      // 1. Process GitHub latest audit
      if (ghRes.status === 'fulfilled' && ghRes.value.data) {
        const audit = ghRes.value.data;
        hasAudit = true;
        const repos = audit.repositories || audit.repos || [];
        reposCount = Array.isArray(repos) ? repos.length : 0;
        reposReadme = Array.isArray(repos) ? repos.filter((r) => r.hasReadme || r.has_readme).length : 0;

        // Safely extract numeric score
        let rawScore = 0;
        if (typeof audit.overall_score === 'number') {
          rawScore = audit.overall_score;
        } else if (typeof audit.totalScore === 'number') {
          rawScore = audit.totalScore;
        } else if (typeof audit.overallScore === 'number') {
          rawScore = audit.overallScore;
        } else if (audit.score && typeof audit.score === 'object') {
          rawScore = typeof audit.score.overall_score === 'number'
            ? audit.score.overall_score
            : typeof audit.score.totalScore === 'number'
            ? audit.score.totalScore
            : 70;
        } else if (typeof audit.score === 'number') {
          rawScore = audit.score;
        } else {
          rawScore = reposCount > 0 ? 70 : 0;
        }
        score = typeof rawScore === 'number' && !isNaN(rawScore) ? rawScore : 0;

        if (audit.recommendations && Array.isArray(audit.recommendations)) {
          dynamicTasks = audit.recommendations.slice(0, 4).map((rec, i) => {
            const taskTitle = typeof rec === 'string'
              ? rec
              : typeof rec?.title === 'string'
              ? rec.title
              : typeof rec?.action === 'string'
              ? rec.action
              : 'Improve repository documentation & quality';
            const taskTime = typeof rec === 'object' && typeof rec?.severity === 'string'
              ? `${rec.severity} Priority`
              : 'High impact';

            return {
              id: `task-${i}`,
              title: taskTitle,
              time: taskTime,
              completed: false,
              actionText: 'View Audit',
              actionRoute: '/github'
            };
          });
        } else if (audit.suggestions && Array.isArray(audit.suggestions)) {
          dynamicTasks = audit.suggestions.slice(0, 4).map((sug, i) => ({
            id: `task-${i}`,
            title: typeof sug === 'string' ? sug : 'Action item',
            time: 'Action item',
            completed: false,
            actionText: 'View Audit',
            actionRoute: '/github'
          }));
        }
      }

      if (dynamicTasks.length === 0) {
        dynamicTasks = [
          {
            id: 'init-1',
            title: 'Audit your GitHub profile & public repositories',
            time: 'Takes 1 min',
            completed: hasAudit,
            actionText: hasAudit ? null : 'Audit GitHub',
            actionRoute: '/github'
          },
          {
            id: 'init-2',
            title: 'Upload resume PDF to evaluate ATS match with open roles',
            time: 'Takes 2 min',
            completed: false,
            actionText: 'Evaluate ATS',
            actionRoute: '/jobs'
          },
          {
            id: 'init-3',
            title: 'Explore Good First Issues in your preferred language',
            time: 'Open source',
            completed: false,
            actionText: 'Find Issues',
            actionRoute: '/opensource'
          },
          {
            id: 'init-4',
            title: 'Inspect tech stack market demand forecasts & skill gaps',
            time: 'Market trends',
            completed: false,
            actionText: 'View Market',
            actionRoute: '/market'
          }
        ];
      }

      // 2. Process real live contests
      let contestsCount = 0;
      let nextContestObj = null;
      let nextContestList = [];

      if (contestRes.status === 'fulfilled') {
        const raw = Array.isArray(contestRes.value.data) ? contestRes.value.data : contestRes.value.data?.contests || [];
        const valid = raw.filter((c) => c.title && new Date(c.start_time) >= new Date());
        valid.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        contestsCount = valid.length;
        if (valid.length > 0) {
          nextContestObj = valid[0];
          nextContestList = valid.slice(0, 4);
        }
      }

      // 3. Process jobs bookmarks
      let appsCount = 0;
      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value.data)) {
        appsCount = jobsRes.value.data.length;
      }

      // 4. Process recent activities / reports
      let activityItems = [];
      if (reportsRes.status === 'fulfilled') {
        const rList = reportsRes.value.data?.reports || (Array.isArray(reportsRes.value.data) ? reportsRes.value.data : []);
        activityItems = rList.slice(0, 4);
      }

      setStats({
        reposAnalysed: reposCount,
        reposWithReadme: reposReadme,
        applicationsTracked: appsCount,
        applicationsClosing: appsCount > 0 ? 1 : 0,
        contestsThisWeek: contestsCount,
        nextContest: nextContestObj ? `${nextContestObj.title} (${new Date(nextContestObj.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` : 'None scheduled',
        readinessScore: score,
        hasAudit
      });
      setTasks(dynamicTasks);
      setUpcomingContests(nextContestList);
      setRecentActivities(activityItems);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="page-container fade-in">
      {/* Top Header */}
      <div className="overview-header">
        <div>
          <h1 className="overview-title">{`${greeting}, ${userName}`}</h1>
          <p className="overview-subtitle">Here is where your developer profile, job matches, and live competitions stand today.</p>
        </div>
        <div className="overview-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/reports')}
          >
            View reports
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/github')}
          >
            Audit profile
          </button>
        </div>
      </div>

      {/* Top Stat Cards (3 Columns) */}
      <div className="overview-metrics-grid">
        <div className="metric-box" onClick={() => navigate('/github')}>
          <div className="metric-icon-wrap">
            <GitFork size={18} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Repositories analysed</div>
            <div className="metric-value">{stats.reposAnalysed}</div>
            <div className="metric-sub">{stats.hasAudit ? `${stats.reposWithReadme} with README` : 'Run your first audit'}</div>
          </div>
        </div>

        <div className="metric-box" onClick={() => navigate('/jobs')}>
          <div className="metric-icon-wrap">
            <Briefcase size={18} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Applications tracked</div>
            <div className="metric-value">{stats.applicationsTracked}</div>
            <div className="metric-sub">{stats.applicationsTracked > 0 ? 'Active in pipeline' : 'Upload resume to match'}</div>
          </div>
        </div>

        <div className="metric-box" onClick={() => navigate('/contests')}>
          <div className="metric-icon-wrap">
            <Trophy size={18} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Live & upcoming contests</div>
            <div className="metric-value">{stats.contestsThisWeek}</div>
            <div className="metric-sub" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {stats.nextContest ? `Next: ${stats.nextContest}` : 'Syncing contests...'}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="overview-main-grid">
        {/* Left Column */}
        <div className="overview-left-col">
          {/* Card 1: Profile readiness */}
          <div className="ui-card">
            <div className="card-top-row">
              <div>
                <h2 className="card-heading">Profile readiness</h2>
                <div className="card-sub-muted">
                  {stats.hasAudit ? 'Calculated from live GitHub repositories & commits' : 'Perform an audit to compute readiness score'}
                </div>
              </div>
              <button
                type="button"
                className="card-text-link"
                onClick={() => navigate('/github')}
              >
                {stats.hasAudit ? 'Full breakdown' : 'Run Audit'}
              </button>
            </div>

            {/* Score & Progress */}
            <div className="readiness-score-row">
              <span className="big-score">
                {typeof stats.readinessScore === 'number' ? stats.readinessScore : (stats.hasAudit ? 70 : 0)}
              </span>
              <span className="score-denom">/ 100</span>
              <span className="score-desc">
                {(typeof stats.readinessScore === 'number' ? stats.readinessScore : 0) >= 80
                  ? 'Strong portfolio! Profile is optimized for recruiter discovery.'
                  : stats.hasAudit
                  ? 'Good foundation. Complete the action items below to boost readiness.'
                  : 'Start by linking your GitHub profile to calculate your readiness.'}
              </span>
            </div>

            <div className="score-progress-track">
              <div
                className="score-progress-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, typeof stats.readinessScore === 'number' ? stats.readinessScore : (stats.hasAudit ? 70 : 10)))}%`
                }}
              />
            </div>

            {/* Bullet Points */}
            <div className="readiness-points">
              {stats.hasAudit ? (
                <>
                  <div className="readiness-point-row">
                    <div className="icon-circle success">
                      <Check size={14} />
                    </div>
                    <div className="point-text">
                      {stats.reposAnalysed} public repositories scanned and analyzed.
                    </div>
                  </div>

                  <div className="readiness-point-row">
                    <div className="icon-circle info">
                      <Info size={14} />
                    </div>
                    <div className="point-text">
                      {stats.reposWithReadme} of {stats.reposAnalysed} repositories have documentation READMEs.
                    </div>
                  </div>
                </>
              ) : (
                <div className="readiness-point-row">
                  <div className="icon-circle info">
                    <Github size={14} />
                  </div>
                  <div className="point-text">
                    Audit your GitHub username to automatically analyze repositories, code quality, and documentation.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Next actions */}
          <div className="ui-card">
            <div className="card-top-row">
              <div>
                <h2 className="card-heading">Next actions</h2>
                <div className="card-sub-muted">
                  {doneCount} of {tasks.length} done · prioritized for biggest career impact
                </div>
              </div>
            </div>

            <div className="tasks-checklist">
              {tasks.map((task) => (
                <div key={task.id} className="task-row">
                  <div className="task-left">
                    <button
                      type="button"
                      className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                      onClick={() => toggleTask(task.id)}
                      aria-label="Toggle task"
                    >
                      {task.completed && <Check size={12} strokeWidth={3} />}
                    </button>
                    <div>
                      <div className={`task-title ${task.completed ? 'completed' : ''}`}>
                        {task.title}
                      </div>
                      <div className="task-time">{task.time}</div>
                    </div>
                  </div>

                  <div className="task-right">
                    {task.completed ? (
                      <span className="badge badge-success">Done</span>
                    ) : task.actionText ? (
                      <button
                        type="button"
                        className="task-action-btn"
                        onClick={() => task.actionRoute && navigate(task.actionRoute)}
                      >
                        {task.actionText}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="overview-right-col">
          {/* Card 1: Up next deadlines / Live contests */}
          <div className="ui-card">
            <div className="card-top-row">
              <div>
                <h2 className="card-heading">Upcoming Contests</h2>
                <div className="card-sub-muted">Real-time competitive schedule</div>
              </div>
              <button
                type="button"
                className="card-text-link"
                onClick={() => navigate('/contests')}
              >
                View all ({stats.contestsThisWeek})
              </button>
            </div>

            {upcomingContests.length > 0 ? (
              <div className="deadlines-list">
                {upcomingContests.map((c, i) => {
                  const d = new Date(c.start_time);
                  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                  const day = d.getDate();
                  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={i} className="deadline-item">
                      <div className="date-block">
                        <span className="month">{month}</span>
                        <span className="day">{day}</span>
                      </div>
                      <div className="deadline-content">
                        <div className="deadline-title">{c.title}</div>
                        <div className="deadline-sub">{c.platform} • Starts at {time}</div>
                      </div>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
                        >
                          Join
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No contests scheduled in the next 14 days. Click "Contests" to refresh.
              </div>
            )}
          </div>

          {/* Card 2: Recent activity */}
          <div className="ui-card">
            <div className="card-top-row">
              <h2 className="card-heading">Recent activity</h2>
              <button
                type="button"
                className="card-text-link"
                onClick={() => navigate('/reports')}
              >
                View reports
              </button>
            </div>

            <div className="activity-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((act, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-icon-wrap">
                      <FileText size={15} />
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">{act.title}</div>
                      <div className="activity-time">{act.createdAt || 'Recent'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                  No reports generated yet. Run a GitHub audit, resume fit check, or paper synthesis to see activity here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .overview-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }

        .overview-title {
          font-size: 1.625rem;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.025em;
          margin-bottom: 0.35rem;
        }

        .overview-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .overview-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .overview-metrics-grid {
          display: grid;
          grid-templateColumns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }

        .metric-box {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: var(--shadow-card);
        }

        .metric-box:hover {
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }

        .metric-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background-color: var(--bg-subtle);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-content {
          flex: 1;
        }

        .metric-label {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .metric-value {
          font-size: 1.625rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
          margin-bottom: 0.25rem;
        }

        .metric-sub {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .overview-main-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 960px) {
          .overview-main-grid {
            grid-template-columns: 1fr;
          }
        }

        .overview-left-col,
        .overview-right-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .ui-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          box-shadow: var(--shadow-card);
        }

        .card-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .card-heading {
          font-size: 1.0625rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.2rem;
        }

        .card-sub-muted {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .card-text-link {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }

        .readiness-score-row {
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
          margin-bottom: 0.75rem;
        }

        .big-score {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .score-denom {
          font-size: 1.125rem;
          color: var(--text-muted);
          font-weight: 500;
          margin-right: 0.75rem;
        }

        .score-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }

        .score-progress-track {
          width: 100%;
          height: 7px;
          background-color: var(--bg-subtle);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 1.25rem;
        }

        .score-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary) 0%, var(--accent-rose) 100%);
          border-radius: var(--radius-full);
          transition: width 0.4s ease;
        }

        .readiness-points {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .readiness-point-row {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .icon-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .icon-circle.success {
          background-color: var(--success-light);
          color: var(--success-text);
        }

        .icon-circle.info {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .point-text {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        .tasks-checklist {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .task-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background-color: var(--bg-card);
          gap: 0.75rem;
        }

        .task-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .task-checkbox {
          width: 18px;
          height: 18px;
          border: 1.5px solid var(--border-hover);
          border-radius: 4px;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          padding: 0;
          flex-shrink: 0;
        }

        .task-checkbox.checked {
          background-color: var(--primary);
          border-color: var(--primary);
        }

        .task-title {
          font-size: 0.84rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .task-title.completed {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .task-time {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }

        .task-action-btn {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
        }

        .task-action-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .deadlines-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .deadline-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.625rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .date-block {
          width: 40px;
          height: 42px;
          border-radius: var(--radius-sm);
          background-color: var(--bg-subtle);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .date-block .month {
          font-size: 0.625rem;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
        }

        .date-block .day {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .deadline-content {
          flex: 1;
        }

        .deadline-title {
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .deadline-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .activity-icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          background-color: var(--bg-subtle);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-details {
          flex: 1;
        }

        .activity-title {
          font-size: 0.8125rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .activity-time {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
