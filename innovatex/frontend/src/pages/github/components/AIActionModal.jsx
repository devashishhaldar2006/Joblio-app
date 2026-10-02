import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, RefreshCw, Edit3, Eye, Download } from 'lucide-react';
import api from '../../../services/api';
import { copyToClipboard, downloadFile } from '../../../utils/exportUtils';
import { useToast } from '../../../context/ToastContext';

const ACTION_METADATA = {
  profile_readme: {
    title: 'AI GENERATED PROFILE README',
    subtitle: 'Tailored README.md for your special username/username profile repository',
    scope: 'profile'
  },
  profile_bio: {
    title: 'AI GENERATED PROFILE BIO',
    subtitle: 'Concise 160-character bio options based on your verified stack',
    scope: 'profile'
  },
  project_highlights: {
    title: 'AI GENERATED PROJECT HIGHLIGHTS',
    subtitle: 'Portfolio & resume summary of your flagship repositories',
    scope: 'profile'
  },
  repo_readme: {
    title: 'AI GENERATED REPOSITORY README',
    subtitle: 'Structured README.md with overview, architecture, setup, and usage',
    scope: 'repo'
  },
  repo_description: {
    title: 'AI GENERATED REPOSITORY DESCRIPTION',
    subtitle: 'Crisp 1-sentence descriptions for the GitHub About sidebar',
    scope: 'repo'
  },
  repo_topics: {
    title: 'AI GENERATED REPOSITORY TOPICS',
    subtitle: 'Discoverability tags derived from your repository languages and stack',
    scope: 'repo'
  },
  repo_summary: {
    title: 'AI GENERATED PROJECT SUMMARY',
    subtitle: 'Technical architecture and engineering overview',
    scope: 'repo'
  }
};

const AIActionModal = ({
  isOpen,
  onClose,
  actionType = 'profile_readme',
  targetRepo = null,
  report
}) => {
  const toast = useToast();
  const [selectedType, setSelectedType] = useState(actionType || 'profile_readme');
  const [selectedRepo, setSelectedRepo] = useState(targetRepo || '');
  const [customInstructions, setCustomInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const repositories = report?.repositories || report?.best_repos || [];

  useEffect(() => {
    if (isOpen) {
      const initType = actionType || 'profile_readme';
      const initRepo = targetRepo || repositories[0]?.name || '';
      setSelectedType(initType);
      setSelectedRepo(initRepo);
      setIsEditing(false);
      triggerGeneration(initType, initRepo, '');
    }
  }, [isOpen, actionType, targetRepo]);

  const triggerGeneration = async (typeToRun, repoToRun, instructions) => {
    if (!report) return;
    setLoading(true);
    try {
      const res = await api.post('/github/ai-generate', {
        action_type: typeToRun,
        report,
        target_repo: repoToRun || null,
        custom_instructions: instructions || null
      });
      setContent(res.data?.content || '');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate AI content');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !report) return null;

  const meta = ACTION_METADATA[selectedType] || ACTION_METADATA.profile_readme;

  const handleCopy = async () => {
    if (!content) return;
    await copyToClipboard(content);
    setCopied(true);
    toast.success('Copied generated content to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    if (!content) return;
    const fname = selectedType.includes('readme')
      ? 'README.md'
      : `${report.username}_${selectedType}.md`;
    downloadFile(fname, content);
    toast.success(`Downloaded ${fname}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          background: '#0b0b0f',
          border: '1px solid #262638',
          borderRadius: '6px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.92)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.35rem',
            borderBottom: '1px solid #1a1a26',
            background: '#09090c',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '2px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.38)',
                  color: '#c084fc',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Sparkles size={11} />
                <span>AI-ASSISTED FIX</span>
              </span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#71717a' }}>
                @{report.username}
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f4f4f6', margin: 0 }}>
              {meta.title}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: '2px 0 0 0' }}>
              {meta.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: '#14141c',
              border: '1px solid #232332',
              borderRadius: '4px',
              padding: '0.35rem',
              color: '#a1a1aa',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Selector Controls */}
        <div
          style={{
            padding: '0.75rem 1.35rem',
            borderBottom: '1px solid #181822',
            background: '#0e0e14',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.65rem'
          }}
        >
          <select
            aria-label="Select AI Fix Type"
            value={selectedType}
            onChange={(e) => {
              const nextType = e.target.value;
              setSelectedType(nextType);
              triggerGeneration(nextType, selectedRepo, customInstructions);
            }}
            style={{
              padding: '0.38rem 0.65rem',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              background: '#12121a',
              border: '1px solid #242434',
              borderRadius: '4px',
              color: '#f4f4f6'
            }}
          >
            <optgroup label="Profile Fixes">
              <option value="profile_readme">Generate Profile README</option>
              <option value="profile_bio">Generate Profile Bio</option>
              <option value="project_highlights">Generate Project Highlights</option>
            </optgroup>
            <optgroup label="Repository Fixes">
              <option value="repo_readme">Generate Repository README</option>
              <option value="repo_description">Generate Repository Description</option>
              <option value="repo_topics">Generate Repository Topics</option>
              <option value="repo_summary">Generate Project Summary</option>
            </optgroup>
          </select>

          {meta.scope === 'repo' && repositories.length > 0 && (
            <select
              aria-label="Select Target Repository"
              value={selectedRepo}
              onChange={(e) => {
                const nextRepo = e.target.value;
                setSelectedRepo(nextRepo);
                triggerGeneration(selectedType, nextRepo, customInstructions);
              }}
              style={{
                padding: '0.38rem 0.65rem',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                background: '#12121a',
                border: '1px solid #242434',
                borderRadius: '4px',
                color: '#38bdf8'
              }}
            >
              {repositories.map((r) => (
                <option key={r.name} value={r.name}>
                  Repo: {r.name} ({r.language || 'Code'})
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Optional focus (e.g. emphasize FastAPI architecture or internship focus)..."
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                triggerGeneration(selectedType, selectedRepo, customInstructions);
              }
            }}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.38rem 0.65rem',
              fontSize: '0.78rem',
              background: '#09090c',
              border: '1px solid #20202c'
            }}
          />
        </div>

        {/* Preview / Editor Area */}
        <div
          style={{
            padding: '1.15rem 1.35rem',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          {loading ? (
            <div
              style={{
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                color: '#c084fc',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem'
              }}
            >
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Synthesizing grounded content from @{report.username}'s repository data...</span>
            </div>
          ) : isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              style={{
                width: '100%',
                minHeight: '300px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.55,
                background: '#08080b',
                border: '1px solid #2c2c3e',
                color: '#f4f4f6',
                padding: '0.9rem',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          ) : (
            <pre
              style={{
                margin: 0,
                minHeight: '280px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.55,
                background: '#08080b',
                border: '1px solid #1d1d28',
                color: '#e4e4e7',
                padding: '1rem',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {content || 'No content generated.'}
            </pre>
          )}
        </div>

        {/* Action Bar */}
        <div
          style={{
            padding: '0.85rem 1.35rem',
            borderTop: '1px solid #181822',
            background: '#09090c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#71717a', fontFamily: 'var(--font-mono)' }}>
            Preview & copy only — never modifies GitHub without your action.
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '0.42rem 0.8rem', fontSize: '0.78rem' }}
            >
              {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
              <span>{isEditing ? 'Preview' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={() => triggerGeneration(selectedType, selectedRepo, customInstructions)}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '0.42rem 0.8rem', fontSize: '0.78rem' }}
            >
              <RefreshCw size={13} />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMd}
              disabled={loading || !content}
              className="btn-secondary"
              style={{ padding: '0.42rem 0.8rem', fontSize: '0.78rem' }}
            >
              <Download size={13} />
              <span>Download .MD</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !content}
              className="btn-primary"
              style={{ padding: '0.42rem 0.95rem', fontSize: '0.78rem' }}
            >
              {copied ? <Check size={13} color="#09090b" /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIActionModal;
