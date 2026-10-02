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

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Toast Render Portal */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
          maxWidth: '420px',
          width: 'calc(100% - 48px)'
        }}
      >
        {toasts.map((t) => {
          let icon = <Info size={18} style={{ color: '#38bdf8' }} />;
          let border = 'rgba(56, 189, 248, 0.3)';
          let bg = 'rgba(15, 23, 42, 0.95)';
          let shadow = '0 8px 32px rgba(6, 182, 212, 0.15)';

          if (t.type === 'success') {
            icon = <CheckCircle2 size={18} style={{ color: '#4edea3' }} />;
            border = 'rgba(78, 222, 163, 0.35)';
            shadow = '0 8px 32px rgba(78, 222, 163, 0.2)';
          } else if (t.type === 'error') {
            icon = <AlertCircle size={18} style={{ color: '#ffb4ab' }} />;
            border = 'rgba(255, 180, 171, 0.35)';
            shadow = '0 8px 32px rgba(239, 68, 68, 0.2)';
          } else if (t.type === 'warning') {
            icon = <AlertCircle size={18} style={{ color: '#fcd34d' }} />;
            border = 'rgba(245, 158, 11, 0.35)';
            shadow = '0 8px 32px rgba(245, 158, 11, 0.2)';
          }

          return (
            <div
              key={t.id}
              className="toast-item"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: bg,
                backdropFilter: 'blur(16px)',
                border: `1px solid ${border}`,
                boxShadow: shadow,
                color: '#e4e1eb',
                fontSize: '0.88rem',
                animation: 'toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                {icon}
                <span style={{ wordBreak: 'break-word', fontWeight: 500 }}>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
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
