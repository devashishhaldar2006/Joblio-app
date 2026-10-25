import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Github,
  TrendingUp,
  BookOpen,
  Briefcase,
  GitPullRequest,
  Trophy,
  Terminal,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  BarChart2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Github,
      title: 'GitHub Intelligence',
      desc: 'Deep repository analysis, commit cadences, architecture reviews, and multi-agent code evaluation.',
      tag: 'Code Analysis',
      link: isAuthenticated ? '/github' : '/register',
    },
    {
      icon: TrendingUp,
      title: 'Market Demand Forecaster',
      desc: 'Prophet and auto-ARIMA time-series forecasting across 50,000+ job openings for 26-week skill trends.',
      tag: 'ML Forecasting',
      link: isAuthenticated ? '/market' : '/register',
    },
    {
      icon: BookOpen,
      title: 'Research Paper Agent',
      desc: 'Synthesizes ArXiv preprints into plain-language intuition, key formulas, and production code takeaways.',
      tag: 'Paper Synthesis',
      link: isAuthenticated ? '/research' : '/register',
    },
    {
      icon: Briefcase,
      title: 'Job Search & ATS Fit',
      desc: 'Semantic vector alignment of your resume against live job postings with explicit keyword gap identification.',
      tag: 'Vector Match',
      link: isAuthenticated ? '/jobs' : '/register',
    },
    {
      icon: GitPullRequest,
      title: 'Open Source Finder',
      desc: 'Discovers issues aligned with your tech stack and generates actionable reproduction and contribution blueprints.',
      tag: 'Issue Radar',
      link: isAuthenticated ? '/opensource' : '/register',
    },
    {
      icon: Trophy,
      title: 'Contest & Hackathon Radar',
      desc: 'Real-time countdown tracker for LeetCode, Codeforces, AtCoder, and CTF competitions with reminders.',
      tag: 'Competitive',
      link: isAuthenticated ? '/contests' : '/register',
    },
  ];

  const pipeline = [
    {
      step: '01',
      title: 'Data Ingestion',
      desc: 'Live ingestion from GitHub APIs, ArXiv preprints, job aggregators, and competitive programming feeds.',
    },
    {
      step: '02',
      title: 'Skill Normalization',
      desc: 'Standardizes extracted tech stacks into a clean ontology and calculates semantic vector embeddings.',
    },
    {
      step: '03',
      title: 'Multi-Agent Processing',
      desc: 'LangGraph state graphs orchestrate dedicated evaluation routines for code quality and issue feasibility.',
    },
    {
      step: '04',
      title: 'Time-Series Modeling',
      desc: 'Statistical forecasting generates 26-week demand curves and market regime classifications.',
    },
    {
      step: '05',
      title: 'Unified Intelligence',
      desc: 'Synthesizes findings into a single telemetry dashboard with actionable next steps for your career.',
    },
  ];

  const faqs = [
    {
      q: 'How does InnovateX calculate the developer signal?',
      a: 'The signal is computed through multi-axis evaluation across your active GitHub repositories, code complexity, open-source contributions, and alignment with prevailing 26-week market skill demand curves.',
    },
    {
      q: 'Are the market demand forecasts based on real data?',
      a: 'Yes. The system indexes live engineering job postings, extracts skill co-occurrences, and runs Facebook Prophet and auto-ARIMA models to estimate trajectories over a 26-week horizon.',
    },
    {
      q: 'How does the ATS matcher analyze my resume?',
      a: 'Resumes are parsed and mapped into dense vector embeddings. They are matched against candidate job requirements using cosine similarity and explicit keyword extraction to reveal missing qualifications.',
    },
    {
      q: 'Can I bookmark opportunities and export reports?',
      a: 'Yes. All discovered open-source issues, tracked contests, bookmarked jobs, and synthesized research papers can be saved and exported as structured PDF dossiers directly from the platform.',
    },
  ];

  return (
    <div className="landing-container">
      {/* ─── Top Navigation ─── */}
      <header className={`landing-header ${scrolled ? 'landing-header--scrolled' : ''}`}>
        <div className="landing-header-inner">
          <Link to="/" className="landing-brand">
            <div className="landing-brand-badge">IX</div>
            <span className="landing-brand-name">InnovateX</span>
          </Link>

          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#pipeline">Pipeline</a>
            <a href="#stack">Stack</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="landing-auth-actions">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8125rem' }}
              >
                <span>Console</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn-ghost"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.8125rem' }}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.8125rem' }}
                >
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="landing-hero-section">
        <div className="landing-hero-inner">
          <div className="landing-hero-pill">
            <span className="landing-hero-pill-dot" />
            <span>Developer Intelligence Platform</span>
          </div>

          <h1 className="landing-hero-heading">
            Your career intelligence
            <br />
            operating system.
          </h1>

          <p className="landing-hero-subheading">
            Connect code repositories, market demand trends, ArXiv research, and
            competitive telemetry into a single, unified developer signal — powered by
            specialized multi-agent pipelines.
          </p>

          <div className="landing-hero-actions">
            <button
              onClick={() => navigate(isAuthenticated ? '/github' : '/register')}
              className="btn-primary"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.875rem' }}
            >
              <Sparkles size={16} />
              <span>Analyze Profile</span>
              <ArrowRight size={15} />
            </button>
            <a
              href="#features"
              className="btn-secondary"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.875rem' }}
            >
              <span>Explore Features</span>
            </a>
          </div>

          {/* Metrics bar */}
          <div className="landing-metrics-grid">
            <div className="landing-metric-cell">
              <span className="landing-metric-num">6</span>
              <span className="landing-metric-label">Intelligence Layers</span>
            </div>
            <div className="landing-metric-cell">
              <span className="landing-metric-num">50K+</span>
              <span className="landing-metric-label">Job Specs Indexed</span>
            </div>
            <div className="landing-metric-cell">
              <span className="landing-metric-num">26W</span>
              <span className="landing-metric-label">Forecast Horizon</span>
            </div>
            <div className="landing-metric-cell">
              <span className="landing-metric-num">100+</span>
              <span className="landing-metric-label">Live Contest Feeds</span>
            </div>
          </div>

          {/* Console / Terminal Preview */}
          <div className="landing-console-preview">
            <div className="landing-console-topbar">
              <div className="landing-console-dots">
                <span className="console-dot" />
                <span className="console-dot" />
                <span className="console-dot" />
              </div>
              <div className="landing-console-title">
                <Terminal size={12} />
                <span>innovatex — agent telemetry stream</span>
              </div>
              <div className="landing-console-status">
                <span className="console-status-indicator" />
                <span>ONLINE</span>
              </div>
            </div>
            <div className="landing-console-body">
              <div className="console-row">
                <span className="c-dim">{'>'}</span> <span className="c-cyan">init_pipeline</span> <span className="c-muted">--target</span> <span className="c-text">@developer</span>
              </div>
              <div className="console-row c-muted">
                &nbsp;&nbsp;[01/06] GitHub graph scan: 47 public repositories indexed · 1,420 commits analyzed
              </div>
              <div className="console-row c-muted">
                &nbsp;&nbsp;[02/06] Prophet time-series: 26-week skill demand curves modeled
              </div>
              <div className="console-row c-muted">
                &nbsp;&nbsp;[03/06] ArXiv synthesis: 14 preprints categorized in distributed systems
              </div>
              <div className="console-row c-muted">
                &nbsp;&nbsp;[04/06] ATS vector matcher: 88.4% alignment score calculated across 12 openings
              </div>
              <div className="console-row c-muted">
                &nbsp;&nbsp;[05/06] OSS issue radar: 5 stack-matched contribution opportunities resolved
              </div>
              <div className="console-row c-muted">
                &nbsp;&nbsp;[06/06] Contest monitor: 4 upcoming rounds flagged across LeetCode & Codeforces
              </div>
              <div className="console-row c-green" style={{ marginTop: '0.4rem' }}>
                ✓ Pipeline completed in 2.14s · Unified developer signal: 84 / 100 [Strong Benchmark]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-eyebrow">INTELLIGENCE MODULES</span>
          <h2 className="landing-section-heading">Six specialized agents. One coherent picture.</h2>
          <p className="landing-section-subheading">
            Each agent inspects a distinct dimension of the software ecosystem, continuously synchronizing
            to give you actionable career insights.
          </p>
        </div>

        <div className="landing-features-grid">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="landing-feature-card">
                <div className="landing-feature-card-header">
                  <div className="landing-feature-icon-box">
                    <Icon size={18} />
                  </div>
                  <span className="chip" style={{ fontSize: '0.6875rem' }}>{item.tag}</span>
                </div>
                <h3 className="landing-feature-title">{item.title}</h3>
                <p className="landing-feature-desc">{item.desc}</p>
                <Link to={item.link} className="landing-feature-link">
                  <span>Open module</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Pipeline / How it Works ─── */}
      <section id="pipeline" className="landing-section landing-section--bordered">
        <div className="landing-section-header">
          <span className="landing-section-eyebrow">ARCHITECTURE</span>
          <h2 className="landing-section-heading">How the telemetry pipeline operates</h2>
          <p className="landing-section-subheading">
            Raw industry signals are ingested, enriched through LangGraph agents, and transformed into high-signal recommendations.
          </p>
        </div>

        <div className="landing-pipeline-list">
          {pipeline.map((p, idx) => (
            <div key={idx} className="landing-pipeline-item">
              <div className="landing-pipeline-step-num">{p.step}</div>
              <div className="landing-pipeline-step-body">
                <h4 className="landing-pipeline-step-title">{p.title}</h4>
                <p className="landing-pipeline-step-desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section id="stack" className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-eyebrow">FOUNDATION</span>
          <h2 className="landing-section-heading">Built with modern systems</h2>
          <p className="landing-section-subheading">
            Engineered with battle-tested libraries and low-latency infrastructure.
          </p>
        </div>

        <div className="landing-stack-grid">
          <div className="landing-stack-card">
            <span className="landing-stack-tag">AI & AGENTS</span>
            <ul className="landing-stack-list">
              <li>LangGraph multi-agent graphs</li>
              <li>Groq Llama 3.3 70B inference</li>
              <li>Custom evaluation prompts</li>
            </ul>
          </div>
          <div className="landing-stack-card">
            <span className="landing-stack-tag">MACHINE LEARNING</span>
            <ul className="landing-stack-list">
              <li>Facebook Prophet time-series</li>
              <li>Auto-ARIMA models</li>
              <li>Scikit-Learn vectorizers</li>
            </ul>
          </div>
          <div className="landing-stack-card">
            <span className="landing-stack-tag">BACKEND RUNTIMES</span>
            <ul className="landing-stack-list">
              <li>FastAPI microservices</li>
              <li>Node.js Express API gateway</li>
              <li>MongoDB persistent storage</li>
            </ul>
          </div>
          <div className="landing-stack-card">
            <span className="landing-stack-tag">FRONTEND ARCHITECTURE</span>
            <ul className="landing-stack-list">
              <li>React 18 + Vite</li>
              <li>Design tokens & CSS variables</li>
              <li>Recharts data visualization</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="landing-section landing-section--bordered">
        <div className="landing-section-header">
          <span className="landing-section-eyebrow">QUESTIONS</span>
          <h2 className="landing-section-heading">Frequently asked questions</h2>
        </div>

        <div className="landing-faq-list">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className={`landing-faq-item ${isOpen ? 'landing-faq-item--open' : ''}`}
                onClick={() => setActiveFaq(isOpen ? null : index)}
              >
                <div className="landing-faq-question">
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                      flexShrink: 0
                    }}
                  />
                </div>
                {isOpen && <div className="landing-faq-answer">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="landing-cta-banner">
        <div className="landing-cta-inner">
          <h2 className="landing-cta-heading">Ready to inspect your developer signal?</h2>
          <p className="landing-cta-subheading">
            Join developers using InnovateX to stay aligned with market demands and discover high-impact career opportunities.
          </p>
          <div className="landing-cta-actions">
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="btn-primary"
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.875rem' }}
            >
              <span>{isAuthenticated ? 'Open Workspace' : 'Get Started for Free'}</span>
              <ArrowRight size={15} />
            </button>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="btn-secondary"
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.875rem' }}
              >
                <span>Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-brand-badge" style={{ width: 22, height: 22, fontSize: '0.6875rem' }}>
              IX
            </div>
            <span className="landing-footer-name">InnovateX</span>
            <span className="landing-footer-copy">© 2026 Developer Intelligence Platform</span>
          </div>
          <div className="landing-footer-status">
            <span className="console-status-indicator" />
            <span>All systems operational</span>
          </div>
        </div>
      </footer>

      {/* ─── Clean Scoped CSS ─── */}
      <style>{`
        .landing-container {
          min-height: 100vh;
          background: var(--bg-root);
          color: var(--text-primary);
          font-family: var(--font-sans);
          display: flex;
          flex-direction: column;
        }

        .landing-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-secondary);
          transition: border-color var(--transition-fast);
        }
        .landing-header--scrolled {
          border-bottom-color: var(--border-primary);
        }
        .landing-header-inner {
          max-width: var(--page-max-width);
          margin: 0 auto;
          padding: 0.875rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          color: var(--text-primary);
          font-weight: 600;
          font-size: 0.9375rem;
          text-decoration: none;
        }
        .landing-brand-badge {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-xs);
          background: var(--text-primary);
          color: var(--bg-root);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .landing-brand-name {
          letter-spacing: -0.01em;
        }

        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 1.75rem;
        }
        .landing-nav-links a {
          color: var(--text-tertiary);
          font-size: 0.8125rem;
          font-weight: 500;
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .landing-nav-links a:hover {
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .landing-nav-links {
            display: none;
          }
        }

        .landing-auth-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* Hero */
        .landing-hero-section {
          padding: 4.5rem 1.5rem 3.5rem;
          display: flex;
          justify-content: center;
          text-align: center;
        }
        .landing-hero-inner {
          max-width: 840px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .landing-hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          background: var(--bg-secondary);
          border: 1px solid var(--border-secondary);
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 1.75rem;
        }
        .landing-hero-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
        }

        .landing-hero-heading {
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 600;
          letter-spacing: -0.035em;
          line-height: 1.15;
          margin-bottom: 1.25rem;
          color: var(--text-primary);
        }

        .landing-hero-subheading {
          font-size: clamp(0.95rem, 2vw, 1.1rem);
          color: var(--text-secondary);
          line-height: 1.65;
          max-width: 680px;
          margin-bottom: 2rem;
        }

        .landing-hero-actions {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 3.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .landing-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          width: 100%;
          padding: 1.5rem 0;
          border-top: 1px solid var(--border-secondary);
          border-bottom: 1px solid var(--border-secondary);
          margin-bottom: 3rem;
        }
        @media (max-width: 640px) {
          .landing-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
        }
        .landing-metric-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .landing-metric-num {
          font-size: 1.5rem;
          font-weight: 600;
          font-family: var(--font-mono);
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .landing-metric-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Console Preview */
        .landing-console-preview {
          width: 100%;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          background: var(--bg-secondary);
          text-align: left;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .landing-console-topbar {
          background: var(--bg-tertiary);
          padding: 0.625rem 1rem;
          border-bottom: 1px solid var(--border-secondary);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .landing-console-dots {
          display: flex;
          gap: 0.375rem;
        }
        .console-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--border-hover);
        }
        .landing-console-title {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--text-tertiary);
        }
        .landing-console-status {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-family: var(--font-mono);
          font-size: 0.625rem;
          color: var(--success);
          font-weight: 500;
        }
        .console-status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success);
        }
        .landing-console-body {
          padding: 1.25rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          line-height: 1.6;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .c-dim { color: var(--text-quaternary); }
        .c-cyan { color: #38bdf8; }
        .c-muted { color: var(--text-tertiary); }
        .c-text { color: var(--text-primary); }
        .c-green { color: var(--success); font-weight: 500; }

        /* Sections */
        .landing-section {
          max-width: var(--page-max-width);
          margin: 0 auto;
          width: 100%;
          padding: 4.5rem 1.5rem;
        }
        .landing-section--bordered {
          border-top: 1px solid var(--border-secondary);
        }
        .landing-section-header {
          margin-bottom: 2.75rem;
          text-align: center;
          max-width: 680px;
          margin-left: auto;
          margin-right: auto;
        }
        .landing-section-eyebrow {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
          display: block;
          margin-bottom: 0.5rem;
        }
        .landing-section-heading {
          font-size: clamp(1.6rem, 3.5vw, 2.2rem);
          font-weight: 600;
          letter-spacing: -0.025em;
          margin-bottom: 0.75rem;
        }
        .landing-section-subheading {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* Features Grid */
        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) {
          .landing-features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .landing-features-grid {
            grid-template-columns: 1fr;
          }
        }
        .landing-feature-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          transition: border-color var(--transition-fast), background var(--transition-fast);
        }
        .landing-feature-card:hover {
          border-color: var(--border-primary);
          background: var(--bg-tertiary);
        }
        .landing-feature-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .landing-feature-icon-box {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background: var(--bg-elevated);
          border: 1px solid var(--border-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
        }
        .landing-feature-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }
        .landing-feature-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.55;
          margin-bottom: 1.25rem;
          flex: 1;
        }
        .landing-feature-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .landing-feature-card:hover .landing-feature-link {
          color: var(--text-primary);
        }

        /* Pipeline */
        .landing-pipeline-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          max-width: 780px;
          margin: 0 auto;
        }
        .landing-pipeline-item {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          padding: 1.25rem 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-md);
        }
        .landing-pipeline-step-num {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent-text);
          padding: 0.2rem 0.5rem;
          background: var(--accent-muted);
          border-radius: var(--radius-xs);
          flex-shrink: 0;
        }
        .landing-pipeline-step-title {
          font-size: 0.9375rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .landing-pipeline-step-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Stack Grid */
        .landing-stack-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) {
          .landing-stack-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .landing-stack-grid {
            grid-template-columns: 1fr;
          }
        }
        .landing-stack-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-md);
          padding: 1.5rem;
        }
        .landing-stack-tag {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          display: block;
          margin-bottom: 1rem;
        }
        .landing-stack-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .landing-stack-list li {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .landing-stack-list li::before {
          content: '—';
          color: var(--text-quaternary);
          font-family: var(--font-mono);
        }

        /* FAQ */
        .landing-faq-list {
          max-width: 760px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .landing-faq-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-secondary);
          border-radius: var(--radius-md);
          padding: 1.125rem 1.25rem;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .landing-faq-item:hover,
        .landing-faq-item--open {
          border-color: var(--border-primary);
        }
        .landing-faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          gap: 1rem;
        }
        .landing-faq-answer {
          margin-top: 0.75rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.6;
          border-top: 1px solid var(--border-secondary);
          padding-top: 0.75rem;
        }

        /* Bottom CTA */
        .landing-cta-banner {
          border-top: 1px solid var(--border-secondary);
          background: var(--bg-secondary);
          padding: 4.5rem 1.5rem;
          text-align: center;
        }
        .landing-cta-inner {
          max-width: 600px;
          margin: 0 auto;
        }
        .landing-cta-heading {
          font-size: 1.875rem;
          font-weight: 600;
          letter-spacing: -0.025em;
          margin-bottom: 0.75rem;
        }
        .landing-cta-subheading {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1.75rem;
        }
        .landing-cta-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.875rem;
        }

        /* Footer */
        .landing-footer {
          border-top: 1px solid var(--border-secondary);
          padding: 1.5rem;
        }
        .landing-footer-inner {
          max-width: var(--page-max-width);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .landing-footer-brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .landing-footer-name {
          font-weight: 600;
          font-size: 0.8125rem;
        }
        .landing-footer-copy {
          color: var(--text-tertiary);
          font-size: 0.75rem;
          margin-left: 0.5rem;
        }
        .landing-footer-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
