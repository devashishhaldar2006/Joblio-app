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
  ArrowRight
} from 'lucide-react';

const ResearchAgentPage = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('explanation'); // 'explanation' | 'related'

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
    } catch (err) {
      console.error('Research error:', err);
      setError(err.response?.data?.error || 'Failed to explain research paper. Check URL or paper title.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset) => {
    setInput(preset);
    handleExplain(null, preset);
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
          
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '500px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.05) 60%, transparent 80%)',
            filter: 'blur(70px)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-container-high)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--tertiary)', boxShadow: '0 0 8px rgba(78,222,163,0.8)' }} className="animate-pulse" />
              <span className="font-label-caps" style={{ color: 'var(--tertiary)' }}>
                Deep Synthesis Engine v4.2
              </span>
            </div>

            <h1 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--on-surface)', marginBottom: '0.5rem' }}>
              Research Paper <span className="text-gradient">AI Agent</span>
            </h1>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.05rem', maxWidth: '600px', lineHeight: '1.6' }}>
              Paste any ArXiv URL, DOI, or computer science paper title to get an intuitive breakdown, mathematical intuition, and related work.
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--primary-container), var(--secondary-container))',
                    color: '#fff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    boxShadow: '0 0 20px rgba(128, 131, 255, 0.35)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: 'none'
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

        {/* Paper Result Layout */}
        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Paper Header Card */}
            <div className="glass-panel" style={{
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{ position: 'absolute', right: '-4rem', top: '-4rem', width: '16rem', height: '16rem', borderRadius: '50%', background: 'rgba(128, 131, 255, 0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />

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

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  {result.pdf_url && (
                    <a
                      href={result.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.2rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, var(--tertiary-container), var(--tertiary))',
                        color: 'var(--on-tertiary-container)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        boxShadow: '0 0 16px rgba(0, 136, 93, 0.4)'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>picture_as_pdf</span>
                      <span>Open Original PDF ↗</span>
                    </a>
                  )}

                  <button
                    onClick={() => { setResult(null); setInput(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.65rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--on-surface)',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={15} />
                    <span>New Paper</span>
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
                    gap: '0.4rem',
                    padding: '0.6rem 1.4rem',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: activeTab === 'explanation' ? 600 : 500,
                    background: activeTab === 'explanation' ? 'linear-gradient(135deg, var(--secondary-container), var(--surface-container-highest))' : 'transparent',
                    color: activeTab === 'explanation' ? '#fff' : 'var(--on-surface-variant)',
                    border: 'none',
                    boxShadow: activeTab === 'explanation' ? '0 0 16px rgba(87,27,193,0.35)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>auto_awesome</span>
                  <span>Simple Explanation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('related')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1.4rem',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: activeTab === 'related' ? 600 : 500,
                    background: activeTab === 'related' ? 'linear-gradient(135deg, var(--secondary-container), var(--surface-container-highest))' : 'transparent',
                    color: activeTab === 'related' ? '#fff' : 'var(--on-surface-variant)',
                    border: 'none',
                    boxShadow: activeTab === 'related' ? '0 0 16px rgba(87,27,193,0.35)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>account_tree</span>
                  <span>Related Papers</span>
                  <span className="font-label-code" style={{ padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-high)', fontSize: '0.72rem' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="font-label-caps" style={{ color: 'var(--secondary)' }}>INTUITION MAP // ARCHITECTURAL SCHEMATIC</span>
                    <span className="font-label-code" style={{ color: 'var(--tertiary)', fontSize: '0.75rem' }}>Parallel Representation</span>
                  </div>

                  <div style={{
                    background: 'var(--surface-container-lowest)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg style={{ width: '100%', maxHeight: '120px' }} fill="none" viewBox="0 0 540 90">
                      <rect x="10" y="10" width="46" height="70" rx="6" fill="var(--surface-container-high)" />
                      <text x="33" y="48" fill="var(--on-surface-variant)" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">Input</text>

                      <path d="M56 30 C 100 30, 110 20, 150 20" stroke="var(--primary)" strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />
                      <path d="M56 45 C 100 45, 110 45, 150 45" stroke="var(--secondary)" strokeWidth="2.5" />
                      <path d="M56 60 C 100 60, 110 70, 150 70" stroke="var(--tertiary)" strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />

                      <g transform="translate(150, 8)">
                        <rect x="0" y="0" width="80" height="20" rx="4" fill="rgba(192,193,255,0.2)" />
                        <text x="40" y="14" fill="var(--primary)" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">Head 1 (Q₁·K₁)</text>
                        <rect x="0" y="24" width="80" height="20" rx="4" fill="rgba(208,188,255,0.2)" />
                        <text x="40" y="38" fill="var(--secondary)" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">Head 2 (Q₂·K₂)</text>
                        <rect x="0" y="48" width="80" height="20" rx="4" fill="rgba(78,222,163,0.2)" />
                        <text x="40" y="62" fill="var(--tertiary)" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">Head 8 (Q₈·K₈)</text>
                      </g>

                      <path d="M230 45 L 290 45" stroke="var(--secondary)" strokeWidth="2" />

                      <g transform="translate(290, 16)">
                        <rect x="0" y="0" width="100" height="54" rx="6" fill="var(--surface-container-highest)" />
                        <text x="50" y="26" fill="var(--on-surface)" fontSize="11" fontWeight="bold" textAnchor="middle">Concat & Linear</text>
                        <text x="50" y="42" fill="var(--text-dim)" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">Projection Layer</text>
                      </g>

                      <path d="M390 45 L 430 45" stroke="var(--tertiary)" strokeWidth="2.5" />

                      <g transform="translate(430, 18)">
                        <rect x="0" y="0" width="90" height="50" rx="6" fill="var(--tertiary-container)" opacity="0.4" />
                        <text x="45" y="24" fill="var(--tertiary-fixed)" fontSize="11" fontWeight="bold" textAnchor="middle">LayerNorm</text>
                        <text x="45" y="40" fill="var(--tertiary-fixed)" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">+ FeedForward</text>
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Plain-English Summary */}
                <div className="glass-panel" style={{
                  padding: '2rem',
                  borderLeft: '4px solid var(--primary)',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(31, 31, 38, 0.7) 100%)'
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
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              padding: '0.55rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'linear-gradient(135deg, var(--primary-container), var(--secondary-container))',
                              color: '#fff',
                              fontSize: '0.82rem',
                              fontWeight: 600
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
