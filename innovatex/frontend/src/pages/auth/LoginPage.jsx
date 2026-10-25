import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AlertCircle, Eye, EyeOff, Loader2, Sparkles, Github } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubOAuth = () => {
    toast.info('Connecting with GitHub...');
    // Demo auto-fill or mock oauth flow
    setEmail('alex.chen@example.com');
    setPassword('password123');
    setTimeout(() => {
      login('alex.chen@example.com', 'password123')
        .then(() => {
          toast.success('Signed in via GitHub');
          navigate('/dashboard');
        })
        .catch(() => {
          navigate('/dashboard');
        });
    }, 500);
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <Sparkles size={20} />
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to track your career readiness and opportunities</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={{ height: '42px', fontSize: '0.875rem' }}
            />
          </div>

          <div className="auth-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="login-password">Password</label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('Password reset instructions sent to your email.');
                }}
                style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}
              >
                Forgot password?
              </a>
            </div>
            <div className="auth-password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ height: '42px', fontSize: '0.875rem' }}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={loading}
            style={{ height: '42px' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>Or continue with</span>
        </div>

        {/* Social / GitHub Button */}
        <button
          type="button"
          onClick={handleGitHubOAuth}
          className="auth-social-btn"
        >
          <Github size={16} />
          <span>GitHub</span>
        </button>

        {/* Footer */}
        <div className="auth-footer">
          Don't have an account?
          <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
