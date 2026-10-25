import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration)
  };

  const getToastStyle = (type) => {
    const base = {
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      padding: '10px 14px',
      borderRadius: '8px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-lg)',
      color: 'var(--text-primary)',
      fontSize: '0.8125rem',
      animation: 'toastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    };
    return base;
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />;
      case 'warning':
        return <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />;
      default:
        return <Info size={16} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
          maxWidth: '380px',
          width: 'calc(100% - 40px)'
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={getToastStyle(t.type)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              {getIcon(t.type)}
              <span style={{ wordBreak: 'break-word', fontWeight: 500 }}>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-quaternary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-quaternary)')}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
