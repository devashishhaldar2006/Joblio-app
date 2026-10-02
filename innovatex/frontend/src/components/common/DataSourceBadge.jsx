import React from 'react';
import { Database } from 'lucide-react';

/**
 * DataSourceBadge: Precision data provenance pill
 */
const DataSourceBadge = ({ source = 'GitHub REST API' }) => {
  return (
    <span
      style={{
        fontSize: '0.65rem',
        fontFamily: 'var(--font-mono)',
        padding: '2px 6px',
        borderRadius: '3px',
        background: '#141419',
        border: '1px solid #23232f',
        color: '#a1a1aa',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem'
      }}
    >
      <Database size={10} style={{ color: '#38bdf8' }} />
      <span>{source}</span>
    </span>
  );
};

export default DataSourceBadge;
