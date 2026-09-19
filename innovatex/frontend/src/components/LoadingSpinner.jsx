import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ messages = ['Processing with Llama 3.3 70B (Groq)...', 'Analyzing real-time signals...'] }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length <= 1) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      gap: '1.25rem'
    }}>
      <div style={{ position: 'relative' }}>
        <Loader2 size={44} className="live-pulse" style={{ color: 'var(--accent-cyan)' }} />
      </div>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
        transition: 'all 0.3s ease'
      }}>
        {messages[msgIndex] || 'Loading...'}
      </p>
    </div>
  );
};

export default LoadingSpinner;
