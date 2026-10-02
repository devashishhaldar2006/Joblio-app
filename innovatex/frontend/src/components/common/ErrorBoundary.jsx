import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('InnovateX Caught Runtime Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '640px',
            width: '100%',
            background: '#0d0d12',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '6px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e'
              }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <span style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#f43f5e',
                  letterSpacing: '0.08em',
                  fontWeight: 600
                }}>
                  RUNTIME TELEMETRY EXCEPTION
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ededed', margin: 0 }}>
                  {this.props.moduleName ? `${this.props.moduleName} Interrupted` : 'Module Render Failed'}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#a1a1aa', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              An unexpected condition interrupted this intelligence view. Backend services and application state remain intact.
            </p>

            <div style={{
              background: '#09090d',
              border: '1px solid #1a1a24',
              borderRadius: '4px',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: '#fda4af',
              overflowX: 'auto',
              maxHeight: '120px'
            }}>
              {this.state.error?.toString() || 'Unknown error occurred'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RotateCcw size={14} />
                <span>Recover & Retry Module</span>
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = '/dashboard'; }}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Home size={14} />
                <span>Return to Overview</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
