import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ messages = ['Processing request...'] }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length <= 1) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        gap: '1rem'
      }}
    >
      <Loader2
        size={24}
        style={{
          color: '#ffffff',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.84rem',
          fontWeight: 400,
          fontFamily: 'var(--font-mono)'
        }}
      >
        {messages[msgIndex] || 'Loading...'}
      </p>
    </div>
  );
};

export default LoadingSpinner;
