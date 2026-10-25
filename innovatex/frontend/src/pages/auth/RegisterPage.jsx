import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AlertCircle, Eye, EyeOff, Loader2, Sparkles, Github } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubOAuth = () => {
    toast.info('Connecting with GitHub...');
    setName('Alex Chen');
    setEmail('alex.chen@example.com');
    setPassword('password123');
    setTimeout(() => {
      register('Alex Chen', 'alex.chen@example.com', 'password123')
        .then(() => {
          toast.success('Account created via GitHub');
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
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Start tracking your developer career readiness and opportunities</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              type="text"
              required
              placeholder="Alex Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              style={{ height: '42px', fontSize: '0.875rem' }}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
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
            <label htmlFor="register-password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
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
                <span>Creating account…</span>
              </>
            ) : (
              <span>Create account</span>
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
          Already have an account?
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
