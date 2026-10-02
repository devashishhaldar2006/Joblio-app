import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';
import {
  Search,
  BookOpen,
  FileText,
  ExternalLink,
  Award,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Users,
  Calendar,
  Quote,
  Zap,
  ArrowRight,
  Download,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import {
  downloadFile,
  copyToClipboard,
  printPage,
  formatResearchPaperMarkdown,
  exportResearchPaperPdf
} from '../../utils/exportUtils';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';

const ResearchAgentPage = () => {
  const toast = useToast();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('explanation'); // 'explanation' | 'related'
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    'Fetching paper metadata from ArXiv & Semantic Scholar...',
    'Extracting abstract, theorems, and citation network...',
    'Generating plain-English synthesis & intuition with Llama 3.3 70B (Groq)...',
    'Mapping lineage derivatives and related seminal papers...'
  ];

  const handleExplain = async (e, customPrompt) => {
    if (e) e.preventDefault();
    const query = customPrompt || input;
    if (!query.trim()) return;

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/research/explain', { input: query.trim() });
      setResult(res.data);
      setActiveTab('explanation');
      toast.success('Paper synthesized with Llama 3.3 70B');
    } catch (err) {
      console.error('Research error:', err);
      const msg = err.response?.data?.error || 'Failed to explain research paper. Check URL or paper title.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset) => {
    setInput(preset);
    handleExplain(null, preset);
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    const content = formatResearchPaperMarkdown(result);
    const safeTitle = (result.title || 'research_paper').slice(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(`${safeTitle}_summary.md`, content);
    toast.success('Downloaded Paper Synthesis Markdown');
  };

  const handleCopyInsights = async () => {
    if (!result) return;
    const exp = result.explanation || {};
    const tldr = exp.simple_summary || exp.tldr || 'N/A';
    let text = `Research Paper: ${result.title}\n\nTL;DR / Summary:\n${tldr}\n\n`;
    
    const problem = exp.what_problem_it_solves || exp.problem_statement;
    if (problem) {
      text += `Problem Solved:\n${problem}\n\n`;
    }
    
    const howItWorks = exp.how_it_works || exp.methodology_breakdown;
    if (howItWorks) {
      text += `How It Works:\n${howItWorks}\n\n`;
    }

    const contributions = exp.key_contributions || exp.key_innovations || [];
    if (contributions.length) {
      text += `Key Contributions:\n` + contributions.map(k => `• ${k}`).join('\n') + '\n\n';
    }

    const audience = exp.who_should_read_this || exp.practical_takeaways;
    if (audience) {
      text += `Target Audience:\n${audience}\n`;
    }

    await copyToClipboard(text);
    setCopied(true);
    toast.success('Insights copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getDifficultyBadge = (level) => {
    const l = (level || 'intermediate').toLowerCase();
    if (l === 'beginner') {
      return (
        <span className="font-label-code" style={{
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(78, 222, 163, 0.15)',
          color: 'var(--tertiary)',
          fontSize: '0.78rem',
          fontWeight: 600
        }}>
          Beginner Friendly
        </span>
      );
    }
    if (l === 'advanced') {
      return (
        <span className="font-label-code" style={{
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--error)',
          fontSize: '0.78rem',
          fontWeight: 600
        }}>
          Advanced Paper
        </span>
      );
    }
    return (
      <span className="font-label-code" style={{
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#f59e0b',
        fontSize: '0.78rem',
        fontWeight: 600
      }}>
        Difficulty: Intermediate
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Navbar title="Research Paper AI Agent" subtitle="Plain-English summaries and related research from ArXiv & Semantic Scholar" />

      <div className="page-container" style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Top Command & Header Module */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Research Paper Agent
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '580px', lineHeight: 1.5 }}>
              Paste an ArXiv URL, DOI, or research paper title for mathematical intuition, key innovations, and ablation summaries.
            </p>

            {/* Command Search Input */}
            <div style={{ width: '100%', maxWidth: '720px', marginTop: '1.75rem' }}>
              <form
                onSubmit={handleExplain}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--surface-container-lowest)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '0.4rem 0.5rem 0.4rem 1.25rem',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                  gap: '0.75rem'
                }}
              >
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>psychology</span>
                <input
                  type="text"
                  required
                  placeholder="Paste ArXiv URL or paper title (e.g. 'Attention Is All You Need' or '1706.03762')..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--on-surface)',
                    fontSize: '0.95rem',
                    padding: '0.5rem 0',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Zap size={16} />
                  <span>{loading ? 'Synthesizing...' : 'Analyze Paper'}</span>
                </button>
              </form>

              {/* Trending Presets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <span className="font-label-code" style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Trending:</span>
                {[
                  { label: 'Attention Is All You Need', icon: 'article', color: 'var(--secondary)' },
                  { label: 'Llama 3 Technical Report', icon: 'data_object', color: 'var(--tertiary)' },
                  { label: 'DeepSeek-R1 Architecture', icon: 'memory', color: 'var(--primary)' }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset.label)}
                    className="font-label-code"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--on-surface-variant)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--on-surface-variant)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: preset.color }}>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            color: '#fda4af',
            fontSize: '0.88rem'
          }}>
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <LoadingSpinner messages={loadingMessages} />
          </div>
        )}

        {/* Empty Workspace State */}
        {!result && !loading && (
          <EmptyState
            icon={BookOpen}
            badge="RESEARCH WORKSPACE READY"
            title="Paste an ArXiv URL, DOI, or paper title to begin."
            description="The Research Agent decomposes scientific publications into intuitive architectural mechanics, mathematical formulations, key innovations, and engineering implementation takeaways."
            instruction="Supports ArXiv preprints (e.g. 1706.03762 or full URL) and paper titles."
            actionLabel="Try Sample Paper: Attention Is All You Need"
            onAction={() => handlePresetClick('Attention Is All You Need')}
          />
        )}

        {/* Paper Result Layout */}
        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Paper Header Card */}
            <div className="glass-panel" style={{
              padding: '2rem',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                    {getDifficultyBadge(result.explanation?.difficulty_level)}
                    {result.year && (
                      <span className="font-label-code" style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-high)', color: 'var(--secondary)' }}>
                        Year: {result.year}
                      </span>
                    )}
                    {result.citation_count > 0 && (
                      <span className="font-label-code" style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-high)', color: 'var(--primary)' }}>
                        {result.citation_count}+ Citations
                      </span>
                    )}
                  </div>

                  <h2 className="font-headline-md" style={{ color: 'var(--on-surface)', lineHeight: 1.3, marginBottom: '0.5rem' }}>
                    {result.title}
                  </h2>

                  <div style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)' }}>
                    Authors: <span style={{ color: 'var(--on-surface)' }}>{result.authors?.slice(0, 5).join(', ') || 'Various Authors'}</span>
                    {result.authors?.length > 5 ? ' et al.' : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="btn-secondary"
                    title="Download literature review summary as Markdown (.md)"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
                  >
                    <Download size={14} style={{ color: 'var(--primary)' }} />
                    <span>Export .MD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportResearchPaperPdf(result)}
                    className="btn-secondary"
                    title="Export clean institutional PDF dossier"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
                  >
                    <Printer size={14} style={{ color: '#c084fc' }} />
                    <span>Export PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyInsights}
                    className="btn-secondary"
                    title="Copy TL;DR & key takeaways to clipboard"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
                  >
                    {copied ? <Check size={14} color="#4edea3" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy Insights'}</span>
                  </button>

                  {result.pdf_url && (
                    <a
                      href={result.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <FileText size={15} />
                      <span>ArXiv PDF ↗</span>
                    </a>
                  )}

                  <button
                    onClick={() => { setResult(null); setInput(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--on-surface)',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>New Search</span>
                  </button>
                </div>
              </div>

              {/* Fields of Study Tags */}
              {result.fields_of_study && result.fields_of_study.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {result.fields_of_study.map((field, idx) => (
                    <span
                      key={idx}
                      className="font-label-code"
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        background: 'var(--surface-container-highest)',
                        color: 'var(--on-surface-variant)',
                        fontSize: '0.75rem'
                      }}
                    >
                      {field}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Tabs Switcher */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.4rem',
              borderRadius: '12px',
              background: 'var(--surface-container-lowest)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('explanation')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.8125rem',
                    fontWeight: activeTab === 'explanation' ? 600 : 500,
                    background: activeTab === 'explanation' ? '#27272e' : 'transparent',
                    color: activeTab === 'explanation' ? '#fff' : 'var(--text-secondary)',
                    border: activeTab === 'explanation' ? '1px solid #383842' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Sparkles size={15} />
                  <span>Simple Explanation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('related')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.8125rem',
                    fontWeight: activeTab === 'related' ? 600 : 500,
                    background: activeTab === 'related' ? '#27272e' : 'transparent',
                    color: activeTab === 'related' ? '#fff' : 'var(--text-secondary)',
                    border: activeTab === 'related' ? '1px solid #383842' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Share2 size={15} />
                  <span>Related Papers</span>
                  <span className="font-label-code" style={{ padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-high)', fontSize: '0.72rem', color: '#fff' }}>
                    {result.related_papers?.length || 0}
                  </span>
                </button>
              </div>

              <span className="font-label-code" style={{ color: 'var(--tertiary)', paddingRight: '0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--tertiary)' }} />
                <span>Synthesized via Llama 3.3 70B (Groq)</span>
              </span>
            </div>

            {/* TAB 1: SIMPLE EXPLANATION */}
            {activeTab === 'explanation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Visual Intuition Map */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="font-label-caps" style={{ color: 'var(--secondary)' }}>DYNAMIC ARCHITECTURAL SCHEMATIC // EXECUTION PIPELINE</span>
                    <span className="font-label-code" style={{ color: 'var(--tertiary)', fontSize: '0.75rem' }}>Synthesized from Methodology</span>
                  </div>

                  <div style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    {/* Dynamic Pipeline Steps */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      alignItems: 'stretch'
                    }}>
                      {(result.explanation?.architecture_steps || [
                        { stage: '1. Input Layer', label: 'Input Representation', desc: 'Ingests contextual input matrices.' },
                        { stage: '2. Core Algorithm', label: 'Feature Extraction', desc: 'Transforms parameters via optimized passes.' },
                        { stage: '3. Normalization', label: 'Gradient Stabilization', desc: 'Regulates learning convergence and loss.' },
                        { stage: '4. Output Projection', label: 'Task Inference', desc: 'Generates final predictions or output tokens.' }
                      ]).map((step, idx, arr) => (
                        <div
                          key={idx}
                          style={{
                            background: 'var(--surface-container-low)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '10px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <span className="font-label-caps" style={{ color: 'var(--secondary)', fontSize: '0.7rem' }}>
                                {step.stage || `Stage ${idx + 1}`}
                              </span>
                              <span style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: idx === 0 ? 'rgba(99, 102, 241, 0.2)' : idx === arr.length - 1 ? 'rgba(78, 222, 163, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                color: idx === 0 ? 'var(--primary)' : idx === arr.length - 1 ? 'var(--tertiary)' : 'var(--secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                fontWeight: 700
                              }}>
                                {idx + 1}
                              </span>
                            </div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '0.35rem' }}>
                              {step.label}
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', lineHeight: '1.4' }}>
                              {step.desc}
                            </p>
                          </div>

                          {idx < arr.length - 1 && (
                            <div style={{
                              display: 'none',
                              position: 'absolute',
                              right: '-0.75rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              zIndex: 2,
                              color: 'var(--border-focus)'
                            }}>
                              &rarr;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Plain-English Summary */}
                <div className="glass-panel" style={{
                  padding: '1.75rem',
                  borderLeft: '3px solid #ffffff',
                  background: 'var(--surface-container)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.6rem' }}>
                    <Sparkles size={18} />
                    <span className="font-label-caps" style={{ letterSpacing: '0.06em' }}>PLAIN-ENGLISH SYNTHESIS</span>
                  </div>
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--on-surface)' }}>
                    {result.explanation?.simple_summary}
                  </p>
                </div>

                {/* Problem & How It Works Split */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Problem Solved */}
                  <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.3rem' }}>crisis_alert</span>
                      <h4 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>What Problem It Solves</h4>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--on-surface-variant)', lineHeight: '1.6' }}>
                      {result.explanation?.what_problem_it_solves}
                    </p>
                  </div>

                  {/* How It Works */}
                  <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.3rem' }}>memory</span>
                      <h4 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>How It Works</h4>
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--on-surface-variant)', lineHeight: '1.6' }}>
                      {result.explanation?.how_it_works}
                    </p>
                  </div>
                </div>

                {/* Key Contributions Badges */}
                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)' }}>KEY ARCHITECTURAL & EMPIRICAL INNOVATIONS</span>
                    <span className="font-label-code" style={{ color: 'var(--tertiary)' }}>Pruning & Primitives</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                    {result.explanation?.key_contributions?.map((contrib, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--surface-container-low)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem'
                        }}
                      >
                        <CheckCircle2 size={16} color="var(--tertiary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--on-surface)', lineHeight: '1.4' }}>{contrib}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audience Assessment */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.6rem' }}>school</span>
                  </div>
                  <div>
                    <span className="font-label-caps" style={{ color: 'var(--primary)' }}>AUDIENCE ASSESSMENT</span>
                    <p style={{ fontSize: '0.92rem', color: 'var(--on-surface)', marginTop: '0.2rem', lineHeight: '1.4' }}>
                      {result.explanation?.who_should_read_this}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: RELATED PAPERS */}
            {activeTab === 'related' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>Lineage & Direct Derivatives</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                      Top-cited foundation models and algorithmic optimizations rooted in this research.
                    </p>
                  </div>
                  <span className="font-label-code" style={{ color: 'var(--text-dim)' }}>Ranked by Semantic Relevance</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                  gap: '1.25rem'
                }}>
                  {result.related_papers && result.related_papers.map((p, idx) => (
                    <div
                      key={idx}
                      className="glass-card"
                      style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1.25rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span className="font-label-code" style={{ color: 'var(--primary)', fontSize: '0.78rem' }}>
                            {p.authors?.[0] || 'Author'} {p.year ? `· ${p.year}` : ''}
                          </span>
                          <span className="font-label-code" style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', fontSize: '0.72rem' }}>
                            {p.citation_count} cites
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--on-surface)', lineHeight: 1.3, marginBottom: '0.75rem' }}>
                          {p.title}
                        </h4>

                        <div style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          fontSize: '0.82rem',
                          color: 'var(--on-surface-variant)',
                          lineHeight: '1.4'
                        }}>
                          <strong style={{ color: 'var(--accent-cyan)' }}>Why Read Next:</strong> {p.relevance_reason}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            padding: '0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-container-high)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--on-surface)',
                            fontSize: '0.82rem',
                            fontWeight: 500
                          }}
                        >
                          <BookOpen size={14} />
                          <span>Semantic Scholar</span>
                        </a>

                        {p.pdf_url && (
                          <a
                            href={p.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary"
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem',
                              fontSize: '0.8125rem'
                            }}
                          >
                            <FileText size={14} />
                            <span>PDF ↗</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default ResearchAgentPage;
