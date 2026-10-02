import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  Github,
  BookOpen,
  TrendingUp,
  Briefcase,
  GitPullRequest,
  Trophy,
  Shield,
  Cpu,
  Terminal,
  CheckCircle2,
  ExternalLink,
  Code2,
  Lock,
  Zap,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Star,
  Play,
  BarChart3,
  Search,
  Globe,
  Rocket,
  Eye,
  Activity,
  MousePointer,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ────────────────────────────────────────────────────────
   INTERSECTION OBSERVER HOOK – scroll-triggered animations
   ──────────────────────────────────────────────────────── */
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
};

/* ────────────────────────────────────────────────────────
   ANIMATED COUNTER – counts up when in view
   ──────────────────────────────────────────────────────── */
const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ────────────────────────────────────────────────────────
   FLOATING ORB BACKGROUND
   ──────────────────────────────────────────────────────── */
const FloatingOrbs = () => (
  <div className="landing-orbs" aria-hidden="true">
    <div className="landing-orb landing-orb--1" />
    <div className="landing-orb landing-orb--2" />
    <div className="landing-orb landing-orb--3" />
    <div className="landing-orb landing-orb--4" />
  </div>
);

/* ────────────────────────────────────────────────────────
   GRID BACKGROUND PATTERN
   ──────────────────────────────────────────────────────── */
const GridPattern = () => (
  <div className="landing-grid-pattern" aria-hidden="true">
    <div className="landing-grid-fade" />
  </div>
);

/* ────────────────────────────────────────────────────────
   FEATURE CARD (BENTO GRID)
   ──────────────────────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, desc, color, accent, link, idx, isLarge }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`landing-feature-card ${isLarge ? 'landing-feature-card--large' : ''}`}
      style={{
        '--card-accent': color,
        '--card-delay': `${idx * 0.08}s`,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s cubic-bezier(.16,1,.3,1) var(--card-delay), transform 0.6s cubic-bezier(.16,1,.3,1) var(--card-delay)`,
      }}
    >
      <div className="landing-feature-card__glow" />
      <div className="landing-feature-card__icon" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <h3 className="landing-feature-card__title">{title}</h3>
      <p className="landing-feature-card__desc">{desc}</p>
      <Link to={link} className="landing-feature-card__link" style={{ color }}>
        <span>Explore</span>
        <ArrowUpRight size={14} />
      </Link>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   PIPELINE STEP
   ──────────────────────────────────────────────────────── */
const PipelineStep = ({ step, label, desc, idx, total }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className="landing-pipeline-step"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateX(0)' : 'translateX(-20px)',
        transition: `all 0.5s cubic-bezier(.16,1,.3,1) ${idx * 0.1}s`,
      }}
    >
      <div className="landing-pipeline-step__number">
        <span>{step}</span>
        {idx < total - 1 && <div className="landing-pipeline-step__connector" />}
      </div>
      <div className="landing-pipeline-step__content">
        <h4>{label}</h4>
        <p>{desc}</p>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   LANDING PAGE COMPONENT
   ════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: Github, title: 'GitHub Intelligence',
      desc: 'Deep repository analysis — commit cadences, architecture ergonomics, dependency footprint, and head-to-head peer benchmarking powered by LangGraph agents.',
      color: '#a78bfa', link: isAuthenticated ? '/github' : '/register', isLarge: true,
    },
    {
      icon: TrendingUp, title: 'Market Forecaster',
      desc: 'Prophet + ARIMA pipelines model 26-week demand trajectories from 50,000+ hiring specs to surface emerging skill regimes.',
      color: '#38bdf8', link: isAuthenticated ? '/market' : '/register',
    },
    {
      icon: BookOpen, title: 'Research Agent',
      desc: 'Transforms ArXiv preprints into plain-English intuition, mathematical proofs, ablations, and production-ready code takeaways.',
      color: '#34d399', link: isAuthenticated ? '/research' : '/register',
    },
    {
      icon: Briefcase, title: 'Job Matching & ATS',
      desc: 'Semantic vector alignment of your resume against live openings — exposing ATS keyword penalties and skill gap deltas.',
      color: '#fbbf24', link: isAuthenticated ? '/jobs' : '/register',
    },
    {
      icon: GitPullRequest, title: 'Open Source Engine',
      desc: 'Stack-matched GitHub issues with step-by-step reproduction guides, target files to edit, and formatted PR templates.',
      color: '#2dd4bf', link: isAuthenticated ? '/opensource' : '/register',
    },
    {
      icon: Trophy, title: 'Contest Radar',
      desc: 'Live countdown calendar tracking Codeforces, LeetCode, CodeChef & AtCoder with profile-aware difficulty recommendations.',
      color: '#f472b6', link: isAuthenticated ? '/contests' : '/register', isLarge: true,
    },
  ];

  const pipeline = [
    { step: '01', label: 'Data Ingestion', desc: 'GitHub API, ArXiv, JSearch, Kontests — real-time data feeds' },
    { step: '02', label: 'Normalization', desc: 'Skill taxonomy extraction & semantic embedding generation' },
    { step: '03', label: 'Agent Pipelines', desc: 'LangGraph state graphs + Groq Llama 3.3 70B inference' },
    { step: '04', label: 'Quantitative Analysis', desc: 'Prophet time-series forecasting & ATS vector scoring' },
    { step: '05', label: 'Cross-Reference', desc: 'Profile vs. Market vs. Literature multi-axis alignment' },
    { step: '06', label: 'Intelligence Output', desc: 'Actionable developer signal dossier with scored dimensions' },
  ];

  const questions = [
    { q: 'Is my current tech stack still in demand?', a: 'Market Forecast crosses your GitHub repository languages with 50,000+ active job specs, computing 26-week demand trajectories and classifying regimes — Expansion, Acceleration, Stable, or Decline.' },
    { q: 'What should I build or learn next?', a: 'The system examines co-occurring technology clusters in market data, cross-referencing your ATS gap analysis to suggest high-leverage skills.' },
    { q: 'Why am I missing interview calls?', a: 'The ATS Job Matcher runs semantic keyword and architecture vector comparison against live postings, exposing missing skills and ATS keyword penalties.' },
    { q: 'Which open source projects match my skills?', a: 'Open Source Intelligence matches your exact stack with open GitHub issues, generating contribution blueprints with target files, reproduction steps, and PR templates.' },
  ];

  const techStack = [
    { label: 'AI Agents', items: ['LangGraph', 'Groq Llama 3.3 70B', 'Multi-Agent State Graphs'] },
    { label: 'ML Pipeline', items: ['Facebook Prophet', 'ARIMA', 'Scikit-Learn'] },
    { label: 'Backend', items: ['FastAPI', 'Node.js Express', 'MongoDB'] },
    { label: 'Frontend', items: ['React 18', 'Vite', 'Recharts SVG'] },
  ];

  return (
    <div className="landing-root">
      <style>{landingStyles}</style>

      {/* ─── NAVBAR ─── */}
      <header className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav__inner">
          <Link to="/" className="landing-nav__logo">
            <div className="landing-nav__logo-icon">
              <Layers size={16} />
            </div>
            <span>INNOVATEX</span>
          </Link>

          <nav className="landing-nav__links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#tech">Tech Stack</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="landing-nav__actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="landing-btn landing-btn--primary">
                <span>Open Workspace</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-btn landing-btn--ghost">Sign In</Link>
                <Link to="/register" className="landing-btn landing-btn--primary">
                  <span>Get Started</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="landing-hero">
        <FloatingOrbs />
        <GridPattern />

        <div className="landing-hero__content">
          <div className="landing-hero__badge">
            <div className="landing-hero__badge-dot" />
            <span>Autonomous Multi-Agent Intelligence Platform</span>
          </div>

          <h1 className="landing-hero__title">
            Your career intelligence
            <br />
            <span className="landing-hero__title-accent">operating system.</span>
          </h1>

          <p className="landing-hero__subtitle">
            Connect your code, skills, research, and market signals into one 
            continuously evolving intelligence workspace — powered by AI agents 
            that understand developers.
          </p>

          <div className="landing-hero__cta">
            <Link
              to={isAuthenticated ? '/github' : '/register'}
              className="landing-btn landing-btn--hero"
            >
              <Sparkles size={16} />
              <span>Analyze My Profile</span>
              <ArrowRight size={15} />
            </Link>
            <a href="#features" className="landing-btn landing-btn--outline">
              <Play size={14} />
              <span>See How It Works</span>
            </a>
          </div>

          {/* Hero Stats */}
          <div className="landing-hero__stats">
            <div className="landing-hero__stat">
              <span className="landing-hero__stat-value"><AnimatedCounter end={6} /></span>
              <span className="landing-hero__stat-label">Intelligence Layers</span>
            </div>
            <div className="landing-hero__stat-divider" />
            <div className="landing-hero__stat">
              <span className="landing-hero__stat-value"><AnimatedCounter end={50} suffix="K+" /></span>
              <span className="landing-hero__stat-label">Job Specs Analyzed</span>
            </div>
            <div className="landing-hero__stat-divider" />
            <div className="landing-hero__stat">
              <span className="landing-hero__stat-value"><AnimatedCounter end={26} suffix="W" /></span>
              <span className="landing-hero__stat-label">Forecast Horizon</span>
            </div>
            <div className="landing-hero__stat-divider" />
            <div className="landing-hero__stat">
              <span className="landing-hero__stat-value"><AnimatedCounter end={24} /></span>
              <span className="landing-hero__stat-label">Signal Metrics</span>
            </div>
          </div>
        </div>

        {/* Hero Terminal Preview */}
        <div className="landing-hero__terminal">
          <div className="landing-hero__terminal-chrome">
            <div className="landing-hero__terminal-dots">
              <span /><span /><span />
            </div>
            <span className="landing-hero__terminal-title">
              <Terminal size={12} /> innovatex — intelligence pipeline
            </span>
          </div>
          <div className="landing-hero__terminal-body">
            <code>
              <span className="t-dim">{'>'} </span>
              <span className="t-keyword">analyzing</span> <span className="t-str">@developer</span> profile<span className="t-dim">...</span>
              {'\n\n'}
              <span className="t-dim">  ├─ </span><span className="t-accent">GitHub</span>{'     '}scanning 47 repositories
              {'\n'}
              <span className="t-dim">  ├─ </span><span className="t-green">Market</span>{'     '}forecasting 26-week demand trajectory
              {'\n'}
              <span className="t-dim">  ├─ </span><span className="t-purple">Research</span>{'   '}synthesizing 12 ArXiv papers
              {'\n'}
              <span className="t-dim">  ├─ </span><span className="t-yellow">ATS</span>{'        '}scoring against 142 live openings
              {'\n'}
              <span className="t-dim">  ├─ </span><span className="t-teal">OSS</span>{'        '}matching 8 contribution opportunities
              {'\n'}
              <span className="t-dim">  └─ </span><span className="t-pink">Contests</span>{'   '}3 upcoming rounds in 48h
              {'\n\n'}
              <span className="t-dim">{'>'} </span><span className="t-green">✓</span> Signal computed: <span className="t-value">91.4</span><span className="t-dim">/100</span> — <span className="t-accent">Elite Cohort</span>
              {'\n'}
              <span className="t-dim">{'>'} </span>6 intelligence layers synthesized in <span className="t-value">3.2s</span>
            </code>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF BAR ─── */}
      <section className="landing-proof">
        <div className="landing-proof__inner">
          <span className="landing-proof__label">BUILT WITH</span>
          <div className="landing-proof__items">
            {['LangGraph', 'Groq', 'Prophet', 'FastAPI', 'React', 'MongoDB'].map((t) => (
              <span key={t} className="landing-proof__item">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES BENTO GRID ─── */}
      <section id="features" className="landing-section">
        <div className="landing-section__header">
          <span className="landing-section__eyebrow">Intelligence Layers</span>
          <h2 className="landing-section__title">
            Six autonomous agents.<br />One unified signal.
          </h2>
          <p className="landing-section__desc">
            Each module is a specialized AI pipeline — not a static dashboard. They cross-reference each other to produce actionable intelligence you can't get anywhere else.
          </p>
        </div>

        <div className="landing-bento">
          {features.map((f, idx) => (
            <FeatureCard key={f.title} {...f} idx={idx} />
          ))}
        </div>
      </section>

      {/* ─── DEVELOPER SIGNAL SHOWCASE ─── */}
      <section className="landing-section landing-signal-section">
        <div className="landing-signal">
          <div className="landing-signal__left">
            <span className="landing-section__eyebrow" style={{ color: '#10b981' }}>Developer Signal</span>
            <h2 className="landing-section__title" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)' }}>
              Beyond vanity metrics.
            </h2>
            <p className="landing-section__desc" style={{ textAlign: 'left', maxWidth: '100%' }}>
              InnovateX synthesizes code quality, market demand, research comprehension, 
              and open source leverage into a quantitative signal that actually means something.
            </p>

            <div className="landing-signal__bars">
              {[
                { label: 'Architecture Maturity', value: 94, color: '#38bdf8' },
                { label: 'Market Alignment', value: 88, color: '#10b981' },
                { label: 'Research Comprehension', value: 78, color: '#a78bfa' },
                { label: 'Contribution Impact', value: 85, color: '#fbbf24' },
              ].map((bar) => (
                <BarItem key={bar.label} {...bar} />
              ))}
            </div>
          </div>

          <div className="landing-signal__right">
            <div className="landing-signal__card">
              <div className="landing-signal__card-header">
                <div>
                  <span className="landing-signal__card-eyebrow">COMPOSITE PROFILE</span>
                  <h3 className="landing-signal__card-title">Senior Systems Architect</h3>
                </div>
                <div className="landing-signal__score">
                  <span className="landing-signal__score-value">91.4</span>
                  <span className="landing-signal__score-label">/ 100</span>
                </div>
              </div>
              <div className="landing-signal__card-tier">
                <Star size={14} style={{ color: '#fbbf24' }} />
                <span>Elite Cohort</span>
              </div>
              <div className="landing-signal__card-meta">
                <span><CheckCircle2 size={12} /> GitHub + ArXiv + JSearch + Prophet</span>
                <span><Activity size={12} /> Real-time multi-agent synthesis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="landing-section">
        <div className="landing-section__header">
          <span className="landing-section__eyebrow" style={{ color: '#38bdf8' }}>Pipeline</span>
          <h2 className="landing-section__title">How InnovateX works.</h2>
          <p className="landing-section__desc">
            From raw data to actionable intelligence in six autonomous steps.
          </p>
        </div>

        <div className="landing-pipeline">
          {pipeline.map((p, idx) => (
            <PipelineStep key={p.step} {...p} idx={idx} total={pipeline.length} />
          ))}
        </div>
      </section>

      {/* ─── TECH STACK ─── */}
      <section id="tech" className="landing-section">
        <div className="landing-section__header">
          <span className="landing-section__eyebrow" style={{ color: '#a78bfa' }}>Architecture</span>
          <h2 className="landing-section__title">Production-grade stack.</h2>
          <p className="landing-section__desc">
            Built on specialized microservices with distributed LLM inference, 
            time-series ML, and a reactive frontend.
          </p>
        </div>

        <div className="landing-tech-grid">
          {techStack.map((group) => (
            <TechGroup key={group.label} {...group} />
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="landing-section">
        <div className="landing-section__header">
          <span className="landing-section__eyebrow" style={{ color: '#fbbf24' }}>Answers</span>
          <h2 className="landing-section__title">Questions developers ask.</h2>
        </div>

        <div className="landing-faq">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className={`landing-faq__item ${activeQuestion === idx ? 'landing-faq__item--open' : ''}`}
              onClick={() => setActiveQuestion(activeQuestion === idx ? null : idx)}
            >
              <div className="landing-faq__question">
                <h3>{q.q}</h3>
                <ChevronDown size={18} className="landing-faq__chevron" />
              </div>
              {activeQuestion === idx && (
                <div className="landing-faq__answer">
                  <p>{q.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRIVACY ─── */}
      <section className="landing-section">
        <div className="landing-privacy">
          <div className="landing-privacy__icon">
            <Shield size={24} />
          </div>
          <div className="landing-privacy__content">
            <h3>Zero-Fabrication Data & Privacy</h3>
            <p>
              InnovateX strictly queries real verified endpoints — public GitHub repos, ArXiv preprints, 
              live job postings, and public contest schedules. No mock data. Your uploaded resumes are 
              parsed in memory and never indexed for model training.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="landing-cta">
        <FloatingOrbs />
        <div className="landing-cta__content">
          <h2 className="landing-cta__title">
            Ready to discover your<br />
            <span className="landing-cta__title-accent">developer signal?</span>
          </h2>
          <p className="landing-cta__desc">
            See where your engineering profile stands against the market — in under 60 seconds.
          </p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="landing-btn landing-btn--hero"
          >
            <Rocket size={16} />
            <span>Get Started Free</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <div className="landing-nav__logo-icon" style={{ width: 22, height: 22 }}>
              <Layers size={12} />
            </div>
            <span>INNOVATEX</span>
          </div>
          <span className="landing-footer__status">
            <span className="landing-footer__status-dot" />
            All systems operational
          </span>
        </div>
      </footer>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   BAR ITEM (Signal Section)
   ──────────────────────────────────────────────────────── */
const BarItem = ({ label, value, color }) => {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className="landing-signal__bar-item">
      <div className="landing-signal__bar-header">
        <span>{label}</span>
        <span style={{ color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}%</span>
      </div>
      <div className="landing-signal__bar-track">
        <div
          className="landing-signal__bar-fill"
          style={{
            width: inView ? `${value}%` : '0%',
            background: color,
            transition: 'width 1.2s cubic-bezier(.16,1,.3,1) 0.2s',
          }}
        />
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────
   TECH GROUP (Stack Section)
   ──────────────────────────────────────────────────────── */
const TechGroup = ({ label, items }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className="landing-tech-group"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s cubic-bezier(.16,1,.3,1)',
      }}
    >
      <h4 className="landing-tech-group__label">{label}</h4>
      <div className="landing-tech-group__items">
        {items.map((item) => (
          <span key={item} className="landing-tech-group__item">{item}</span>
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCOPED LANDING PAGE STYLES  (injected via <style> tag)
   ════════════════════════════════════════════════════════════════ */
const landingStyles = `
/* ─── ROOT ─── */
.landing-root {
  background: #050507;
  color: #f4f4f6;
  min-height: 100vh;
  font-family: var(--font-sans);
  overflow-x: hidden;
  position: relative;
}

/* ─── FLOATING ORBS ─── */
.landing-orbs {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.landing-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;
  animation: orbFloat 20s ease-in-out infinite;
}
.landing-orb--1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, #6366f1 0%, transparent 70%);
  top: -15%; left: -10%;
  animation-delay: 0s;
}
.landing-orb--2 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, #38bdf8 0%, transparent 70%);
  top: 10%; right: -8%;
  animation-delay: -5s;
}
.landing-orb--3 {
  width: 450px; height: 450px;
  background: radial-gradient(circle, #a78bfa 0%, transparent 70%);
  bottom: 5%; left: 20%;
  animation-delay: -10s;
}
.landing-orb--4 {
  width: 350px; height: 350px;
  background: radial-gradient(circle, #10b981 0%, transparent 70%);
  bottom: 20%; right: 15%;
  animation-delay: -15s;
}
@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -40px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(40px, 30px) scale(1.02); }
}

/* ─── GRID PATTERN ─── */
.landing-grid-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}
.landing-grid-fade {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, #050507 100%);
}

/* ─── NAVBAR ─── */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0 2rem;
  transition: all 0.3s ease;
  background: transparent;
}
.landing-nav--scrolled {
  background: rgba(5, 5, 7, 0.85);
  backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.landing-nav__inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.landing-nav__logo {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.9rem;
  font-weight: 800;
  font-family: var(--font-mono);
  letter-spacing: -0.01em;
  color: #fff;
}
.landing-nav__logo-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(135deg, #6366f1, #38bdf8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.landing-nav__links {
  display: flex;
  gap: 2rem;
  font-size: 0.8125rem;
  font-weight: 500;
}
.landing-nav__links a {
  color: #a1a1aa;
  transition: color 0.15s;
}
.landing-nav__links a:hover { color: #fff; }
.landing-nav__actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

/* ─── BUTTONS ─── */
.landing-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.8125rem;
  border-radius: 8px;
  padding: 0.55rem 1.1rem;
  transition: all 0.2s cubic-bezier(.16,1,.3,1);
  cursor: pointer;
  text-decoration: none;
  border: none;
  font-family: var(--font-sans);
}
.landing-btn--primary {
  background: #fff;
  color: #09090b;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.landing-btn--primary:hover {
  background: #e4e4e7;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.landing-btn--ghost {
  background: transparent;
  color: #a1a1aa;
  padding: 0.55rem 0.85rem;
}
.landing-btn--ghost:hover { color: #fff; }
.landing-btn--hero {
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #6366f1);
  background-size: 200% 200%;
  animation: gradientShift 4s ease infinite;
  color: #fff;
  padding: 0.75rem 1.6rem;
  font-size: 0.95rem;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.35), 0 4px 15px rgba(0,0,0,0.3);
}
.landing-btn--hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 45px rgba(99, 102, 241, 0.5), 0 8px 25px rgba(0,0,0,0.4);
}
.landing-btn--outline {
  background: rgba(255,255,255,0.04);
  color: #d4d4d8;
  border: 1px solid rgba(255,255,255,0.1);
  padding: 0.75rem 1.6rem;
  font-size: 0.95rem;
  border-radius: 10px;
}
.landing-btn--outline:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.18);
  color: #fff;
  transform: translateY(-1px);
}
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ─── HERO ─── */
.landing-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8rem 1.5rem 4rem;
  gap: 3rem;
}
.landing-hero__content {
  position: relative;
  z-index: 10;
  max-width: 820px;
}
.landing-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.85rem;
  border-radius: 9999px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: #a78bfa;
  font-weight: 600;
  margin-bottom: 1.75rem;
  animation: fadeIn 0.6s ease;
}
.landing-hero__badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}
.landing-hero__title {
  font-size: clamp(2.8rem, 6vw, 4.5rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: #fff;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.7s ease 0.1s both;
}
.landing-hero__title-accent {
  background: linear-gradient(135deg, #6366f1, #38bdf8, #a78bfa);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 5s ease infinite;
}
.landing-hero__subtitle {
  font-size: clamp(1rem, 1.8vw, 1.15rem);
  color: #a1a1aa;
  line-height: 1.7;
  max-width: 620px;
  margin: 0 auto 2.5rem;
  animation: fadeIn 0.7s ease 0.2s both;
}
.landing-hero__cta {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeIn 0.7s ease 0.3s both;
}
.landing-hero__stats {
  display: flex;
  align-items: center;
  gap: 0;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 3.5rem;
  padding: 1.25rem 2rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.7s ease 0.5s both;
}
.landing-hero__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1.5rem;
}
.landing-hero__stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  font-family: var(--font-mono);
  color: #fff;
  letter-spacing: -0.02em;
}
.landing-hero__stat-label {
  font-size: 0.72rem;
  color: #71717a;
  font-weight: 500;
  margin-top: 0.2rem;
}
.landing-hero__stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(255,255,255,0.08);
}

/* ─── HERO TERMINAL ─── */
.landing-hero__terminal {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 680px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99, 102, 241, 0.1);
  animation: fadeIn 0.8s ease 0.6s both;
}
.landing-hero__terminal-chrome {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  background: rgba(15, 15, 20, 0.95);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.landing-hero__terminal-dots {
  display: flex;
  gap: 5px;
}
.landing-hero__terminal-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.landing-hero__terminal-dots span:nth-child(1) { background: #f43f5e; }
.landing-hero__terminal-dots span:nth-child(2) { background: #fbbf24; }
.landing-hero__terminal-dots span:nth-child(3) { background: #10b981; }
.landing-hero__terminal-title {
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: #52525b;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.landing-hero__terminal-body {
  background: rgba(8, 8, 12, 0.95);
  padding: 1.25rem 1.35rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.6;
  white-space: pre;
  overflow-x: auto;
  backdrop-filter: blur(8px);
}
.landing-hero__terminal-body code {
  color: #d4d4d8;
}
.t-dim { color: #3f3f46; }
.t-keyword { color: #c084fc; }
.t-str { color: #38bdf8; }
.t-accent { color: #38bdf8; }
.t-green { color: #10b981; }
.t-purple { color: #a78bfa; }
.t-yellow { color: #fbbf24; }
.t-teal { color: #2dd4bf; }
.t-pink { color: #f472b6; }
.t-value { color: #10b981; font-weight: 700; }

/* ─── SOCIAL PROOF BAR ─── */
.landing-proof {
  position: relative;
  z-index: 10;
  border-top: 1px solid rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.02);
}
.landing-proof__inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2.5rem;
  padding: 1.25rem 2rem;
  flex-wrap: wrap;
}
.landing-proof__label {
  font-size: 0.68rem;
  font-family: var(--font-mono);
  color: #52525b;
  font-weight: 700;
  letter-spacing: 0.1em;
  white-space: nowrap;
}
.landing-proof__items {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}
.landing-proof__item {
  font-size: 0.875rem;
  font-weight: 600;
  color: #52525b;
  letter-spacing: 0.02em;
  transition: color 0.2s;
}
.landing-proof__item:hover { color: #a1a1aa; }

/* ─── SECTIONS ─── */
.landing-section {
  position: relative;
  z-index: 10;
  max-width: 1200px;
  margin: 0 auto;
  padding: 6rem 2rem;
}
.landing-section__header {
  text-align: center;
  margin-bottom: 4rem;
}
.landing-section__eyebrow {
  font-size: 0.72rem;
  font-family: var(--font-mono);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6366f1;
}
.landing-section__title {
  font-size: clamp(1.8rem, 4vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  color: #fff;
  margin-top: 0.5rem;
  line-height: 1.15;
}
.landing-section__desc {
  font-size: 0.95rem;
  color: #a1a1aa;
  max-width: 560px;
  margin: 0.75rem auto 0;
  line-height: 1.65;
}

/* ─── BENTO GRID ─── */
.landing-bento {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
@media (max-width: 900px) {
  .landing-bento {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .landing-bento {
    grid-template-columns: 1fr;
  }
}

/* ─── FEATURE CARD ─── */
.landing-feature-card {
  position: relative;
  background: rgba(15, 15, 20, 0.7);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  overflow: hidden;
  transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
  backdrop-filter: blur(8px);
}
.landing-feature-card:hover {
  border-color: var(--card-accent, rgba(255,255,255,0.12));
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 30px color-mix(in srgb, var(--card-accent, #6366f1) 15%, transparent);
}
.landing-feature-card--large {
  grid-column: span 2;
}
@media (max-width: 600px) {
  .landing-feature-card--large {
    grid-column: span 1;
  }
}
.landing-feature-card__glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 50% 50%, var(--card-accent, #6366f1), transparent 65%);
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
}
.landing-feature-card:hover .landing-feature-card__glow {
  opacity: 0.04;
}
.landing-feature-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.landing-feature-card__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}
.landing-feature-card__desc {
  font-size: 0.85rem;
  color: #a1a1aa;
  line-height: 1.6;
  margin: 0;
  flex: 1;
}
.landing-feature-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-top: 0.25rem;
  transition: gap 0.2s;
}
.landing-feature-card__link:hover {
  gap: 0.6rem;
}

/* ─── SIGNAL SECTION ─── */
.landing-signal-section {
  border-top: 1px solid rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(255,255,255,0.015);
}
.landing-signal {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}
@media (max-width: 800px) {
  .landing-signal { grid-template-columns: 1fr; }
}
.landing-signal__bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}
.landing-signal__bar-item {}
.landing-signal__bar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  font-size: 0.78rem;
  color: #a1a1aa;
}
.landing-signal__bar-track {
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
}
.landing-signal__bar-fill {
  height: 100%;
  border-radius: 3px;
}
.landing-signal__card {
  background: rgba(15, 15, 20, 0.8);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.4);
}
.landing-signal__card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.landing-signal__card-eyebrow {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: #6366f1;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.landing-signal__card-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  margin: 0.25rem 0 0;
}
.landing-signal__score {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}
.landing-signal__score-value {
  font-size: 2.5rem;
  font-weight: 800;
  font-family: var(--font-mono);
  color: #10b981;
  letter-spacing: -0.03em;
}
.landing-signal__score-label {
  font-size: 1rem;
  color: #52525b;
  font-family: var(--font-mono);
}
.landing-signal__card-tier {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.85rem;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #fbbf24;
  width: fit-content;
}
.landing-signal__card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.landing-signal__card-meta span {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  color: #71717a;
}

/* ─── PIPELINE ─── */
.landing-pipeline {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.landing-pipeline-step {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}
.landing-pipeline-step__number {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}
.landing-pipeline-step__number span {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
  font-family: var(--font-mono);
  color: #a78bfa;
}
.landing-pipeline-step__connector {
  width: 2px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(99, 102, 241, 0.3), rgba(99, 102, 241, 0.05));
}
.landing-pipeline-step__content {
  padding: 0.35rem 0 2rem;
}
.landing-pipeline-step__content h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.25rem;
}
.landing-pipeline-step__content p {
  font-size: 0.85rem;
  color: #a1a1aa;
  margin: 0;
  line-height: 1.5;
}

/* ─── TECH GRID ─── */
.landing-tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
.landing-tech-group {
  background: rgba(15, 15, 20, 0.7);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  padding: 1.5rem;
  backdrop-filter: blur(8px);
}
.landing-tech-group__label {
  font-size: 0.68rem;
  font-family: var(--font-mono);
  color: #6366f1;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 1rem;
}
.landing-tech-group__items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.landing-tech-group__item {
  font-size: 0.875rem;
  color: #d4d4d8;
  padding: 0.55rem 0.75rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
  transition: all 0.2s;
}
.landing-tech-group__item:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.1);
}

/* ─── FAQ ─── */
.landing-faq {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.landing-faq__item {
  background: rgba(15, 15, 20, 0.7);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
}
.landing-faq__item:hover {
  border-color: rgba(255,255,255,0.12);
}
.landing-faq__item--open {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(99, 102, 241, 0.04);
}
.landing-faq__question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.landing-faq__question h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}
.landing-faq__chevron {
  color: #52525b;
  transition: transform 0.25s;
  flex-shrink: 0;
}
.landing-faq__item--open .landing-faq__chevron {
  transform: rotate(180deg);
  color: #6366f1;
}
.landing-faq__answer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.landing-faq__answer p {
  font-size: 0.875rem;
  color: #a1a1aa;
  line-height: 1.7;
  margin: 0;
}

/* ─── PRIVACY ─── */
.landing-privacy {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  background: rgba(16, 185, 129, 0.04);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 14px;
  padding: 2rem;
}
.landing-privacy__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
  flex-shrink: 0;
}
.landing-privacy__content h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.6rem;
}
.landing-privacy__content p {
  font-size: 0.875rem;
  color: #a1a1aa;
  line-height: 1.7;
  margin: 0;
}

/* ─── CTA ─── */
.landing-cta {
  position: relative;
  padding: 8rem 2rem;
  text-align: center;
  overflow: hidden;
}
.landing-cta__content {
  position: relative;
  z-index: 10;
}
.landing-cta__title {
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}
.landing-cta__title-accent {
  background: linear-gradient(135deg, #6366f1, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.landing-cta__desc {
  font-size: 1.05rem;
  color: #a1a1aa;
  max-width: 480px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
}

/* ─── FOOTER ─── */
.landing-footer {
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 1.5rem 2rem;
  position: relative;
  z-index: 10;
}
.landing-footer__inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.landing-footer__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: #52525b;
}
.landing-footer__status {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-family: var(--font-mono);
  color: #52525b;
}
.landing-footer__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

/* ─── RESPONSIVE ─── */
@media (max-width: 768px) {
  .landing-nav__links { display: none; }
  .landing-hero { padding: 6rem 1.25rem 3rem; min-height: auto; }
  .landing-hero__stats { flex-direction: column; gap: 1rem; }
  .landing-hero__stat-divider { width: 40px; height: 1px; }
  .landing-hero__stat { padding: 0.5rem 0; }
  .landing-hero__terminal { max-width: 100%; }
  .landing-hero__terminal-body { font-size: 0.7rem; }
  .landing-section { padding: 4rem 1.25rem; }
  .landing-signal { grid-template-columns: 1fr; }
  .landing-privacy { flex-direction: column; }
  .landing-cta { padding: 5rem 1.25rem; }
}
`;

export default LandingPage;
