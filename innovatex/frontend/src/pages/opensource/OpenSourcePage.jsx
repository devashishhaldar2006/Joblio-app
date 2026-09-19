import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
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
  Info
} from 'lucide-react';

const SKILL_OPTIONS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js',
  'Go', 'Rust', 'Docker', 'FastAPI', 'GraphQL', 'PostgreSQL'
];

const OpenSourcePage = () => {
  // Step 1: Filters
  const [selectedSkills, setSelectedSkills] = useState(['TypeScript', 'React', 'Node.js']);
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [preferredLanguage, setPreferredLanguage] = useState('typescript');

  // Loading & Results
  const [finding, setFinding] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');

  // Step 3: PR Guide State
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [guiding, setGuiding] = useState(false);
  const [prGuide, setPrGuide] = useState(null);
  const [guideTab, setGuideTab] = useState('setup'); // 'setup' | 'files' | 'hints' | 'template'

  // Step 4: PR Reviewer State
  const [userCode, setUserCode] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [prReview, setPrReview] = useState(null);

  // Copied feedback helper
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Step 1 -> Step 2
  const handleFindOpportunities = async (e) => {
    e.preventDefault();
    setError('');
    setFinding(true);
    setRecommendations([]);
    setSelectedIssue(null);
    setPrGuide(null);
    setPrReview(null);

    try {
      const res = await api.post('/opensource/find', {
        skills: selectedSkills,
        experience_level: experienceLevel,
        preferred_language: preferredLanguage
      });
      setRecommendations(res.data || []);
    } catch (err) {
      console.error('Open source error:', err);
      setError(err.response?.data?.error || 'Failed to fetch open source issues from GitHub Search API.');
    } finally {
      setFinding(false);
    }
  };

  // Step 2 -> Step 3: Guide Me
  const handleRequestGuide = async (rec) => {
    setSelectedIssue(rec);
    setGuiding(true);
    setPrGuide(null);
    setPrReview(null);
    setGuideTab('setup');

    try {
      const res = await api.post('/opensource/guide', {
        issue_url: rec.issue_url,
        repo_name: rec.repo_name,
        issue_number: rec.issue_number
      });
      setPrGuide(res.data);
    } catch (err) {
      console.error('Guide error:', err);
      alert('Failed to generate PR guide: ' + (err.response?.data?.error || err.message));
    } finally {
      setGuiding(false);
    }
  };

  // Step 3 -> Step 4: Review Code
  const handleReviewCode = async (e) => {
    e.preventDefault();
    if (!userCode.trim() || !selectedIssue) return;

    setReviewing(true);
    setPrReview(null);

    try {
      const res = await api.post('/opensource/review', {
        user_code: userCode,
        issue_url: selectedIssue.issue_url,
        original_code: ''
      });
      setPrReview(res.data);
    } catch (err) {
      console.error('Review error:', err);
      alert('Review failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setReviewing(false);
    }
  };

  const getVerdictBadge = (verdict) => {
    const v = (verdict || '').toLowerCase();
    if (v === 'approve') {
      return (
        <span className="font-label-code" style={{
          padding: '0.3rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(78, 222, 163, 0.15)',
          color: 'var(--tertiary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={14} /> Merge Ready & Approved
        </span>
      );
    }
    if (v === 'request_changes') {
      return (
        <span className="font-label-code" style={{
          padding: '0.3rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--error)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontWeight: 600
        }}>
          <AlertCircle size={14} /> Changes Requested
        </span>
      );
    }
    return (
      <span className="font-label-code" style={{
        padding: '0.3rem 0.85rem',
        borderRadius: 'var(--radius-full)',
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#f59e0b',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontWeight: 600
      }}>
        <Info size={14} /> Approved with Suggestions
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Navbar title="Open Source Opportunity Matcher" subtitle="Tailored first issues with step-by-step PR guidance and AI pre-review" />

      <div className="page-container" style={{ maxWidth: '1440px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Top Header & Stepper Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="font-label-caps" style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'rgba(192, 193, 255, 0.12)', color: 'var(--primary)' }}>
                  Telemetry v2.4
                </span>
                <span className="font-label-code" style={{ color: 'var(--on-surface-variant)' }}>
                  OSS Intelligence Engine
                </span>
              </div>
              <h1 className="font-headline-lg" style={{ color: 'var(--on-surface)', lineHeight: 1.2 }}>
                Open Source Contribution Finder
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--tertiary)', boxShadow: '0 0 8px rgba(78, 222, 163, 0.8)' }} className="animate-pulse" />
              <span className="font-label-code" style={{ color: 'var(--on-surface-variant)' }}>
                Indexed Repos: <strong style={{ color: 'var(--on-surface)' }}>14,289 active</strong>
              </span>
            </div>
          </div>

          {/* 3-Step Process Tracker */}
          <div style={{
            background: 'var(--surface-container-lowest)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.75rem'
          }}>
            {/* Step 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'var(--surface-container-high)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--tertiary)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                <Check size={16} />
              </div>
              <div>
                <div className="font-label-caps" style={{ color: 'var(--tertiary)' }}>Step 01 • Parameterized</div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--on-surface)' }}>Stack & Experience</div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: recommendations.length > 0 ? 'var(--surface-container-high)' : 'transparent',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: recommendations.length > 0 ? 'var(--primary)' : 'var(--surface-container-highest)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                02
              </div>
              <div>
                <div className="font-label-caps" style={{ color: recommendations.length > 0 ? 'var(--primary)' : 'var(--text-dim)' }}>
                  {recommendations.length > 0 ? 'Step 02 • Active' : 'Step 02 • Pending'}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--on-surface)' }}>Curated Opportunities</div>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: prGuide ? 'var(--surface-container-high)' : 'transparent',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: prGuide ? 'var(--secondary)' : 'var(--surface-container-highest)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                03
              </div>
              <div>
                <div className="font-label-caps" style={{ color: prGuide ? 'var(--secondary)' : 'var(--text-dim)' }}>
                  {prGuide ? 'Step 03 • Loaded' : 'Step 03 • Blueprint & Review'}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--on-surface)' }}>PR Guide & AI Review</div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: Input Matrix Card */}
        <section className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
            <div>
              <span className="font-label-code" style={{ color: 'var(--secondary)', fontSize: '0.8rem' }}>PHASE 1 // PROFILE PARAMETERS</span>
              <h2 className="font-headline-md" style={{ color: 'var(--on-surface)', marginTop: '0.25rem' }}>Find Your Target Open Source Contribution</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-variant)', marginTop: '0.2rem' }}>
                Configure your active toolset, proficiency bracket, and ecosystem focus.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label className="font-label-code" style={{ color: 'var(--on-surface-variant)', fontSize: '0.82rem' }}>Target Core:</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                style={{
                  background: 'var(--surface-container-high)',
                  color: 'var(--on-surface)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.88rem'
                }}
              >
                <option value="typescript">TypeScript / Node</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python / ML</option>
                <option value="go">Go / Cloud Native</option>
                <option value="rust">Rust / Systems</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleFindOpportunities} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Skills selection chips */}
            <div>
              <label className="font-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.6rem' }}>
                Active Tooling & Competencies (Click to toggle):
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SKILL_OPTIONS.map((skill) => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="font-label-code"
                      style={{
                        padding: '0.4rem 0.9rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.82rem',
                        fontWeight: active ? 600 : 400,
                        background: active ? 'linear-gradient(135deg, var(--inverse-primary), var(--secondary-container))' : 'var(--surface-container-high)',
                        color: active ? '#fff' : 'var(--on-surface-variant)',
                        border: active ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        boxShadow: active ? '0 0 12px rgba(99, 102, 241, 0.35)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {active ? '✓ ' : ''}{skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Level Cards Deck */}
            <div>
              <label className="font-label-caps" style={{ color: 'var(--on-surface-variant)', display: 'block', marginBottom: '0.6rem' }}>
                Target Scope & Experience Bracket:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {[
                  { id: 'beginner', title: 'Beginner / First Steps', subtitle: '100 - 2,500 repo stars', desc: 'Curated "good first issue" tags with isolated scopes and test repros.' },
                  { id: 'intermediate', title: 'Intermediate', subtitle: '2,000 - 10,000 repo stars', desc: 'Core features, performance patches, and multi-file refactors.' },
                  { id: 'advanced', title: 'Advanced / Systems', subtitle: '> 5,000 repo stars', desc: 'Subsystem architecture, concurrency fixes, and memory tracing.' }
                ].map((tier) => {
                  const isSel = experienceLevel === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setExperienceLevel(tier.id)}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        background: isSel ? 'var(--surface-container-high)' : 'var(--surface-container-low)',
                        border: isSel ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                        boxShadow: isSel ? '0 0 16px rgba(99, 102, 241, 0.25)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isSel ? 'var(--primary)' : 'var(--on-surface)' }}>
                          {tier.title}
                        </span>
                        <span style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: `2px solid ${isSel ? 'var(--primary)' : 'var(--border-subtle)'}`,
                          background: isSel ? 'var(--primary)' : 'transparent'
                        }} />
                      </div>
                      <div className="font-label-code" style={{ fontSize: '0.78rem', color: 'var(--tertiary)', marginBottom: '0.4rem' }}>
                        {tier.subtitle}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', lineHeight: '1.4' }}>
                        {tier.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={finding}
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.8rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--inverse-primary), var(--primary-container), var(--secondary-container))',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.92rem',
                boxShadow: '0 0 20px rgba(128, 131, 255, 0.4)',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              <Sparkles size={16} />
              <span>{finding ? 'Searching Live Repositories...' : 'Find Matches'}</span>
            </button>
          </form>
        </section>

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
        {finding && (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <LoadingSpinner messages={[
              'Querying GitHub Search API for active open-source repositories...',
              'Filtering open discussions tagged "good first issue"...',
              'Extracting issue requirements and testing guidelines with Llama 3.3 70B (Groq)...',
              'Scoring repository ergonomics against your tech competencies...'
            ]} />
          </div>
        )}

        {/* STEP 2: Recommendations Grid */}
        {recommendations.length > 0 && !finding && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>
                  Matched Contribution Opportunities ({recommendations.length})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                  Ranked by compatibility percentage, language fit, and maintainer activity.
                </p>
              </div>
              <span className="font-label-code" style={{ color: 'var(--tertiary)' }}>Live GitHub Sync</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.5rem'
            }}>
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="glass-card"
                  style={{
                    padding: '1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="font-label-code" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {rec.repo_name}
                        </span>
                        <span className="font-label-code" style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                          ★ {rec.repo_stars}
                        </span>
                      </div>
                      <span className="font-label-code" style={{ padding: '0.15rem 0.55rem', borderRadius: 'var(--radius-full)', background: 'rgba(78, 222, 163, 0.15)', color: 'var(--tertiary)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {rec.language}
                      </span>
                    </div>

                    {/* Issue Title + Score */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <a
                        href={rec.issue_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--on-surface)', lineHeight: '1.35' }}
                      >
                        #{rec.issue_number}: {rec.issue_title}
                      </a>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'var(--tertiary-container)',
                        color: 'var(--tertiary-fixed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        border: '2px solid var(--tertiary)'
                      }}>
                        {rec.match_score}%
                      </div>
                    </div>

                    {/* Why Good Fit */}
                    <p style={{ fontSize: '0.84rem', color: 'var(--on-surface-variant)', lineHeight: '1.45', marginBottom: '1rem' }}>
                      "{rec.why_good_fit}"
                    </p>

                    {/* Skill Overlap & Learn Chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {rec.skills_overlap && rec.skills_overlap.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
                          <span className="font-label-caps" style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>OVERLAP:</span>
                          {rec.skills_overlap.map((s, i) => (
                            <span key={i} className="font-label-code" style={{ padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(78, 222, 163, 0.12)', color: 'var(--tertiary)', fontSize: '0.72rem' }}>
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {rec.skills_to_learn && rec.skills_to_learn.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
                          <span className="font-label-caps" style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>LEARN:</span>
                          {rec.skills_to_learn.map((s, i) => (
                            <span key={i} className="font-label-code" style={{ padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'var(--surface-container-high)', color: 'var(--primary)', fontSize: '0.72rem' }}>
                              + {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Launch Guide Button */}
                  <button
                    type="button"
                    onClick={() => handleRequestGuide(rec)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--on-surface)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-bright)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--surface-container-high)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    <span>View Contributor Spec & PR Guide</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Guiding Loading */}
        {guiding && (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <LoadingSpinner messages={[
              'Cloning target repository structure and AST...',
              'Extracting relevant source files and imports...',
              'Synthesizing isolated local setup commands and test specs...',
              'Generating ready-to-paste Pull Request description template...'
            ]} />
          </div>
        )}

        {/* STEP 3 & 4: PR GUIDE & AI CODE REVIEWER WORKSPACE */}
        {prGuide && selectedIssue && !guiding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Issue Banner */}
            <div className="glass-panel" style={{
              padding: '1.75rem 2rem',
              borderLeft: '4px solid var(--primary)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span className="font-label-code" style={{ padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'rgba(78, 222, 163, 0.15)', color: 'var(--tertiary)', fontSize: '0.75rem' }}>
                    Active Blueprint
                  </span>
                  <span className="font-label-code" style={{ color: 'var(--on-surface-variant)' }}>
                    {selectedIssue.repo_name}
                  </span>
                </div>
                <h2 className="font-headline-sm" style={{ color: 'var(--on-surface)', fontSize: '1.35rem' }}>
                  Issue #{selectedIssue.issue_number}: {selectedIssue.issue_title}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <a
                  href={selectedIssue.issue_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-container-high)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--on-surface)',
                    fontSize: '0.85rem'
                  }}
                >
                  <ExternalLink size={14} />
                  <span>GitHub Spec</span>
                </a>
                <button
                  onClick={() => setPrGuide(null)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-container-high)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-dim)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Close Guide
                </button>
              </div>
            </div>

            {/* 4-Tab Blueprint Navigation */}
            <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.75rem',
                overflowX: 'auto'
              }}>
                {[
                  { id: 'setup', label: '1. Setup Steps', icon: 'terminal' },
                  { id: 'files', label: '2. Files to Edit', icon: 'folder_open' },
                  { id: 'hints', label: '3. Implementation Hints', icon: 'lightbulb' },
                  { id: 'template', label: '4. PR Template', icon: 'description' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setGuideTab(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.6rem 1.1rem',
                      borderRadius: '8px',
                      background: guideTab === t.id ? 'var(--surface-container-high)' : 'transparent',
                      color: guideTab === t.id ? 'var(--primary)' : 'var(--on-surface-variant)',
                      fontWeight: guideTab === t.id ? 600 : 500,
                      border: 'none',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: Setup Steps */}
              {guideTab === 'setup' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {prGuide.setup_steps?.map((cmd, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-container-low)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <span className="font-label-caps" style={{ color: 'var(--primary)' }}>STEP 0{idx + 1}</span>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--on-surface)', marginTop: '0.2rem' }}>
                          Command Execution
                        </div>
                      </div>
                      <div style={{
                        background: 'var(--surface-container-lowest)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <code className="font-label-code" style={{ fontSize: '0.8rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cmd}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cmd, `cmd_${idx}`)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', flexShrink: 0 }}
                          title="Copy command"
                        >
                          {copiedKey === `cmd_${idx}` ? <Check size={14} color="var(--tertiary)" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: Files to Edit */}
              {guideTab === 'files' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {prGuide.files_to_edit?.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-container-low)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', fontSize: '1.1rem' }}>edit_note</span>
                        <code className="font-label-code" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.88rem' }}>
                          {f.file_path}
                        </code>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--on-surface-variant)', lineHeight: '1.4' }}>
                        <strong style={{ color: 'var(--on-surface)' }}>Reason:</strong> {f.reason}
                      </p>
                      <p style={{ fontSize: '0.84rem', color: 'var(--on-surface-variant)', lineHeight: '1.4' }}>
                        <strong style={{ color: 'var(--on-surface)' }}>What to change:</strong> {f.what_to_change}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: Implementation Hints */}
              {guideTab === 'hints' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {prGuide.implementation_hints?.map((hint, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '1.25rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--surface-container-low)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                          <Lightbulb size={16} />
                          <span className="font-label-caps">Implementation Note {idx + 1}</span>
                        </div>
                        <p style={{ fontSize: '0.86rem', color: 'var(--on-surface)', lineHeight: '1.5' }}>
                          {hint}
                        </p>
                      </div>
                    ))}
                  </div>

                  {prGuide.things_to_avoid && prGuide.things_to_avoid.length > 0 && (
                    <div style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      marginTop: '0.5rem'
                    }}>
                      <div className="font-label-caps" style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>COMMON TRAPS TO AVOID</div>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: '1.6' }}>
                        {prGuide.things_to_avoid.map((trap, idx) => (
                          <li key={idx}>{trap}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PR Template */}
              {guideTab === 'template' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)' }}>READY-TO-PASTE GITHUB MARKDOWN</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(`## ${prGuide.pr_title_suggestion}\n\n${prGuide.pr_description_template}`, 'full_template')}
                      className="font-label-code"
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '6px',
                        background: 'var(--surface-container-high)',
                        color: 'var(--primary)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {copiedKey === 'full_template' ? <Check size={14} color="var(--tertiary)" /> : <Copy size={14} />}
                      <span>Copy Full PR Markdown</span>
                    </button>
                  </div>

                  <pre className="font-label-code" style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-container-lowest)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--on-surface)',
                    fontSize: '0.84rem',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto'
                  }}>
                    {`## ${prGuide.pr_title_suggestion}\n\n${prGuide.pr_description_template}`}
                  </pre>
                </div>
              )}

            </div>

            {/* STEP 4: Built-in AI Code Reviewer Assistant */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>neurology</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm" style={{ color: 'var(--on-surface)' }}>AI Code Review Assistant</h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--on-surface-variant)' }}>
                      Pre-screen your candidate code diff against repo contributing guidelines before opening the pull request.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReviewCode}
                  disabled={reviewing || !userCode.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, var(--tertiary-container), var(--tertiary))',
                    color: 'var(--on-tertiary-container)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    border: 'none',
                    cursor: userCode.trim() ? 'pointer' : 'not-allowed',
                    opacity: userCode.trim() ? 1 : 0.6
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>fact_check</span>
                  <span>{reviewing ? 'Simulating Maintainer Review...' : 'Review My Code'}</span>
                </button>
              </div>

              {/* Code Diff Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="font-label-caps" style={{ color: 'var(--on-surface-variant)' }}>
                    Candidate Git Diff or Implementation Snippet:
                  </label>
                  <span className="font-label-code" style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                    Unified Diff / Implementation
                  </span>
                </div>

                <textarea
                  rows={8}
                  placeholder="// Paste your proposed code fix or git diff here..."
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="font-label-code"
                  style={{
                    width: '100%',
                    background: 'var(--surface-container-low)',
                    color: 'var(--on-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '1rem',
                    fontSize: '0.85rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Review Output */}
              {prReview && (
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'var(--surface-container-low)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)' }}>MAINTAINER VERDICT</span>
                    {getVerdictBadge(prReview.verdict)}
                  </div>

                  <p style={{ fontSize: '0.92rem', color: 'var(--on-surface)', lineHeight: '1.5' }}>
                    {prReview.overall_feedback}
                  </p>

                  {/* Strengths & Issues Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {/* Strengths */}
                    {prReview.good_things && prReview.good_things.length > 0 && (
                      <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--surface-container-lowest)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--tertiary)', marginBottom: '0.6rem' }}>
                          <ThumbsUp size={15} />
                          <span className="font-label-caps">GOOD PRACTICES OBSERVED</span>
                        </div>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.84rem', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
                          {prReview.good_things.map((g, idx) => (
                            <li key={idx}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Issues / Suggestions */}
                    {prReview.issues && prReview.issues.length > 0 && (
                      <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--surface-container-lowest)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--secondary)', marginBottom: '0.6rem' }}>
                          <Lightbulb size={15} />
                          <span className="font-label-caps">IMPROVEMENT SUGGESTIONS</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {prReview.issues.map((iss, idx) => (
                            <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>
                              <strong style={{ color: 'var(--on-surface)' }}>[{iss.type}] {iss.description}:</strong> {iss.suggestion}
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
                        <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)' }}>RECOMMENDED AI REVISION</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(prReview.revised_code_suggestion, 'revised_code')}
                          className="font-label-code"
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '4px',
                            background: 'var(--surface-container-high)',
                            color: 'var(--primary)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {copiedKey === 'revised_code' ? <Check size={13} color="var(--tertiary)" /> : <Copy size={13} />}
                          <span>Copy Clean Snippet</span>
                        </button>
                      </div>

                      <pre className="font-label-code" style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'var(--surface-container-lowest)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--primary-fixed-dim)',
                        fontSize: '0.82rem',
                        lineHeight: '1.5',
                        overflowX: 'auto'
                      }}>
                        {prReview.revised_code_suggestion}
                      </pre>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default OpenSourcePage;
