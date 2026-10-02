import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Search,
  LayoutDashboard,
  Github,
  BookOpen,
  TrendingUp,
  Briefcase,
  GitPullRequest,
  Trophy,
  User,
  Code,
  FileText,
  CornerDownLeft,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
  Layers
} from 'lucide-react';
import { copyToClipboard } from '../utils/exportUtils';

const BASE_COMMANDS = [
  { id: 'nav-overview', group: 'WORKSPACE', label: 'Workspace Overview', sub: 'Cross-pipeline developer telemetry', icon: LayoutDashboard, route: '/dashboard' },
  { id: 'nav-gh-overview', group: 'GITHUB INTELLIGENCE', label: 'GitHub Intelligence — Overview', sub: 'Profile health, 8-dimension breakdown & projections', icon: Github, route: '/github?tab=overview' },
  { id: 'nav-gh-profile', group: 'GITHUB INTELLIGENCE', label: 'GitHub Intelligence — Profile Completeness', sub: 'Identity, bio, links, and Profile README analysis', icon: User, route: '/github?tab=profile' },
  { id: 'nav-gh-repos', group: 'GITHUB INTELLIGENCE', label: 'GitHub Intelligence — Repositories', sub: 'Sortable repository health table, deep dive & comparison', icon: Code, route: '/github?tab=repositories' },
  { id: 'nav-gh-activity', group: 'GITHUB INTELLIGENCE', label: 'GitHub Intelligence — Activity & Cadence', sub: 'Monthly activity timeline, streaks & repository lifecycle', icon: TrendingUp, route: '/github?tab=activity' },
  { id: 'nav-gh-tech', group: 'GITHUB INTELLIGENCE', label: 'GitHub Intelligence — Technology & Developer DNA', sub: 'Language distribution, detected ecosystems & DNA evidence', icon: Layers, route: '/github?tab=technology' },
  { id: 'nav-gh-community', group: 'GITHUB INTELLIGENCE', label: 'GitHub Intelligence — Community & Discoverability', sub: 'Followers, stars, forks & search discoverability signals', icon: GitPullRequest, route: '/github?tab=community' },
  { id: 'nav-gh-recs', group: 'GITHUB INTELLIGENCE', label: 'GitHub Intelligence — Recommendations & Fixes', sub: 'Prioritized improvements, AI generators & verification', icon: Sparkles, route: '/github?tab=recommendations' },
  { id: 'nav-gh-history', group: 'GITHUB INTELLIGENCE', label: 'GitHub Intelligence — History & What Changed', sub: 'Snapshot diffs, score history & peer comparison', icon: FileText, route: '/github?tab=history' },
  { id: 'nav-research', group: 'INTELLIGENCE', label: 'Research Paper Synthesizer', sub: 'ArXiv paper intuition, architecture, and proofs', icon: BookOpen, route: '/research' },
  { id: 'nav-market', group: 'INTELLIGENCE', label: 'Market Demand Forecaster', sub: '26-week Prophet time-series & skill demand', icon: TrendingUp, route: '/market' },
  { id: 'nav-jobs', group: 'INTELLIGENCE', label: 'Jobs & ATS Resume Match', sub: 'Semantic role alignment & gap analysis', icon: Briefcase, route: '/jobs' },
  { id: 'nav-opensource', group: 'DISCOVERY', label: 'Open Source Contribution Finder', sub: 'Curated issues & PR architecture blueprints', icon: GitPullRequest, route: '/opensource' },
  { id: 'nav-contests', group: 'DISCOVERY', label: 'Competitive Programming Contests', sub: 'Live Codeforces, LeetCode, CodeChef calendar', icon: Trophy, route: '/contests' },
  { id: 'nav-profile', group: 'PROFILE', label: 'Developer Identity & Settings', sub: 'Target stack, roles, and account configuration', icon: User, route: '/profile' }
];

const AI_PRESET_PROMPTS = [
  'Why is my GitHub score low?',
  'What are my weakest repositories?',
  'Which projects should I showcase?',
  'What should I fix first?',
  'Explain my documentation score',
  'What changed since my last sync?',
  'Compare my repositories',
  'Show my primary technology footprint'
];

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeReport, setActiveReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [copiedAi, setCopiedAi] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAiResponse(null);
      setTimeout(() => inputRef.current?.focus(), 40);
      if (window.__INNOVATEX_GITHUB_REPORT__) {
        setActiveReport(window.__INNOVATEX_GITHUB_REPORT__);
      } else {
        api.get('/github/latest')
          .then((res) => {
            if (res.data) {
              window.__INNOVATEX_GITHUB_REPORT__ = res.data;
              setActiveReport(res.data);
            }
          })
          .catch(() => {});
      }
    } else {
      setQuery('');
      setAiResponse(null);
    }
  }, [isOpen]);

  // Build dynamic search index from analyzed GitHub data (Section 31)
  const allItems = useMemo(() => {
    const dynamic = [];
    if (activeReport && activeReport.username) {
      const repos = activeReport.repositories || activeReport.best_repos || [];
      const techs = activeReport.detected_technologies || [];
      const recs = activeReport.recommendations || [];

      // AI Command Center preset queries
      AI_PRESET_PROMPTS.forEach((promptText, idx) => {
        dynamic.push({
          id: `ai-preset-${idx}`,
          group: 'AI COMMAND CENTER',
          label: promptText,
          sub: `Ask AI using @${activeReport.username}'s live GitHub telemetry`,
          icon: Sparkles,
          aiQuery: promptText
        });
      });

      // Actions
      dynamic.push({
        id: 'act-gen-profile-readme',
        group: 'AI FIX ACTION',
        label: `Generate Profile README for @${activeReport.username}`,
        sub: 'Create a tailored README.md from observed technologies and flagship repos',
        icon: Sparkles,
        customEvent: { name: 'github-command-action', detail: { type: 'ai-generate', actionType: 'profile_readme' } }
      });

      dynamic.push({
        id: 'act-export-report',
        group: 'REPORT',
        label: `Export GitHub Intelligence Report (@${activeReport.username})`,
        sub: 'Download PDF, Markdown, JSON, or CSV audit dossier',
        icon: FileText,
        customEvent: { name: 'open-github-export', detail: {} }
      });

      // Repositories (Repository, Documentation analysis, Activity, Actions)
      repos.forEach((r) => {
        dynamic.push({
          id: `repo-detail-${r.name}`,
          group: 'REPOSITORY',
          label: `${r.name} — Repository Intelligence (${r.health_score ?? 0}/100)`,
          sub: `${r.language || 'Code'} • ${r.lifecycle_state || 'Active'} • ${r.depth_classification || 'Project'} • ★ ${r.stargazers_count || 0}`,
          icon: Code,
          customEvent: { name: 'github-command-action', detail: { type: 'inspect-repo', repoName: r.name } }
        });

        dynamic.push({
          id: `repo-readme-ai-${r.name}`,
          group: 'AI FIX ACTION',
          label: `Generate README for ${r.name}`,
          sub: `Documentation score: ${r.readme?.score ?? 0}/100 • Auto-generate structured README.md`,
          icon: Sparkles,
          customEvent: { name: 'github-command-action', detail: { type: 'ai-generate', actionType: 'repo_readme', targetRepo: r.name } }
        });
      });

      // Technologies
      techs.forEach((t) => {
        dynamic.push({
          id: `tech-${t.name}`,
          group: 'TECHNOLOGY',
          label: `Show ${t.name} projects (${t.count} repos)`,
          sub: `Detected in: ${(t.repositories || []).join(', ')}`,
          icon: Layers,
          customEvent: { name: 'github-command-action', detail: { type: 'filter-tech', tech: t.name } }
        });
      });

      // Recommendations
      recs.forEach((rec) => {
        dynamic.push({
          id: `rec-${rec.id}`,
          group: `RECOMMENDATION (${rec.severity.toUpperCase()})`,
          label: rec.title,
          sub: `${rec.observation} (${rec.estimatedBenefit})`,
          icon: CheckCircle2,
          route: '/github?tab=recommendations'
        });
      });
    }

    return [...dynamic, ...BASE_COMMANDS];
  }, [activeReport]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return allItems.slice(0, 18);
    }
    const q = query.toLowerCase().trim();
    const matched = allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );

    // Always allow asking the exact typed query to the AI Command Center
    const askItem = {
      id: 'ai-custom-query',
      group: 'ASK AI COMMAND CENTER',
      label: `Ask AI: "${query.trim()}"`,
      sub: activeReport?.username
        ? `Analyze @${activeReport.username}'s real GitHub snapshot to answer this question`
        : 'Query GitHub Intelligence AI engine',
      icon: Sparkles,
      aiQuery: query.trim()
    };

    return [askItem, ...matched.slice(0, 20)];
  }, [query, allItems, activeReport]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleRunAiQuery = async (qText) => {
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await api.post('/github/ai-ask', {
        query: qText,
        report: activeReport || {},
        changes: activeReport?.changes || []
      });
      setAiResponse(res.data);
    } catch (err) {
      setAiResponse({
        query: qText,
        answer: err.response?.data?.error || 'Unable to execute AI command right now. Ensure a GitHub profile is synced.'
      });
    } finally {
      setAiLoading(false);
    }
  };

  const executeCommand = (cmd) => {
    if (cmd.aiQuery) {
      handleRunAiQuery(cmd.aiQuery);
      return;
    }
    onClose();
    if (cmd.customEvent) {
      if (!window.location.pathname.startsWith('/github')) {
        navigate('/github');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent(cmd.customEvent.name, { detail: cmd.customEvent.detail }));
        }, 120);
      } else {
        window.dispatchEvent(new CustomEvent(cmd.customEvent.name, { detail: cmd.customEvent.detail }));
      }
      return;
    }
    if (cmd.route) {
      navigate(cmd.route);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (aiResponse) {
        setAiResponse(null);
      } else {
        onClose();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(filteredItems.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeCommand(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search and AI Command Center"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '660px',
          background: '#0c0c10',
          border: '1px solid #242432',
          borderRadius: '6px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.92)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderBottom: '1px solid #1a1a24',
            background: '#09090c'
          }}
        >
          <Search size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              activeReport?.username
                ? `Search @${activeReport.username}'s repositories, technologies, insights, or ask AI...`
                : 'Search repositories, technologies, recommendations, or ask AI...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#f4f4f6',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              padding: 0,
              boxShadow: 'none'
            }}
          />
          <span
            style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono)',
              color: '#71717a',
              padding: '2px 6px',
              borderRadius: '3px',
              background: '#14141d',
              border: '1px solid #222230',
              flexShrink: 0
            }}
          >
            ESC
          </span>
        </div>

        {/* AI Command Response View */}
        {(aiLoading || aiResponse) && (
          <div
            style={{
              padding: '1.25rem',
              borderBottom: '1px solid #1a1a24',
              background: '#0e0e14',
              maxHeight: '380px',
              overflowY: 'auto'
            }}
          >
            {aiLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#a855f7', fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Evaluating GitHub snapshot telemetry for your query...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: 'rgba(168, 85, 247, 0.14)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        color: '#c084fc',
                        fontWeight: 700
                      }}
                    >
                      AI COMMAND CENTER • {aiResponse.methodologyVersion || 'v2.1'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#a1a1aa', fontWeight: 600 }}>
                      {aiResponse.query}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await copyToClipboard(aiResponse.answer || '');
                        setCopiedAi(true);
                        setTimeout(() => setCopiedAi(false), 2000);
                      }}
                      style={{
                        background: '#161622',
                        border: '1px solid #262636',
                        color: '#a1a1aa',
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedAi ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copiedAi ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiResponse(null)}
                      style={{
                        background: '#161622',
                        border: '1px solid #262636',
                        color: '#a1a1aa',
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Back to Results
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.83rem',
                    color: '#e4e4e7',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    background: '#09090c',
                    border: '1px solid #1c1c26',
                    borderRadius: '4px',
                    padding: '0.9rem 1rem'
                  }}
                >
                  {aiResponse.answer}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Command & Search Results List */}
        {!aiResponse && !aiLoading && (
          <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.35rem' }}>
            {filteredItems.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              const isAi = cmd.group.includes('AI');

              return (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    background: isSelected ? '#151520' : 'transparent',
                    border: isSelected ? '1px solid #262638' : '1px solid transparent',
                    cursor: 'pointer',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '4px',
                        background: isAi ? 'rgba(168, 85, 247, 0.12)' : '#121218',
                        border: isAi ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid #222230',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isAi ? '#c084fc' : isSelected ? '#38bdf8' : '#a1a1aa',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={13} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f4f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cmd.label}
                      </div>
                      <div
                        style={{
                          fontSize: '0.71rem',
                          color: '#71717a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {cmd.sub}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: '2px',
                        background: isAi ? 'rgba(168, 85, 247, 0.12)' : '#111116',
                        border: isAi ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid #1e1e2a',
                        color: isAi ? '#c084fc' : '#71717a'
                      }}
                    >
                      {cmd.group}
                    </span>
                    {isSelected && <CornerDownLeft size={12} style={{ color: '#38bdf8' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: '0.45rem 1rem',
            borderTop: '1px solid #181822',
            background: '#09090c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.66rem',
            color: '#71717a',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Execute / Ask AI</span>
            <span>ESC Close</span>
          </div>
          <span>
            {activeReport?.username ? `ACTIVE SNAPSHOT: @${activeReport.username}` : 'GLOBAL SEARCH & AI COMMAND'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
