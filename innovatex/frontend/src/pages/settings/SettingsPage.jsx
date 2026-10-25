import React, { useState } from 'react';
import {
  User,
  Link2,
  Sliders,
  Key,
  Check,
  AlertTriangle,
  Github,
  Code2,
  Terminal,
  Globe,
  Bell,
  Moon,
  Sun,
  Shield,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SettingsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('account');

  // Account form state
  const [name, setName] = useState(user?.name || 'Alex Chen');
  const [githubUser, setGithubUser] = useState(user?.githubUsername || 'alexchendev');
  const [email, setEmail] = useState(user?.email || 'alex.chen@example.com');
  const [savingAccount, setSavingAccount] = useState(false);

  // Connected accounts state
  const [connected, setConnected] = useState({
    github: true,
    leetcode: true,
    codeforces: false,
    huggingface: false
  });
  const [leetcodeHandle, setLeetcodeHandle] = useState('alexchen_coder');
  const [codeforcesHandle, setCodeforcesHandle] = useState('');

  // Preferences state
  const [notifications, setNotifications] = useState({
    contestReminders: true,
    weeklyDigest: true,
    newMatchingIssues: false
  });

  // API keys state
  const [apiKey, setApiKey] = useState('ix_live_8f93b91a27e04c4b8b6e22c974');
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSaveAccount = (e) => {
    e.preventDefault();
    setSavingAccount(true);
    setTimeout(() => {
      setSavingAccount(false);
      toast.success('Account settings saved successfully');
    }, 600);
  };

  const handleToggleConnection = (platform) => {
    setConnected((prev) => {
      const next = { ...prev, [platform]: !prev[platform] };
      toast.success(next[platform] ? `Connected ${platform}` : `Disconnected ${platform}`);
      return next;
    });
  };

  const handleCopyApiKey = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="page-container fade-in">
      {/* Top Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '0.35rem' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage your account, preferences, and connected integrations
        </p>
      </div>

      {/* Subnav Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.75rem',
        marginBottom: '2rem',
        overflowX: 'auto'
      }}>
        {[
          { id: 'account', label: 'Account', icon: User },
          { id: 'connected', label: 'Connected accounts', icon: Link2 },
          { id: 'preferences', label: 'Preferences', icon: Sliders },
          { id: 'keys', label: 'API keys', icon: Key }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-full)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)'
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Account */}
      {activeTab === 'account' && (
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Account Details Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Account
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Update your personal details and public profile identification.
            </p>

            <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  GitHub username
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    @
                  </span>
                  <input
                    type="text"
                    value={githubUser}
                    onChange={(e) => setGithubUser(e.target.value)}
                    style={{ width: '100%', height: '40px', paddingLeft: '2rem', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '0.875rem' }}
                />
              </div>

              <div style={{ paddingTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem', fontWeight: 500 }}
                >
                  {savingAccount ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Delete Account Danger Card */}
          <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--error-border)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--error-text)', marginBottom: '0.35rem' }}>
              Delete account
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Permanently delete your account and all associated data, including repository audit histories, saved ATS evaluations, and bookmarks. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be reversed.')) {
                  toast.error('Account deletion requested');
                }
              }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--error-border)',
                color: 'var(--error-text)',
                padding: '0.55rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Delete account
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Connected accounts */}
      {activeTab === 'connected' && (
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Connected integrations
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Sync your developer profiles to aggregate contest statistics and code analysis.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* GitHub */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Github size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>GitHub</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {connected.github ? `Connected as @${githubUser}` : 'Not connected'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleConnection('github')}
                  className={connected.github ? 'btn-secondary' : 'btn-primary'}
                  style={{ padding: '0.45rem 0.875rem', fontSize: '0.8125rem' }}
                >
                  {connected.github ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              {/* LeetCode */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Code2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>LeetCode</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {connected.leetcode ? `Connected as @${leetcodeHandle}` : 'Not connected'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleConnection('leetcode')}
                  className={connected.leetcode ? 'btn-secondary' : 'btn-primary'}
                  style={{ padding: '0.45rem 0.875rem', fontSize: '0.8125rem' }}
                >
                  {connected.leetcode ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              {/* Codeforces */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Terminal size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Codeforces</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {connected.codeforces ? 'Connected' : 'Sync rating and active contests'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleConnection('codeforces')}
                  className={connected.codeforces ? 'btn-secondary' : 'btn-primary'}
                  style={{ padding: '0.45rem 0.875rem', fontSize: '0.8125rem' }}
                >
                  {connected.codeforces ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Preferences */}
      {activeTab === 'preferences' && (
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Notifications & Alerts
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Configure automated digest emails and calendar reminders.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Contest reminders
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Notify 1 hour before scheduled LeetCode & Codeforces contests
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.contestReminders}
                  onChange={(e) => setNotifications({ ...notifications, contestReminders: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Weekly readiness check-in
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Sunday morning summary of portfolio strength and open source matches
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.weeklyDigest}
                  onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    Instant good first issue alerts
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Email me when high-fit issues in my stack open on GitHub
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.newMatchingIssues}
                  onChange={(e) => setNotifications({ ...notifications, newMatchingIssues: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: API keys */}
      {activeTab === 'keys' && (
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Personal API key
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Use this key to authenticate with the InnovateX CLI, Raycast extension, or custom automated scripts.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                Active Key
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="password"
                  value={apiKey}
                  readOnly
                  style={{ flex: 1, height: '40px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', backgroundColor: 'var(--bg-subtle)' }}
                />
                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="btn-secondary"
                  style={{ padding: '0 1rem', height: '40px', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}
                >
                  {copiedKey ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setApiKey('ix_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
                  toast.success('Generated new API key');
                }}
                className="btn-secondary"
                style={{ fontSize: '0.8125rem' }}
              >
                Regenerate key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
