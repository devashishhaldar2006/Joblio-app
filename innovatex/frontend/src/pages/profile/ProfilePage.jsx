import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import IntelligenceHeader from '../../components/common/IntelligenceHeader';
import SectionHeader from '../../components/common/SectionHeader';
import Metric from '../../components/common/Metric';
import {
  User,
  Mail,
  Github,
  Briefcase,
  MapPin,
  Lock,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
  Shield,
  Layers,
  Award,
  BookOpen,
  GitPullRequest,
  TrendingUp,
  Trophy,
  Sliders,
  Settings
} from 'lucide-react';

const COMMON_SKILLS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Docker',
  'PostgreSQL', 'FastAPI', 'AWS', 'GraphQL', 'PyTorch',
  'MongoDB', 'Redis', 'Kubernetes', 'TailwindCSS', 'Go', 'Rust'
];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const locationObj = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'settings' ? 'settings' : 'identity';
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(locationObj.search);
    setActiveTab(params.get('tab') === 'settings' ? 'settings' : 'identity');
  }, [locationObj.search]);

  // Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [workType, setWorkType] = useState('Remote');
  const [emailAlerts, setEmailAlerts] = useState(true);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Platform Telemetry across the 6 layers
  const [telemetry, setTelemetry] = useState({
    analysesCount: 0,
    papersCount: 0,
    bookmarksCount: 0,
    ossSearches: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileRes, ghRes, paperRes, bookmarksRes, ossRes] = await Promise.allSettled([
          api.get('/auth/profile'),
          api.get('/github/history'),
          api.get('/research/history'),
          api.get('/jobs/bookmarks'),
          api.get('/opensource/history')
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.data) {
          const p = profileRes.value.data;
          setName(p.name || user?.name || '');
          setBio(p.bio || '');
          setGithubUsername(p.githubUsername || '');
          setTargetRole(p.targetRole || 'Software Engineer');
          setLocation(p.location || '');
          setSkills(p.skills || []);
          if (p.preferences) {
            setWorkType(p.preferences.preferredWorkType || 'Remote');
            setEmailAlerts(p.preferences.emailAlerts ?? true);
          }
        } else {
          setName(user?.name || '');
        }

        setTelemetry({
          analysesCount: ghRes.status === 'fulfilled' ? ghRes.value.data?.length || 0 : 0,
          papersCount: paperRes.status === 'fulfilled' ? paperRes.value.data?.length || 0 : 0,
          bookmarksCount: bookmarksRes.status === 'fulfilled' ? bookmarksRes.value.data?.length || 0 : 0,
          ossSearches: ossRes.status === 'fulfilled' ? ossRes.value.data?.length || 0 : 0
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkill).trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.put('/auth/profile', {
        name,
        bio,
        githubUsername,
        targetRole,
        location,
        skills,
        preferences: {
          preferredWorkType: workType,
          emailAlerts
        }
      });

      if (updateUser) {
        updateUser(res.data);
      }

      setSuccessMsg('Developer Identity synchronized successfully.');
      toast.success('Profile updated');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile identity.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/auth/password', {
        currentPassword,
        newPassword
      });

      setPasswordSuccess('Credentials updated successfully.');
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password. Verify current password.';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Navbar />

      <div className="page-container" style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', paddingBottom: '4rem' }}>
        <IntelligenceHeader
          category="PROFILE // DEVELOPER IDENTITY"
          title="Developer Identity & Signal Configuration"
          subtitle="Manage your engineering identity, target technical stacks, and platform credentials."
          status="live"
          dataSource="InnovateX Identity Store"
          actions={
            <div style={{ display: 'flex', gap: '0.25rem', background: '#121218', border: '1px solid #1f1f2c', padding: '0.2rem', borderRadius: '4px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('identity')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: activeTab === 'identity' ? 700 : 500,
                  background: activeTab === 'identity' ? '#1c1c28' : 'transparent',
                  color: activeTab === 'identity' ? '#38bdf8' : '#71717a',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                DEVELOPER IDENTITY
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: activeTab === 'settings' ? 700 : 500,
                  background: activeTab === 'settings' ? '#1c1c28' : 'transparent',
                  color: activeTab === 'settings' ? '#38bdf8' : '#71717a',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                CONFIGURATION & SETTINGS
              </button>
            </div>
          }
        />

        {/* Success / Error alerts */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.15rem',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.15rem',
            borderRadius: '4px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: DEVELOPER IDENTITY */}
        {activeTab === 'identity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Developer Signal Overview Across 6 Layers */}
            <section>
              <SectionHeader
                index="01"
                title="DEVELOPER SIGNAL ACROSS 6 INTELLIGENCE LAYERS"
                badge="REAL TELEMETRY"
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <Metric label="GITHUB AUDITS" value={telemetry.analysesCount} sub={githubUsername ? `@${githubUsername}` : 'Pending'} accent="#c084fc" />
                <Metric label="TARGET STACK" value={skills.length} sub="Ecosystem dependencies" accent="#38bdf8" />
                <Metric label="PAPERS SYNTHESIZED" value={telemetry.papersCount} sub="Research intuition" accent="#10b981" />
                <Metric label="TRACKED ROLES" value={telemetry.bookmarksCount} sub="ATS pipeline" accent="#f59e0b" />
                <Metric label="CONTRIBUTION BLUEPRINTS" value={telemetry.ossSearches} sub="Open source" accent="#34d399" />
              </div>
            </section>

            {/* Core Identity & Career Direction Form */}
            <section>
              <SectionHeader
                index="02"
                title="IDENTITY & CAREER DIRECTION"
                badge="PRIMARY PROFILE"
              />

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Left Column: Personal & GitHub Info */}
                  <div style={{ background: '#0d0d12', border: '1px solid #1a1a24', borderRadius: '4px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        FULL NAME
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Chen"
                        required
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        EMAIL ADDRESS (IMMUTABLE)
                      </label>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 0.85rem',
                        background: '#121218',
                        border: '1px solid #1a1a24',
                        borderRadius: '4px',
                        color: '#71717a',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        <Mail size={14} />
                        <span>{user?.email}</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        GITHUB USERNAME
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value)}
                          placeholder="e.g. torvalds"
                          style={{ width: '100%', paddingLeft: '2.4rem', fontFamily: 'var(--font-mono)' }}
                        />
                        <Github size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.3rem', display: 'block' }}>
                        Enables automated repository AST scanning and code organization audits.
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        BIO & RESEARCH INTERESTS
                      </label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Brief summary of your technical focus, systems background, or research interests..."
                        style={{ width: '100%', resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Career Alignment */}
                  <div style={{ background: '#0d0d12', border: '1px solid #1a1a24', borderRadius: '4px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        TARGET ENGINEERING ROLE
                      </label>
                      <input
                        type="text"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Distributed Systems Engineer"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        PREFERRED WORK TYPE
                      </label>
                      <select
                        value={workType}
                        onChange={(e) => setWorkType(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        GEOGRAPHIC BASE / TIMEZONE
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. San Francisco, CA or UTC-5"
                          style={{ width: '100%', paddingLeft: '2.4rem' }}
                        />
                        <MapPin size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Technical Stack & Target Stack */}
                <div style={{ background: '#0d0d12', border: '1px solid #1a1a24', borderRadius: '4px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        Technical Stack & Competencies
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: '0.2rem 0 0 0' }}>
                        Used by the Market Forecaster to cross-reference demand, and the Job Matcher for ATS gap analysis.
                      </p>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      {skills.length} TECHNOLOGIES CONFIGURED
                    </span>
                  </div>

                  {/* Add Skill Input Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Add technology (e.g. PyTorch, Rust, Kubernetes)..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkill()}
                      className="btn-secondary"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Active Skill Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', minHeight: '38px', padding: '0.75rem', background: '#111116', border: '1px solid #1a1a24', borderRadius: '4px' }}>
                    {skills.length === 0 ? (
                      <span style={{ fontSize: '0.78rem', color: '#71717a' }}>No technologies added yet. Select from common suggestions below.</span>
                    ) : (
                      skills.map((sk) => (
                        <span
                          key={sk}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '3px',
                            background: '#161622',
                            border: '1px solid #28283c',
                            color: '#38bdf8',
                            fontSize: '0.78rem',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          <span>{sk}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(sk)}
                            style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0, display: 'flex' }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Common Presets */}
                  <div>
                    <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#71717a', display: 'block', marginBottom: '0.4rem' }}>
                      COMMON RECOMMENDATIONS:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {COMMON_SKILLS.filter(s => !skills.includes(s)).map((sk) => (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => handleAddSkill(sk)}
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '3px',
                            background: '#121218',
                            border: '1px solid #1e1e28',
                            color: '#a1a1aa',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e28')}
                        >
                          + {sk}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                    style={{ fontSize: '0.88rem', padding: '0.65rem 1.4rem' }}
                  >
                    <Save size={15} />
                    <span>{saving ? 'Synchronizing Identity...' : 'Save Developer Identity'}</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* TAB 2: PLATFORM CONFIGURATION & SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section>
              <SectionHeader
                index="01"
                title="SECURITY CREDENTIALS & ACCESS"
                badge="AUTHENTICATION"
              />

              <div style={{ background: '#0d0d12', border: '1px solid #1a1a24', borderRadius: '4px', padding: '1.5rem', maxWidth: '640px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Change Account Password
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '1.25rem' }}>
                  Ensure your account uses a secure password of at least 6 characters.
                </p>

                {passwordSuccess && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      CURRENT PASSWORD
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter existing password"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        CONFIRM NEW PASSWORD
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword || !currentPassword || !newPassword}
                    className="btn-secondary"
                    style={{ alignSelf: 'flex-start', marginTop: '0.5rem', fontSize: '0.82rem' }}
                  >
                    <Lock size={13} />
                    <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </form>
              </div>
            </section>

            {/* Email Preferences */}
            <section>
              <SectionHeader
                index="02"
                title="NOTIFICATION & TELEMETRY PREFERENCES"
                badge="PREFERENCES"
              />

              <div style={{ background: '#0d0d12', border: '1px solid #1a1a24', borderRadius: '4px', padding: '1.5rem', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>Email Telemetry Digests</div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Receive weekly digests on tech market shifts and competitive radar rounds.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </div>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
