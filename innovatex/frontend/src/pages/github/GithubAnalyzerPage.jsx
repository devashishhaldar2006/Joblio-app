import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import EvidenceDrawer from './components/EvidenceDrawer';
import AIActionModal from './components/AIActionModal';
import ExportDialog from './components/ExportDialog';
import RepositoryDetailView from './components/RepositoryDetailView';
import RecruiterView from './components/RecruiterView';
import {
  Github, RefreshCw, Download, Sparkles, Terminal, HelpCircle,
  CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight,
  Search, Layers, UserCheck, FolderGit2, Activity, Cpu,
  Users, ListChecks, History, ExternalLink, Copy, Check,
  ChevronDown, ChevronRight, GitCompare, Target
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'profile', label: 'Profile', icon: UserCheck },
  { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'recommendations', label: 'Recommendations', icon: ListChecks },
  { id: 'history', label: 'History', icon: History },
];

const GOALS = [
  { id: 'Improve GitHub profile', label: 'Improve GitHub profile' },
  { id: 'Prepare for internships', label: 'Prepare for internships' },
  { id: 'Prepare for placements', label: 'Prepare for placements' },
  { id: 'Improve open-source presence', label: 'Improve open-source presence' },
  { id: 'Showcase projects', label: 'Showcase projects' },
  { id: 'Improve documentation', label: 'Improve documentation' },
];

const SEVERITY_STYLE = {
  Critical: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' },
  High: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' },
  Medium: { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.35)', color: '#06b6d4' },
  Low: { bg: 'rgba(113, 113, 122, 0.14)', border: 'rgba(113, 113, 122, 0.35)', color: 'var(--text-secondary)' },
};

const STATUS_STYLE = {
  Active: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', color: '#10b981' },
  'Recently created': { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.35)', color: '#06b6d4' },
  Stable: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)', color: '#60a5fa' },
  Dormant: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', color: '#f59e0b' },
  Archived: { bg: 'rgba(113, 113, 122, 0.15)', border: 'rgba(113, 113, 122, 0.35)', color: 'var(--text-secondary)' },
};

function scoreColor(pct) {
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

function formatRelativeSync(isoString) {
  if (!isoString) return 'Not synced yet';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return 'Synced just now';
  if (mins < 60) return `Synced ${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Synced ${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `Synced ${days} day${days === 1 ? '' : 's'} ago`;
}

export default function GithubAnalyzerPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [usernameInput, setUsernameInput] = useState(user?.githubUsername || '');
  const [report, setReport] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStageIndex, setSyncStageIndex] = useState(0);
  const [syncBanner, setSyncBanner] = useState(null);
  const [errorState, setErrorState] = useState(null);

  // Onboarding state when no report exists
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [analysisScope, setAnalysisScope] = useState({
    profile: true,
    repositories: true,
    activity: true,
    documentation: true,
  });

  // View modes & interactive state
  const [viewMode, setViewMode] = useState('developer'); // 'developer' | 'recruiter'
  const [selectedGoal, setSelectedGoal] = useState('Improve GitHub profile');
  const [recStatuses, setRecStatuses] = useState({});
  const [verifiedMap, setVerifiedMap] = useState({});
  const [expandedDim, setExpandedDim] = useState(null);
  const [selectedDnaDomain, setSelectedDnaDomain] = useState(null);

  // Repositories tab state
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoStatusFilter, setRepoStatusFilter] = useState('ALL');
  const [repoDepthFilter, setRepoDepthFilter] = useState('ALL');
  const [repoSortBy, setRepoSortBy] = useState('health_score');
  const [repoSortAsc, setRepoSortAsc] = useState(false);
  const [compareRepoNames, setCompareRepoNames] = useState([]);

  // Peer comparison in History/Compare
  const [peerUsername, setPeerUsername] = useState('');
  const [peerReport, setPeerReport] = useState(null);
  const [peerLoading, setPeerLoading] = useState(false);
  const [peerError, setPeerError] = useState('');

  // Drawers & Modals
  const [evidenceItem, setEvidenceItem] = useState(null);
  const [aiModal, setAiModal] = useState({ open: false, actionType: null, targetRepo: null });
  const [exportOpen, setExportOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const setTab = useCallback(
    (tabId) => {
      setSelectedRepo(null);
      setSearchParams({ tab: tabId });
    },
    [setSearchParams]
  );

  const syncStages = [
    { key: 'profile', label: 'Profile & identity metadata' },
    { key: 'repos', label: 'Public repositories & file trees' },
    { key: 'langs', label: 'Languages & technology signatures' },
    { key: 'activity', label: 'Contribution timeline & cadence' },
    { key: 'community', label: 'Community & discoverability signals' },
    { key: 'scoring', label: 'Evidence-backed scoring & verification' },
  ];

  const fetchHistory = useCallback(async (uname) => {
    if (!uname) return;
    try {
      const res = await api.get(`/github/history?username=${encodeURIComponent(uname)}`);
      if (Array.isArray(res.data)) {
        setHistoryList(res.data);
      } else if (res.data?.snapshots) {
        setHistoryList(res.data.snapshots);
      }
    } catch {
      // ignore history fetch error silently
    }
  }, []);

  const applyReportPayload = useCallback(
    (data) => {
      if (!data) return;
      setReport(data);
      window.__INNOVATEX_GITHUB_REPORT__ = data;
      const uname = data.username || data.profile?.login || data.profile?.username || '';
      if (uname) {
        setUsernameInput(uname);
        if (user?._id) {
          localStorage.setItem(`innovatex_last_github_user_${user._id}`, uname);
        }
        fetchHistory(uname);
      }
      if (data.selectedGoal) setSelectedGoal(data.selectedGoal);
      if (data.recommendationStatuses) setRecStatuses(data.recommendationStatuses);
      if (Array.isArray(data.verifiedRecommendations)) {
        const vMap = {};
        data.verifiedRecommendations.forEach((v) => {
          if (typeof v === 'string') {
            vMap[v] = { id: v, proof: 'Verified on GitHub sync.' };
          } else if (v && v.id) {
            vMap[v.id] = v;
          }
        });
        setVerifiedMap(vMap);
      }
    },
    [fetchHistory, user?._id]
  );

  // Load latest cached analysis on mount
  useEffect(() => {
    let active = true;
    async function loadLatest() {
      const userStorageKey = user?._id ? `innovatex_last_github_user_${user._id}` : null;
      const savedUser = user?.githubUsername || (userStorageKey ? localStorage.getItem(userStorageKey) : '') || '';
      
      if (!savedUser) {
        setLoadingInitial(false);
        return;
      }

      setLoadingInitial(true);
      try {
        const query = `?username=${encodeURIComponent(savedUser)}`;
        const res = await api.get(`/github/latest${query}`);
        if (active && res.data) {
          applyReportPayload(res.data);
        }
      } catch (err) {
        if (err.response?.status !== 404 && active) {
          setErrorState({
            type: 'error',
            message: err.response?.data?.error || 'Could not load saved GitHub intelligence snapshot.',
          });
        }
      } finally {
        if (active) setLoadingInitial(false);
      }
    }
    loadLatest();
    return () => {
      active = false;
    };
  }, [user?._id, user?.githubUsername, applyReportPayload]);

  // Run Sync / Analyze
  const handleSync = useCallback(
    async (overrideUsername, forceSync = true) => {
      const target = (overrideUsername ?? usernameInput ?? '').trim();
      if (!target) {
        setErrorState({
          type: 'validation',
          message: 'Please enter a valid public GitHub username to analyze.',
        });
        return;
      }

      setErrorState(null);
      setSyncing(true);
      setSyncStageIndex(0);
      setSyncBanner(null);

      const timer = setInterval(() => {
        setSyncStageIndex((prev) => (prev < syncStages.length - 1 ? prev + 1 : prev));
      }, 650);

      try {
        const res = await api.post('/github/analyze', {
          username: target,
          forceSync,
          goal: selectedGoal,
        });
        clearInterval(timer);
        setSyncStageIndex(syncStages.length - 1);
        const data = res.data;
        applyReportPayload(data);
        setOnboardingStep(4);

        const repoCount = (data.repositories || data.repo_analysis?.repositories || []).length;
        const changesArr = Array.isArray(data.changes) ? data.changes : data.changes?.items || [];
        const verifiedCount = (data.verifiedRecommendations || []).length;

        setSyncBanner({
          repoCount,
          changesCount: changesArr.length,
          verifiedCount,
        });
      } catch (err) {
        clearInterval(timer);
        const status = err.response?.status;
        const msg =
          err.response?.data?.error ||
          err.response?.data?.detail ||
          err.message ||
          'GitHub synchronization failed.';
        setErrorState({
          type: status === 429 ? 'rate_limit' : status === 404 ? 'not_found' : 'error',
          status,
          message: msg,
        });
      } finally {
        setSyncing(false);
      }
    },
    [usernameInput, selectedGoal, applyReportPayload, syncStages.length]
  );

  // Listen for Navbar, Sidebar & CommandPalette custom events
  useEffect(() => {
    const onTriggerSync = () => {
      const activeUser =
        report?.username || report?.profile?.login || report?.profile?.username || usernameInput;
      if (activeUser) {
        handleSync(activeUser, true);
      }
    };
    const onOpenExport = () => {
      if (report) setExportOpen(true);
    };
    const onCommandAction = (e) => {
      const detail = e.detail || {};
      const reposList = report?.repositories || report?.repo_analysis?.repositories || [];
      if (detail.type === 'select_repo' && detail.repoName && reposList.length > 0) {
        const found = reposList.find(
          (r) => r.name.toLowerCase() === detail.repoName.toLowerCase()
        );
        if (found) {
          setSearchParams({ tab: 'repositories' });
          setSelectedRepo(found);
        }
      } else if (detail.type === 'ai_action') {
        setAiModal({
          open: true,
          actionType: detail.actionType || 'profile_readme',
          targetRepo: detail.targetRepo || null,
        });
      }
    };

    window.addEventListener('trigger-github-sync', onTriggerSync);
    window.addEventListener('open-github-export', onOpenExport);
    window.addEventListener('github-command-action', onCommandAction);
    return () => {
      window.removeEventListener('trigger-github-sync', onTriggerSync);
      window.removeEventListener('open-github-export', onOpenExport);
      window.removeEventListener('github-command-action', onCommandAction);
    };
  }, [report, usernameInput, handleSync, setSearchParams]);

  // Persist user goal or manual recommendation status change
  const handleGoalChange = async (newGoal) => {
    setSelectedGoal(newGoal);
    const uname = report?.username || report?.profile?.login;
    if (!uname) return;
    try {
      await api.patch('/github/state', { username: uname, selectedGoal: newGoal });
    } catch {
      // non-blocking
    }
  };

  const handleRecStatusChange = async (recId, nextStatus) => {
    const updated = { ...recStatuses, [recId]: nextStatus };
    setRecStatuses(updated);
    const uname = report?.username || report?.profile?.login;
    if (!uname) return;
    try {
      await api.patch('/github/state', {
        username: uname,
        recommendationStatuses: { [recId]: nextStatus },
      });
    } catch {
      // non-blocking
    }
  };

  // Prioritize recommendations dynamically based on selectedGoal
  const prioritizedRecommendations = useMemo(() => {
    const raw = report?.recommendations || [];
    const sevWeight = { Critical: 400, High: 300, Medium: 200, Low: 100 };
    return [...raw]
      .map((rec) => {
        const verifiedObj = verifiedMap[rec.id] || null;
        const isVerified = Boolean(verifiedObj) || recStatuses[rec.id] === 'verified';
        const status = isVerified ? 'verified' : recStatuses[rec.id] || rec.status || 'open';
        const goalWeightVal = rec.goalWeights?.[selectedGoal] ?? 80;
        const priorityScore = (sevWeight[rec.severity] || 150) + goalWeightVal * 2;
        return {
          ...rec,
          status,
          isVerified,
          verifiedProof: verifiedObj?.proof || null,
          priorityScore: Math.round(priorityScore),
        };
      })
      .sort((a, b) => {
        if (a.isVerified !== b.isVerified) return a.isVerified ? 1 : -1;
        return b.priorityScore - a.priorityScore;
      });
  }, [report?.recommendations, selectedGoal, recStatuses, verifiedMap]);

  // Extract repositories list
  const allRepositories = useMemo(
    () => report?.repositories || report?.repo_analysis?.repositories || [],
    [report]
  );

  // Filtered and sorted repositories
  const filteredRepos = useMemo(() => {
    return [...allRepositories]
      .filter((r) => {
        const st = r.lifecycle_state || r.status || 'Stable';
        const dp = r.depth_classification || r.depth_category || 'Supporting';
        if (
          repoSearch &&
          !r.name.toLowerCase().includes(repoSearch.toLowerCase()) &&
          !(r.description || '').toLowerCase().includes(repoSearch.toLowerCase()) &&
          !(r.language || '').toLowerCase().includes(repoSearch.toLowerCase())
        ) {
          return false;
        }
        if (repoStatusFilter !== 'ALL' && st !== repoStatusFilter) return false;
        if (repoDepthFilter !== 'ALL' && dp !== repoDepthFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let va = a[repoSortBy];
        let vb = b[repoSortBy];
        if (repoSortBy === 'status') {
          va = a.lifecycle_state || a.status || '';
          vb = b.lifecycle_state || b.status || '';
        } else if (repoSortBy === 'docs') {
          va = a.readme?.score ?? a.breakdown?.documentation ?? 0;
          vb = b.readme?.score ?? b.breakdown?.documentation ?? 0;
        } else if (repoSortBy === 'engineering') {
          va = a.engineering?.score ?? a.breakdown?.engineering ?? 0;
          vb = b.engineering?.score ?? b.breakdown?.engineering ?? 0;
        } else if (repoSortBy === 'stars') {
          va = a.stargazers_count ?? a.stars ?? 0;
          vb = b.stargazers_count ?? b.stars ?? 0;
        } else if (repoSortBy === 'updated') {
          va = -(a.days_since_push ?? 9999);
          vb = -(b.days_since_push ?? 9999);
        }
        if (typeof va === 'string') {
          return repoSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        }
        return repoSortAsc ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
      });
  }, [allRepositories, repoSearch, repoStatusFilter, repoDepthFilter, repoSortBy, repoSortAsc]);

  const toggleCompareRepo = (repoName) => {
    setCompareRepoNames((prev) =>
      prev.includes(repoName) ? prev.filter((n) => n !== repoName) : [...prev, repoName].slice(0, 4)
    );
  };

  const comparedRepos = useMemo(() => {
    return compareRepoNames
      .map((name) => allRepositories.find((r) => r.name === name))
      .filter(Boolean);
  }, [allRepositories, compareRepoNames]);

  const handleCopyChecklist = (rec) => {
    const text = `${rec.title}\nWhy: ${rec.rationale || rec.observation}\nActions:\n${(rec.actions || [])
      .map((a) => `- [ ] ${a}`)
      .join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleComparePeer = async (e) => {
    e.preventDefault();
    const target = peerUsername.trim();
    if (!target) return;
    setPeerLoading(true);
    setPeerError('');
    try {
      const res = await api.post('/github/analyze', { username: target, forceSync: false });
      setPeerReport(res.data);
    } catch (err) {
      setPeerError(
        err.response?.data?.error || 'Could not fetch peer GitHub profile for comparison.'
      );
    } finally {
      setPeerLoading(false);
    }
  };

  // Loading Skeleton State
  if (loadingInitial) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 1440, margin: '0 auto' }}>
        <div
          style={{
            padding: 24,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <RefreshCw size={18} color="#06b6d4" className="spin" />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Loading GitHub Developer Intelligence Workspace...
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Checking normalized snapshot cache and methodology v2.1 telemetry
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ONBOARDING / FIRST-RUN STATE (When no GitHub profile has been analyzed yet)
  if (!report) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: 780, margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '28px 30px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 4,
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: '#22d3ee',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            <Github size={13} /> GITHUB DEVELOPER INTELLIGENCE • METHODOLOGY v2.1
          </div>

          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Connect GitHub for Evidence-Backed Profile Intelligence
          </h1>
          <p style={{ margin: '0 0 22px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Analyze your public developer profile, repository quality, README documentation depth,
            activity consistency, technology footprint, and discoverability signals. Every score and
            recommendation is backed by observable GitHub API data.
          </p>

          {/* Step Indicator */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              marginBottom: 22,
            }}
          >
            {[
              { step: 1, title: '1. Connect GitHub', desc: 'Enter public username' },
              { step: 2, title: '2. Analysis Scope', desc: 'Configure telemetry modules' },
              { step: 3, title: '3. Deep Inspection', desc: 'Normalize & score evidence' },
            ].map((s) => {
              const active = onboardingStep === s.step || (syncing && s.step === 3);
              return (
                <div
                  key={s.step}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: active ? 'var(--primary-light)' : 'var(--bg-subtle)',
                    border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: active ? 'var(--primary-text)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
                </div>
              );
            })}
          </div>

          {errorState && (
            <div
              style={{
                marginBottom: 18,
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={16} color="#ef4444" />
              <span>{errorState.message}</span>
            </div>
          )}

          {!syncing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSync(usernameInput, true);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              <div>
                <label
                  htmlFor="github-onboarding-username"
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  PUBLIC GITHUB USERNAME
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input
                    id="github-onboarding-username"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      if (onboardingStep === 1 && e.target.value.trim()) setOnboardingStep(2);
                    }}
                    placeholder="Enter your GitHub username"
                    style={{
                      flex: 1,
                      minWidth: 220,
                      padding: '10px 14px',
                      borderRadius: 7,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!usernameInput.trim()}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 7,
                      background: usernameInput.trim() ? 'var(--primary)' : 'var(--bg-subtle)',
                      border: 'none',
                      color: usernameInput.trim() ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: usernameInput.trim() ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Github size={15} /> Connect & Analyze GitHub
                  </button>
                </div>
              </div>

              {/* Scope Checkboxes */}
              <div
                style={{
                  padding: 14,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: 10,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ANALYSIS SCOPE & OPTIMIZATION GOAL
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {[
                    { key: 'profile', label: 'Public profile & README' },
                    { key: 'repositories', label: 'Public repositories & trees' },
                    { key: 'documentation', label: 'Documentation & engineering' },
                    { key: 'activity', label: 'Public activity & community' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={analysisScope[item.key]}
                        onChange={(e) =>
                          setAnalysisScope((prev) => ({ ...prev, [item.key]: e.target.checked }))
                        }
                      />
                      {item.label}
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Primary objective:</span>
                  <select
                    value={selectedGoal}
                    onChange={(e) => setSelectedGoal(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem',
                    }}
                  >
                    {GOALS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          ) : (
            <div
              style={{
                padding: 18,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#22d3ee',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <RefreshCw size={14} className="spin" /> SYNCING GITHUB (@{usernameInput})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {syncStages.map((st, idx) => {
                  const done = idx < syncStageIndex;
                  const current = idx === syncStageIndex;
                  return (
                    <div
                      key={st.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: '0.8rem',
                        color: done ? '#10b981' : current ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <span>{done ? '✓' : current ? '◌' : '·'}</span>
                      <span>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Extract normalized report sections
  const profile = report.profile || {};
  const activeUsername = report.username || profile.login || profile.username || '';
  const repoAnalysis = report.repo_analysis || {};
  const scoreObj = report.score || report.category_scores || {};
  const dimensions = report.dimensions || scoreObj.dimensions || [];
  const totalScore =
    report.totalScore ??
    report.overall_score ??
    report.overallScore ??
    scoreObj.totalScore ??
    0;
  const scoreDelta = report.scoreDelta ?? null;
  const projection = report.projection || scoreObj.projection || null;
  const completeness =
    report.profile_completeness || repoAnalysis.profile_completeness || {};
  const docIntel =
    report.documentation_intelligence || repoAnalysis.documentation_intelligence || {};
  const actIntel =
    report.activity_intelligence || repoAnalysis.activity_intelligence || {};
  const techFootprint =
    report.language_distribution || repoAnalysis.language_distribution || [];
  const detectedTech =
    report.detected_technologies || repoAnalysis.detected_technologies || [];
  const devDna = report.developer_dna || repoAnalysis.developer_dna || [];
  const projDepth = report.project_depth || repoAnalysis.project_depth || {};
  const commIntel =
    report.community_intelligence || repoAnalysis.community_intelligence || {};
  const discIntel =
    report.discoverability_intelligence || repoAnalysis.discoverability_intelligence || {};
  const rateLimit = report.rate_limit || report.metadata?.rate_limit || {};
  const syncedAtTimestamp =
    report.analyzed_at || report.fetched_at || report.lastUpdated || null;
  const changesList = Array.isArray(report.changes)
    ? report.changes
    : report.changes?.items || [];
  const scoreHistory = report.scoreHistory || historyList || [];

  const completenessDim = dimensions.find((d) => d.id === 'profile_completeness');
  const discoverabilityDim = dimensions.find((d) => d.id === 'discoverability');

  return (
    <div
      style={{
        padding: '20px 24px 48px',
        maxWidth: 1480,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        color: 'var(--text-primary)',
      }}
    >
      {/* TOP HEADER CONSOLE */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          boxShadow: 'var(--card-highlight)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          {/* Left Identity & Sync Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {(report.avatar_url || profile.avatar_url) && (
              <img
                src={report.avatar_url || profile.avatar_url}
                alt={activeUsername}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  GitHub Intelligence
                </h1>
                <a
                  href={`https://github.com/${activeUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#38bdf8',
                    fontFamily: 'var(--font-mono)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  @{activeUsername} <ExternalLink size={12} />
                </a>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Methodology {report.methodologyVersion || 'v2.1'}
                </span>
              </div>

              {/* Sync Freshness & Target Switcher */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 6,
                  flexWrap: 'wrap',
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: syncing ? '#f59e0b' : '#10b981',
                    }}
                  />
                  {formatRelativeSync(syncedAtTimestamp)}
                </span>

                {rateLimit.remaining !== undefined && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    API quota: {rateLimit.remaining}/{rateLimit.limit || 60}
                  </span>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSync(usernameInput, false);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Switch @username"
                    aria-label="GitHub username"
                    style={{
                      width: 135,
                      padding: '3px 8px',
                      borderRadius: 5,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  {usernameInput.trim().toLowerCase() !== activeUsername.toLowerCase() && (
                    <button
                      type="submit"
                      style={{
                        padding: '3px 8px',
                        borderRadius: 5,
                        background: '#06b6d4',
                        border: 'none',
                        color: '#09090b',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Load
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Developer / Recruiter View Toggle */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: 2,
              }}
            >
              <button
                onClick={() => setViewMode('developer')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: viewMode === 'developer' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'developer' ? 'var(--text-main)' : 'var(--text-muted)',
                  boxShadow: viewMode === 'developer' ? 'var(--card-highlight)' : 'none',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Developer View
              </button>
              <button
                onClick={() => setViewMode('recruiter')}
                style={{
                  padding: '5px 10px',
                  borderRadius: 4,
                  border: 'none',
                  background: viewMode === 'recruiter' ? '#06b6d4' : 'transparent',
                  color: viewMode === 'recruiter' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Recruiter View
              </button>
            </div>

            <button
              onClick={() => handleSync(activeUsername, true)}
              disabled={syncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 6,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--card-highlight)',
                color: 'var(--text-main)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: syncing ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={13} className={syncing ? 'spin' : ''} color="#06b6d4" />
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>

            <button
              onClick={() => setExportOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 6,
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={13} /> Export Report
            </button>

            <button
              onClick={() =>
                setAiModal({ open: true, actionType: 'profile_readme', targetRepo: null })
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 6,
                background: 'rgba(168, 85, 247, 0.14)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#e9d5ff',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={13} /> Generate Profile README
            </button>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 6,
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: '#22d3ee',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Terminal size={13} /> Ask AI (⌘K)
            </button>
          </div>
        </div>

        {/* Live Sync Progress Bar */}
        {syncing && (
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RefreshCw size={14} color="#06b6d4" className="spin" />
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                SYNCING GITHUB SNAPSHOT:
              </span>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {syncStages.map((st, idx) => {
                const done = idx < syncStageIndex;
                const active = idx === syncStageIndex;
                return (
                  <span
                    key={st.key}
                    style={{
                      fontSize: '0.73rem',
                      fontFamily: 'var(--font-mono)',
                      color: done ? '#10b981' : active ? '#22d3ee' : 'var(--text-muted)',
                    }}
                  >
                    {done ? '✓' : active ? '◌' : '·'} {st.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Sync Complete Verification & Diff Banner */}
        {syncBanner && !syncing && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(16, 185, 129, 0.09)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.78rem',
                color: 'var(--text-primary)',
              }}
            >
              <CheckCircle2 size={15} color="#10b981" />
              <span>
                <strong>SYNC COMPLETE:</strong> {syncBanner.repoCount} repositories analyzed •{' '}
                {syncBanner.changesCount} changes detected • {syncBanner.verifiedCount}{' '}
                recommendations verified
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setTab('history')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 5,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: '#22d3ee',
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View changes
              </button>
              <button
                onClick={() => setSyncBanner(null)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 5,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.73rem',
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorState && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              fontSize: '0.78rem',
              color: '#fca5a5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} color="#ef4444" />
              <span>{errorState.message}</span>
            </div>
            <button
              onClick={() => handleSync(usernameInput, true)}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Sub-Navigation Tabs + Goal Selector */}
        {viewMode === 'developer' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              borderTop: '1px solid var(--border)',
              paddingTop: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      borderRadius: 6,
                      background: active ? 'var(--primary-light)' : 'transparent',
                      border: active ? '1px solid var(--primary-border)' : '1px solid transparent',
                      color: active ? 'var(--primary-text)' : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Icon size={13} color={active ? 'var(--primary)' : 'var(--text-muted)'} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Active Goal Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={13} color="#06b6d4" />
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Goal:
              </span>
              <select
                value={selectedGoal}
                onChange={(e) => handleGoalChange(e.target.value)}
                aria-label="Optimization goal"
                style={{
                  padding: '5px 9px',
                  borderRadius: 6,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {GOALS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* RECRUITER PRESENTATION MODE */}
      {viewMode === 'recruiter' ? (
        <RecruiterView
          report={report}
          onSelectRepo={(repo) => {
            setViewMode('developer');
            setTab('repositories');
            setSelectedRepo(repo);
          }}
        />
      ) : selectedRepo && activeTab === 'repositories' ? (
        /* REPOSITORY INTELLIGENCE DETAIL VIEW */
        <RepositoryDetailView
          repo={selectedRepo}
          allRecommendations={prioritizedRecommendations}
          onBack={() => setSelectedRepo(null)}
          onOpenEvidence={(ev) => setEvidenceItem(ev)}
          onOpenAIAction={(actionType, targetRepo) =>
            setAiModal({ open: true, actionType, targetRepo })
          }
        />
      ) : (
        <>
          {/* =========================================================
              TAB 1: OVERVIEW
             ========================================================= */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile Health + Optimization Projection Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 16,
                }}
              >
                {/* Central Profile Health */}
                <div
                  style={{
                    padding: '20px 22px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      PROFILE HEALTH
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {report.confidenceLabel || 'High confidence'} (
                      {Math.round((report.confidence || 0.9) * 100)}%)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '2.8rem',
                        fontWeight: 800,
                        color: scoreColor(totalScore),
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1,
                      }}
                    >
                      {totalScore}
                    </span>
                    <span
                      style={{
                        fontSize: '1.1rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      / 100
                    </span>

                    {typeof scoreDelta === 'number' && scoreDelta !== 0 && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '3px 8px',
                          borderRadius: 5,
                          background:
                            scoreDelta > 0
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                          color: scoreDelta > 0 ? '#10b981' : '#ef4444',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {scoreDelta > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts since previous analysis
                      </span>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Public GitHub Profile Score synthesized across 8 evidence-backed dimensions (
                    {allRepositories.length} public source repositories,{' '}
                    {repoAnalysis.inspected_repos_count ?? allRepositories.length} deeply inspected).
                  </p>

                  {/* Mini Dimension Bar Strip */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 8,
                      paddingTop: 8,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    {dimensions.slice(0, 8).map((d) => (
                      <div key={d.id || d.dimension} style={{ fontSize: '0.7rem' }}>
                        <div
                          style={{
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {d.dimension}
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: scoreColor(d.percentage),
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {d.score}/{d.maxScore}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Before / After Modelled Optimization Projection */}
                <div
                  style={{
                    padding: '20px 22px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#c084fc',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      OPTIMIZATION PROJECTION
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(168, 85, 247, 0.12)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        color: '#d8b4fe',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {projection?.label || 'Modelled projection'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        CURRENT
                      </div>
                      <div
                        style={{
                          fontSize: '1.8rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {projection?.currentScore ?? totalScore}{' '}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>→</div>

                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                        PROJECTED (MODELLED)
                      </div>
                      <div
                        style={{
                          fontSize: '1.8rem',
                          fontWeight: 800,
                          color: '#10b981',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {projection?.projectedScore ?? Math.min(98, totalScore + 12)}{' '}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Potential modelled score after completing:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {(projection?.factors || projection?.improvements || []).map((imp, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.76rem',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          <span>+ {imp.action}</span>
                          <span style={{ color: '#10b981' }}>
                            {imp.estimatedDelta || `+${imp.estimatedGain} pts`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {projection?.disclaimer ||
                      'Modelled projection based on current methodology weights; not a guaranteed outcome.'}
                  </div>
                </div>
              </div>

              {/* 8-DIMENSION SCORE BREAKDOWN */}
              <div
                style={{
                  padding: '20px 22px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      SCORE BREAKDOWN
                    </h2>
                    <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Every dimension is calculated reproducibly from observable GitHub data. Click{' '}
                      <strong>Why?</strong> on any dimension to inspect raw evidence.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 12,
                  }}
                >
                  {dimensions.map((dim) => {
                    const dimKey = dim.id || dim.key || dim.dimension;
                    const isExpanded = expandedDim === dimKey;
                    const trendVal = dim.delta ?? dim.trendDelta ?? null;
                    return (
                      <div
                        key={dimKey}
                        style={{
                          padding: '14px 16px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 8,
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: '0.84rem',
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {dim.dimension}
                              </span>
                              <div
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--text-muted)',
                                  fontFamily: 'var(--font-mono)',
                                  marginTop: 2,
                                }}
                              >
                                {dim.confidenceLabel || 'High confidence'}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span
                                style={{
                                  fontSize: '0.95rem',
                                  fontWeight: 800,
                                  color: scoreColor(dim.percentage),
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {dim.score} / {dim.maxScore}
                              </span>
                              <div
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--text-secondary)',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {dim.percentage}%
                                {typeof trendVal === 'number' && trendVal !== 0 ? (
                                  <span
                                    style={{
                                      marginLeft: 6,
                                      color: trendVal > 0 ? '#10b981' : '#ef4444',
                                    }}
                                  >
                                    {trendVal > 0 ? `↑ +${trendVal}` : `↓ ${trendVal}`}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div
                            style={{
                              width: '100%',
                              height: 5,
                              background: 'var(--border)',
                              borderRadius: 3,
                              overflow: 'hidden',
                              margin: '10px 0',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(0, dim.percentage))}%`,
                                height: '100%',
                                background: scoreColor(dim.percentage),
                              }}
                            />
                          </div>

                          <div style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {dim.primaryIssue || dim.observation}
                          </div>

                          {isExpanded && (
                            <div
                              style={{
                                marginTop: 10,
                                paddingTop: 10,
                                borderTop: '1px solid var(--border)',
                                fontSize: '0.74rem',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                              }}
                            >
                              {(dim.reasons || []).map((r, i) => (
                                <div key={i}>• {r}</div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: 6,
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          <button
                            onClick={() => setExpandedDim(isExpanded ? null : dimKey)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: 'var(--text-secondary)',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            {isExpanded ? 'Hide details' : 'Details'}
                          </button>

                          <button
                            onClick={() =>
                              setEvidenceItem({
                                title: dim.dimension,
                                category: `DIMENSION EVIDENCE (${dim.score}/${dim.maxScore})`,
                                score: dim.score,
                                maxScore: dim.maxScore,
                                percentage: dim.percentage,
                                confidence: dim.confidence,
                                confidenceLabel: dim.confidenceLabel,
                                observation: dim.observation || dim.primaryIssue,
                                interpretation: dim.interpretation,
                                reasons: dim.reasons || [],
                                evidence: dim.evidence || [],
                              })
                            }
                            style={{
                              padding: '4px 9px',
                              borderRadius: 5,
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border)',
                              color: '#22d3ee',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <HelpCircle size={12} /> Why?
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Priority Recommendations + Featured Repositories Preview */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: 16,
                }}
              >
                {/* Priority Actions */}
                <div
                  style={{
                    padding: '18px 20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Highest-Impact Next Actions
                    </h3>
                    <button
                      onClick={() => setTab('recommendations')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#22d3ee',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      All ({prioritizedRecommendations.length}) →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {prioritizedRecommendations.slice(0, 3).map((rec) => {
                      const sev = SEVERITY_STYLE[rec.severity] || SEVERITY_STYLE.Medium;
                      return (
                        <div
                          key={rec.id}
                          style={{
                            padding: '12px 14px',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: 4,
                                background: sev.bg,
                                border: `1px solid ${sev.border}`,
                                color: sev.color,
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {rec.severity.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: '#10b981',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {rec.estimatedBenefit}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {rec.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                            {rec.observation || rec.rationale}
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            {rec.aiAction && (
                              <button
                                onClick={() =>
                                  setAiModal({
                                    open: true,
                                    actionType: rec.aiAction.type,
                                    targetRepo: rec.aiAction.targetRepo || null,
                                  })
                                }
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 5,
                                  background: 'rgba(168, 85, 247, 0.14)',
                                  border: '1px solid rgba(168, 85, 247, 0.4)',
                                  color: '#e9d5ff',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                              >
                                <Sparkles size={12} /> {rec.aiAction.label}
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setEvidenceItem({
                                  title: rec.title,
                                  category: rec.category,
                                  observation: rec.observation,
                                  interpretation: rec.interpretation || rec.rationale,
                                  evidence: rec.evidence || [],
                                  recommendedAction: (rec.actions || []).join(' '),
                                  aiAction: rec.aiAction,
                                })
                              }
                              style={{
                                padding: '5px 9px',
                                borderRadius: 5,
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                color: '#22d3ee',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                              }}
                            >
                              Why?
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Featured Project Candidates */}
                <div
                  style={{
                    padding: '18px 20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Featured Project Candidates
                    </h3>
                    <button
                      onClick={() => setTab('repositories')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#22d3ee',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Inspect all ({allRepositories.length}) →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(projDepth.featured_candidates || allRepositories.slice(0, 3))
                      .slice(0, 3)
                      .map((cand) => {
                        const reasons = cand.standout_reasons || cand.why_stands_out || [];
                        return (
                          <div
                            key={cand.name}
                            onClick={() => {
                              const match =
                                allRepositories.find((r) => r.name === cand.name) || cand;
                              setTab('repositories');
                              setSelectedRepo(match);
                            }}
                            style={{
                              padding: '12px 14px',
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              cursor: 'pointer',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  color: '#22d3ee',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {cand.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontFamily: 'var(--font-mono)',
                                  color: scoreColor(cand.health_score || 60),
                                }}
                              >
                                Health {cand.health_score}/100 •{' '}
                                {cand.depth_classification || cand.depth_category}
                              </span>
                            </div>
                            <div
                              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 8px' }}
                            >
                              {cand.description || 'No description provided.'}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {reasons.slice(0, 4).map((w, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '0.69rem',
                                    padding: '2px 7px',
                                    borderRadius: 4,
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    fontFamily: 'var(--font-mono)',
                                  }}
                                >
                                  ✓ {w}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: PROFILE COMPLETENESS & DISCOVERABILITY
             ========================================================= */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  padding: '20px 22px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      PROFILE COMPLETENESS ({completenessDim?.percentage ?? 0} / 100)
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {completeness.present_count ?? 0} of {completeness.total_count ?? 6} core
                      public identity signals are currently populated.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() =>
                        setAiModal({ open: true, actionType: 'profile_bio', targetRepo: null })
                      }
                      style={{
                        padding: '7px 12px',
                        borderRadius: 6,
                        background: 'rgba(168, 85, 247, 0.14)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: '#e9d5ff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Generate Bio
                    </button>
                    <button
                      onClick={() =>
                        setAiModal({ open: true, actionType: 'profile_readme', targetRepo: null })
                      }
                      style={{
                        padding: '7px 12px',
                        borderRadius: 6,
                        background: 'rgba(168, 85, 247, 0.14)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: '#e9d5ff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Generate Profile README
                    </button>
                    <button
                      onClick={() =>
                        setAiModal({
                          open: true,
                          actionType: 'project_highlights',
                          targetRepo: null,
                        })
                      }
                      style={{
                        padding: '7px 12px',
                        borderRadius: 6,
                        background: 'rgba(168, 85, 247, 0.14)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        color: '#e9d5ff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Generate Project Highlights
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 12,
                  }}
                >
                  {(completeness.elements || []).map((el) => (
                    <div
                      key={el.id || el.key || el.label}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--bg-subtle)',
                        border: `1px solid ${
                          el.present ? 'rgba(16, 185, 129, 0.28)' : 'rgba(245, 158, 11, 0.3)'
                        }`,
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {el.label}
                        </span>
                        {el.present ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#10b981',
                              fontFamily: 'var(--font-mono)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={13} /> Present
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#f59e0b',
                              fontFamily: 'var(--font-mono)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <AlertTriangle size={13} /> Unavailable
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                        <strong>Observation:</strong> {el.observation}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        <strong>Why it matters:</strong> {el.why_it_matters}
                      </div>
                      {!el.present && el.recommended_action && (
                        <div
                          style={{
                            fontSize: '0.74rem',
                            color: '#22d3ee',
                            paddingTop: 6,
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          <strong>Recommended action:</strong> {el.recommended_action}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* DISCOVERABILITY & DOCUMENTATION INTELLIGENCE */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    padding: '18px 20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <h3 style={{ margin: '0 0 8px', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    DISCOVERABILITY ({discoverabilityDim?.percentage ?? 0} / 100)
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Evaluates how easily engineers and recruiters can understand and navigate your
                    public repositories.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(discIntel.present || []).map((p, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '0.77rem',
                          color: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <CheckCircle2 size={13} /> {p}
                      </div>
                    ))}
                    {(discIntel.missing || []).map((m, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: '0.77rem',
                          color: '#f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <XCircle size={13} /> Missing: {m}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    padding: '18px 20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <h3 style={{ margin: '0 0 8px', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    DOCUMENTATION HEALTH ({docIntel.score ?? 0} / 100)
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {docIntel.readme_count ?? 0} of {docIntel.inspected_count ?? 0} deeply inspected
                    repositories contain README files.
                  </p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      fontSize: '0.76rem',
                    }}
                  >
                    <div>
                      <div style={{ color: '#10b981', fontWeight: 700, marginBottom: 4 }}>
                        Strong Signals
                      </div>
                      {(docIntel.strong_areas || []).length > 0 ? (
                        docIntel.strong_areas.map((s, idx) => (
                          <div key={idx} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                            ✓ {s}
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text-muted)' }}>None consistently detected</div>
                      )}
                    </div>
                    <div>
                      <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>
                        Missing Across Repos
                      </div>
                      {(docIntel.missing_areas || []).map((m, idx) => (
                        <div key={idx} style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                          × {m}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 3: REPOSITORIES (TABLE + COMPARISON + DEPTH)
             ========================================================= */}
          {activeTab === 'repositories' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Controls Bar */}
              <div
                style={{
                  padding: '14px 18px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={13}
                      color="#71717a"
                      style={{ position: 'absolute', left: 10, top: 9 }}
                    />
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder="Filter repositories..."
                      style={{
                        padding: '6px 10px 6px 28px',
                        borderRadius: 6,
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: '0.78rem',
                        width: 210,
                      }}
                    />
                  </div>

                  <select
                    value={repoStatusFilter}
                    onChange={(e) => setRepoStatusFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.76rem',
                    }}
                  >
                    <option value="ALL">All Lifecycle States</option>
                    <option value="Active">Active</option>
                    <option value="Recently created">Recently created</option>
                    <option value="Stable">Stable</option>
                    <option value="Dormant">Dormant</option>
                    <option value="Archived">Archived</option>
                  </select>

                  <select
                    value={repoDepthFilter}
                    onChange={(e) => setRepoDepthFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.76rem',
                    }}
                  >
                    <option value="ALL">All Depth Tiers</option>
                    <option value="Flagship">Flagship ({projDepth.flagship_count ?? 0})</option>
                    <option value="Supporting">
                      Supporting ({projDepth.supporting_count ?? 0})
                    </option>
                    <option value="Experimental">
                      Experimental ({projDepth.experimental_count ?? 0})
                    </option>
                    <option value="Dormant">Dormant ({projDepth.dormant_count ?? 0})</option>
                  </select>
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  Showing {filteredRepos.length} of {allRepositories.length} original repositories •
                  Select checkboxes to compare
                </div>
              </div>

              {/* Multi-Repository Comparison Matrix */}
              {comparedRepos.length >= 2 && (
                <div
                  style={{
                    padding: '18px 20px',
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    borderRadius: 10,
                    overflowX: 'auto',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#22d3ee',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <GitCompare size={15} /> REPOSITORY COMPARISON ({comparedRepos.length}{' '}
                      SELECTED)
                    </div>
                    <button
                      onClick={() => setCompareRepoNames([])}
                      style={{
                        padding: '4px 9px',
                        borderRadius: 5,
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      Clear comparison
                    </button>
                  </div>

                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.78rem',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 10px' }}>Dimension</th>
                        {comparedRepos.map((r) => (
                          <th
                            key={r.name}
                            style={{
                              padding: '8px 10px',
                              color: 'var(--text-primary)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {r.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: 'Repository Health',
                          render: (r) => `${r.health_score ?? 0} / 100`,
                        },
                        {
                          label: 'Project Depth Tier',
                          render: (r) =>
                            `${r.depth_classification || r.depth_category} (${
                              r.depth_score ?? 0
                            }/100)`,
                        },
                        {
                          label: 'Lifecycle & Activity',
                          render: (r) =>
                            `${r.lifecycle_state || r.status} (${
                              r.days_since_push ?? 0
                            }d since push)`,
                        },
                        {
                          label: 'Documentation Score',
                          render: (r) =>
                            `${r.readme?.score ?? r.breakdown?.documentation ?? 0}/100 (${
                              r.readme?.exists ? 'README present' : 'No README'
                            })`,
                        },
                        {
                          label: 'Engineering Signals',
                          render: (r) =>
                            `${r.engineering?.score ?? 0}/100 • Tests: ${
                              r.engineering?.has_tests ? 'Yes' : 'No'
                            } • CI: ${r.engineering?.has_ci ? 'Yes' : 'No'}`,
                        },
                        {
                          label: 'Technology Diversity',
                          render: (r) =>
                            `${r.language || 'N/A'} • ${(r.detected_technologies || []).join(', ') || 'Standard'}`,
                        },
                        {
                          label: 'Community Signals',
                          render: (r) =>
                            `${r.stargazers_count ?? 0} stars • ${r.forks_count ?? 0} forks`,
                        },
                      ].map((row) => (
                        <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {row.label}
                          </td>
                          {comparedRepos.map((r) => (
                            <td
                              key={r.name}
                              style={{
                                padding: '8px 10px',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {row.render(r)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Repositories Intelligence Table */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  overflowX: 'auto',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.79rem',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      <th style={{ padding: '11px 12px', width: 34 }}>Cmp</th>
                      {[
                        { key: 'name', label: 'Repository' },
                        { key: 'status', label: 'Lifecycle' },
                        { key: 'depth_score', label: 'Depth' },
                        { key: 'health_score', label: 'Health' },
                        { key: 'docs', label: 'Docs' },
                        { key: 'engineering', label: 'Engineering' },
                        { key: 'stars', label: 'Stars' },
                        { key: 'updated', label: 'Updated' },
                      ].map((col) => (
                        <th
                          key={col.key}
                          onClick={() => {
                            if (repoSortBy === col.key) setRepoSortAsc(!repoSortAsc);
                            else {
                              setRepoSortBy(col.key);
                              setRepoSortAsc(false);
                            }
                          }}
                          style={{ padding: '11px 12px', cursor: 'pointer', userSelect: 'none' }}
                        >
                          {col.label}{' '}
                          {repoSortBy === col.key ? (repoSortAsc ? '↑' : '↓') : ''}
                        </th>
                      ))}
                      <th style={{ padding: '11px 12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRepos.map((repo) => {
                      const lifecycle = repo.lifecycle_state || repo.status || 'Stable';
                      const depthTier = repo.depth_classification || repo.depth_category || 'Supporting';
                      const docScore = repo.readme?.score ?? repo.breakdown?.documentation ?? 0;
                      const engScore = repo.engineering?.score ?? repo.breakdown?.engineering ?? 0;
                      const starsCount = repo.stargazers_count ?? repo.stars ?? 0;
                      const daysAgo = repo.days_since_push ?? 0;
                      const st = STATUS_STYLE[lifecycle] || STATUS_STYLE.Stable;
                      const isCompared = compareRepoNames.includes(repo.name);
                      return (
                        <tr
                          key={repo.name}
                          onClick={() => setSelectedRepo(repo)}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            background: isCompared ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                          }}
                        >
                          <td
                            style={{ padding: '11px 12px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompareRepo(repo.name);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isCompared}
                              onChange={() => {}}
                              aria-label={`Compare ${repo.name}`}
                            />
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <div
                              style={{
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {repo.name}
                            </div>
                            <div
                              style={{
                                fontSize: '0.71rem',
                                color: 'var(--text-muted)',
                                maxWidth: 280,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {repo.description || 'No description'}
                            </div>
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <span
                              style={{
                                padding: '2px 7px',
                                borderRadius: 4,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: st.bg,
                                border: `1px solid ${st.border}`,
                                color: st.color,
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {lifecycle}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '11px 12px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.74rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {depthTier}
                          </td>
                          <td
                            style={{
                              padding: '11px 12px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              color: scoreColor(repo.health_score || 0),
                            }}
                          >
                            {repo.health_score ?? 0}/100
                          </td>
                          <td
                            style={{
                              padding: '11px 12px',
                              fontFamily: 'var(--font-mono)',
                              color: scoreColor(docScore),
                            }}
                          >
                            {docScore}%
                          </td>
                          <td
                            style={{
                              padding: '11px 12px',
                              fontFamily: 'var(--font-mono)',
                              color: scoreColor(engScore),
                            }}
                          >
                            {engScore}%
                          </td>
                          <td
                            style={{
                              padding: '11px 12px',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {starsCount}
                          </td>
                          <td
                            style={{
                              padding: '11px 12px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.73rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {daysAgo}d ago
                          </td>
                          <td
                            style={{ padding: '11px 12px', textAlign: 'right' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <button
                                onClick={() =>
                                  setAiModal({
                                    open: true,
                                    actionType: 'repo_readme',
                                    targetRepo: repo.name,
                                  })
                                }
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  background: 'rgba(168, 85, 247, 0.14)',
                                  border: '1px solid rgba(168, 85, 247, 0.35)',
                                  color: '#e9d5ff',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                AI README
                              </button>
                              <button
                                onClick={() => setSelectedRepo(repo)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  background: 'var(--bg-subtle)',
                                  border: '1px solid var(--border)',
                                  color: '#22d3ee',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Inspect →
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 4: ACTIVITY INTELLIGENCE
             ========================================================= */}
          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Top Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: 12,
                }}
              >
                {[
                  {
                    label: 'Most Active Period',
                    val: actIntel.most_active_period || 'No recent activity',
                  },
                  {
                    label: 'Longest Public Streak',
                    val: `${actIntel.longest_streak_days ?? 0} days`,
                  },
                  {
                    label: 'Public Events Observed',
                    val: `${actIntel.event_breakdown?.total_public_events ?? 0} events`,
                  },
                  {
                    label: 'Active Repositories (90d)',
                    val:
                      repoAnalysis.repos_pushed_90d ??
                      (actIntel.active_repositories || []).length ??
                      0,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    style={{
                      padding: '14px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        marginTop: 6,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {m.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* 12-Month Activity Pattern */}
              <div
                style={{
                  padding: '20px 22px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <h3 style={{ margin: '0 0 6px', fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                  Activity Pattern (Last 12 Months)
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Derived from public events and repository push timestamps. Higher public activity
                  reflects public iteration frequency rather than engineering seniority.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(actIntel.monthly_timeline || []).map((m) => {
                    const sigCount = m.total_signal ?? m.count ?? 0;
                    const maxVal = Math.max(
                      1,
                      ...(actIntel.monthly_timeline || []).map(
                        (x) => x.total_signal ?? x.count ?? 0
                      )
                    );
                    const widthPct = Math.round((sigCount / maxVal) * 100);
                    return (
                      <div
                        key={m.month}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '90px 1fr 85px',
                          alignItems: 'center',
                          gap: 12,
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.76rem',
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>{m.label || m.month}</span>
                        <div
                          style={{
                            height: 10,
                            background: 'var(--bg-subtle)',
                            borderRadius: 4,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${widthPct}%`,
                              height: '100%',
                              background: sigCount > 0 ? '#06b6d4' : 'transparent',
                            }}
                          />
                        </div>
                        <span style={{ textAlign: 'right', color: 'var(--text-primary)' }}>
                          {sigCount} {sigCount === 1 ? 'signal' : 'signals'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contextual Activity Insights & Active vs Dormant Lists */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    padding: '16px 18px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: 10,
                    }}
                  >
                    OBSERVED ACTIVITY INSIGHTS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(actIntel.insights || []).map((ins, i) => (
                      <div key={i} style={{ fontSize: '0.79rem', color: 'var(--text-secondary)' }}>
                        • {ins}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px 18px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: 10,
                    }}
                  >
                    ACTIVE VS RECENTLY INACTIVE REPOSITORIES
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#10b981', marginBottom: 8 }}>
                    <strong>Active repositories:</strong>{' '}
                    {(actIntel.active_repositories || []).join(', ') || 'None'}
                  </div>
                  <div style={{ fontSize: '0.77rem', color: '#f59e0b' }}>
                    <strong>Recently inactive (&gt;180d):</strong>{' '}
                    {(actIntel.recently_inactive_repositories || []).join(', ') || 'None'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 5: TECHNOLOGY INTELLIGENCE & DEVELOPER DNA
             ========================================================= */}
          {activeTab === 'technology' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: 16,
                }}
              >
                {/* Repository Language Distribution */}
                <div
                  style={{
                    padding: '20px 22px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                      Technology Footprint
                    </h3>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: '#22d3ee',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Repository language distribution
                    </span>
                  </div>
                  <p style={{ margin: '0 0 14px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Reflects primary language distribution across public repositories (not a direct
                    measure of proficiency).
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {techFootprint.map((lang) => {
                      const repoNames = lang.repositories || lang.repos || [];
                      return (
                        <div key={lang.name}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.78rem',
                              marginBottom: 4,
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{lang.name}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {lang.percentage}% ({lang.count ?? repoNames.length} repos)
                            </span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              background: 'var(--bg-subtle)',
                              borderRadius: 3,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${lang.percentage}%`,
                                height: '100%',
                                background: '#06b6d4',
                              }}
                            />
                          </div>
                          {repoNames.length > 0 && (
                            <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginTop: 3 }}>
                              Detected in: {repoNames.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DEVELOPER DNA */}
                <div
                  style={{
                    padding: '20px 22px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <h3 style={{ margin: '0 0 6px', fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                    DEVELOPER DNA (Observable Technical Patterns)
                  </h3>
                  <p style={{ margin: '0 0 14px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Derived strictly from repository architectures, frameworks, and file-tree
                    signals. Click any domain to view supporting repository evidence.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {devDna.map((dom) => {
                      const domKey = dom.category || dom.domain;
                      const strengthVal = dom.strength ?? dom.score ?? 0;
                      const selected = selectedDnaDomain === domKey;
                      return (
                        <div
                          key={domKey}
                          onClick={() => setSelectedDnaDomain(selected ? null : domKey)}
                          style={{
                            padding: '10px 12px',
                            background: selected ? 'var(--primary-light)' : 'var(--bg-subtle)',
                            border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.79rem',
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{domKey}</span>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                color: '#22d3ee',
                                fontSize: '0.74rem',
                              }}
                            >
                              {strengthVal}/100 ({dom.repository_count ?? 0} repos)
                            </span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              background: 'var(--border)',
                              borderRadius: 3,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${strengthVal}%`,
                                height: '100%',
                                background: '#a855f7',
                              }}
                            />
                          </div>
                          {selected && (
                            <div
                              style={{
                                marginTop: 8,
                                paddingTop: 8,
                                borderTop: '1px solid var(--border)',
                                fontSize: '0.73rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <strong>Observable Evidence:</strong>
                              {(dom.evidence || []).length > 0 ? (
                                dom.evidence.map((ev, i) => <div key={i}>• {ev}</div>)
                              ) : (
                                <div>• No repositories matched this pattern yet.</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detected Technologies & Ecosystems Grid */}
              <div
                style={{
                  padding: '20px 22px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <h3 style={{ margin: '0 0 12px', fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                  Detected Technologies & Ecosystems ({detectedTech.length})
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: 10,
                  }}
                >
                  {detectedTech.map((t) => (
                    <div
                      key={t.name}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {t.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: '#06b6d4',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {t.category || t.ecosystem}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.71rem',
                          color: 'var(--text-secondary)',
                          marginTop: 6,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        Detected in: {(t.repositories || []).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 6: COMMUNITY & COLLABORATION
             ========================================================= */}
          {activeTab === 'community' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  padding: '20px 22px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <h2 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  COMMUNITY PRESENCE
                </h2>
                <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Follower and star counts are contextual reach indicators, not direct measures of
                  engineering competence.
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  {[
                    { label: 'Followers', val: commIntel.followers ?? report.followers ?? 0 },
                    { label: 'Following', val: commIntel.following ?? report.following ?? 0 },
                    {
                      label: 'Stars Received',
                      val: commIntel.stars_received ?? report.total_stars ?? 0,
                    },
                    {
                      label: 'Forks Received',
                      val: commIntel.forks_received ?? report.total_forks ?? 0,
                    },
                    { label: 'PR Participation', val: commIntel.pr_participation ?? 0 },
                    { label: 'Issue Participation', val: commIntel.issue_participation ?? 0 },
                    { label: 'Starred Repositories', val: commIntel.starred_repos_count ?? 0 },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          marginTop: 4,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {item.val}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <strong>Interpretation:</strong> {commIntel.interpretation}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 7: RECOMMENDATIONS & AI FIXES
             ========================================================= */}
          {activeTab === 'recommendations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Prioritized Optimization Plan ({prioritizedRecommendations.length})
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Ranked by impact, confidence, effort, observable evidence, and your active goal (
                    <strong>{selectedGoal}</strong>).
                  </p>
                </div>

                <div
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#10b981',
                  }}
                >
                  Verified on sync: {Object.keys(verifiedMap).length} • Completed/Planned:{' '}
                  {
                    Object.values(recStatuses).filter(
                      (s) => s === 'completed' || s === 'planned'
                    ).length
                  }
                </div>
              </div>

              {prioritizedRecommendations.map((rec) => {
                const sev = SEVERITY_STYLE[rec.severity] || SEVERITY_STYLE.Medium;
                return (
                  <div
                    key={rec.id}
                    style={{
                      padding: '18px 20px',
                      background: 'var(--bg-card)',
                      border: `1px solid ${
                        rec.isVerified ? 'rgba(16, 185, 129, 0.45)' : 'var(--border)'
                      }`,
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: sev.bg,
                            border: `1px solid ${sev.border}`,
                            color: sev.color,
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {rec.severity.toUpperCase()} PRIORITY
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          [{rec.category}] • Impact: {rec.impact} • Effort: {rec.effort}
                        </span>
                        {rec.isVerified && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: '#10b981',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            ✓ Verified on GitHub Sync
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#10b981',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {rec.estimatedBenefit}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {rec.title}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Why:</strong> {rec.observation || rec.rationale}{' '}
                      {rec.interpretation && (
                        <span style={{ color: 'var(--text-secondary)' }}>{rec.interpretation}</span>
                      )}
                    </div>

                    {rec.verifiedProof && (
                      <div
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: 6,
                          fontSize: '0.76rem',
                          color: '#10b981',
                        }}
                      >
                        <strong>✓ Verification Proof:</strong> {rec.verifiedProof}
                      </div>
                    )}

                    {(rec.actions || []).length > 0 && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: 'var(--bg-subtle)',
                          borderRadius: 7,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            marginBottom: 6,
                          }}
                        >
                          RECOMMENDED ACTION STEPS
                        </div>
                        {rec.actions.map((act, i) => (
                          <div
                            key={i}
                            style={{ fontSize: '0.77rem', color: 'var(--text-primary)', marginBottom: 3 }}
                          >
                            • {act}
                          </div>
                        ))}
                        {rec.verificationCriteria && (
                          <div
                            style={{
                              fontSize: '0.71rem',
                              color: '#22d3ee',
                              marginTop: 6,
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            Verification criteria: {rec.verificationCriteria}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10,
                        paddingTop: 6,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {rec.aiAction && (
                          <button
                            onClick={() =>
                              setAiModal({
                                open: true,
                                actionType: rec.aiAction.type,
                                targetRepo: rec.aiAction.targetRepo || null,
                              })
                            }
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              background: 'rgba(168, 85, 247, 0.15)',
                              border: '1px solid rgba(168, 85, 247, 0.45)',
                              color: '#e9d5ff',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Sparkles size={13} /> {rec.aiAction.label}
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyChecklist(rec)}
                          style={{
                            padding: '6px 11px',
                            borderRadius: 6,
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          {copiedId === rec.id ? (
                            <Check size={12} color="#10b981" />
                          ) : (
                            <Copy size={12} />
                          )}
                          {copiedId === rec.id ? 'Copied' : 'Copy checklist'}
                        </button>

                        <button
                          onClick={() =>
                            setEvidenceItem({
                              title: rec.title,
                              category: rec.category,
                              observation: rec.observation,
                              interpretation: rec.interpretation || rec.rationale,
                              evidence: rec.evidence || [],
                              recommendedAction: (rec.actions || []).join(' '),
                              aiAction: rec.aiAction,
                            })
                          }
                          style={{
                            padding: '6px 11px',
                            borderRadius: 6,
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: '#22d3ee',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <HelpCircle size={12} /> Why?
                        </button>
                      </div>

                      {!rec.isVerified && (
                        <select
                          value={rec.status}
                          onChange={(e) => handleRecStatusChange(rec.id, e.target.value)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '0.74rem',
                          }}
                        >
                          <option value="open">Status: Open</option>
                          <option value="planned">Mark as Planned</option>
                          <option value="completed">Mark as Completed (Pending Sync Verify)</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================
              TAB 8: HISTORY, CHANGE DETECTION & PEER COMPARISON
             ========================================================= */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: 16,
                }}
              >
                {/* SCORE HISTORY */}
                <div
                  style={{
                    padding: '20px 22px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    SCORE HISTORY
                  </h3>
                  {scoreHistory.length <= 1 ? (
                    <div
                      style={{
                        padding: '14px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: '0.79rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Historical analysis begins after the first snapshot. Current baseline snapshot:{' '}
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {totalScore} / 100
                      </strong>{' '}
                      ({new Date(syncedAtTimestamp || Date.now()).toLocaleDateString()}).
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {scoreHistory.map((snap, idx) => {
                        const dt = snap.analyzedAt || snap.timestamp;
                        return (
                          <div
                            key={snap.id || snap._id || idx}
                            style={{
                              padding: '10px 12px',
                              background: 'var(--bg-subtle)',
                              border: '1px solid var(--border)',
                              borderRadius: 7,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.78rem',
                            }}
                          >
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {dt ? new Date(dt).toLocaleString() : `Snapshot #${idx + 1}`}
                            </span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                              {snap.overallScore ?? snap.report?.overall_score ?? 0} / 100{' '}
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                ({snap.methodologyVersion || 'v2.1'})
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* WHAT CHANGED? SNAPSHOT DIFF */}
                <div
                  style={{
                    padding: '20px 22px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}
                >
                  <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    WHAT CHANGED?
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Diff comparison between the current GitHub snapshot and the previous snapshot.
                  </p>
                  {changesList.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {changesList.map((chg, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 12px',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 7,
                            fontSize: '0.77rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#22d3ee',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {chg.title || chg.label}
                          </div>
                          {chg.detail && (
                            <div style={{ color: 'var(--text-secondary)', marginTop: 2, fontSize: '0.73rem' }}>
                              {chg.detail}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      No repository or profile diffs detected since the previous snapshot. Click{' '}
                      <strong>Sync now</strong> after pushing updates to GitHub to detect changes
                      and automatically verify recommendations.
                    </div>
                  )}
                </div>
              </div>

              {/* Live Public Peer Comparison */}
              <div
                style={{
                  padding: '20px 22px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Compare Against Another Public GitHub Profile
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Run the same v2.1 multidimensional methodology on any public GitHub username for
                  side-by-side benchmarking.
                </p>

                <form
                  onSubmit={handleComparePeer}
                  style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}
                >
                  <input
                    type="text"
                    value={peerUsername}
                    onChange={(e) => setPeerUsername(e.target.value)}
                    placeholder="Enter peer GitHub username..."
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      minWidth: 240,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={peerLoading || !peerUsername.trim()}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: '#06b6d4',
                      border: 'none',
                      color: '#09090b',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: peerLoading ? 'wait' : 'pointer',
                    }}
                  >
                    {peerLoading ? 'Analyzing Peer...' : 'Compare Profiles'}
                  </button>
                </form>

                {peerError && (
                  <div style={{ fontSize: '0.78rem', color: '#ef4444', marginBottom: 10 }}>
                    {peerError}
                  </div>
                )}

                {peerReport && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {[report, peerReport].map((rep, i) => {
                      const uname = rep.username || rep.profile?.login || '';
                      const sc = rep.totalScore ?? rep.overall_score ?? rep.overallScore ?? 0;
                      const rCount = (rep.repositories || rep.repo_analysis?.repositories || [])
                        .length;
                      const tCount = (
                        rep.detected_technologies ||
                        rep.repo_analysis?.detected_technologies ||
                        []
                      ).length;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: 14,
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.86rem',
                              fontWeight: 700,
                              color: '#22d3ee',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            @{uname}
                          </div>
                          <div
                            style={{
                              fontSize: '1.4rem',
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                              margin: '6px 0',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {sc} / 100
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            Original Repos: {rCount} • Verified Tech: {tCount}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* REUSABLE EVIDENCE DRAWER */}
      <EvidenceDrawer
        isOpen={Boolean(evidenceItem)}
        onClose={() => setEvidenceItem(null)}
        evidenceData={evidenceItem}
        syncedAt={syncedAtTimestamp}
        methodologyVersion={report.methodologyVersion || 'v2.1'}
        onTriggerAiFix={(actionType, targetRepo) => {
          setEvidenceItem(null);
          setAiModal({ open: true, actionType, targetRepo });
        }}
      />

      {/* AI ACTION MODAL */}
      <AIActionModal
        isOpen={aiModal.open}
        onClose={() => setAiModal({ open: false, actionType: null, targetRepo: null })}
        actionType={aiModal.actionType}
        targetRepo={aiModal.targetRepo}
        report={report}
      />

      {/* MULTI-FORMAT EXPORT DIALOG */}
      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        report={report}
      />
    </div>
  );
}
