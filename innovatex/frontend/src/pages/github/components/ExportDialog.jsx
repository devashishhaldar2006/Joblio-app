import React, { useState } from 'react';
import { X, Download, FileText, Code, Table, Printer, ShieldCheck } from 'lucide-react';
import { exportGithubReportByType } from '../../../utils/exportUtils';
import { useToast } from '../../../context/ToastContext';

const REPORT_TYPES = [
  {
    id: 'full_audit',
    label: 'Full GitHub Audit',
    desc: 'Complete 8-dimension score breakdown, repository quality table, Developer DNA, and recommendations.'
  },
  {
    id: 'executive_summary',
    label: 'Executive Summary',
    desc: 'Concise overview of profile health, top featured project candidates, and high-priority actions.'
  },
  {
    id: 'repository_report',
    label: 'Repository Intelligence Report',
    desc: 'Detailed repository-by-repository health, documentation, lifecycle state, and engineering signals.'
  },
  {
    id: 'developer_intelligence',
    label: 'Developer Intelligence Report',
    desc: 'Technical breadth, language distribution, ecosystem footprint, and Developer DNA evidence.'
  },
  {
    id: 'optimization_plan',
    label: 'Optimization Plan',
    desc: 'Prioritized action checklist with modelled score projections and verification criteria.'
  }
];

const FORMATS = [
  { id: 'pdf', label: 'PDF Dossier', icon: Printer, desc: 'Print-ready A4 report' },
  { id: 'md', label: 'Markdown (.md)', icon: FileText, desc: 'GitHub-flavored Markdown' },
  { id: 'json', label: 'JSON (.json)', icon: Code, desc: 'Structured machine telemetry' },
  { id: 'csv', label: 'CSV (.csv)', icon: Table, desc: 'Spreadsheet table export' }
];

const ExportDialog = ({ isOpen, onClose, report }) => {
  const toast = useToast();
  const [selectedReportType, setSelectedReportType] = useState('full_audit');
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  if (!isOpen || !report) return null;

  const handleExport = () => {
    exportGithubReportByType(report, selectedReportType, selectedFormat);
    toast.success(`Generated ${selectedReportType.replace(/_/g, ' ')} (${selectedFormat.toUpperCase()})`);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export GitHub Intelligence Report"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: '#0b0b0f',
          border: '1px solid #242434',
          borderRadius: '6px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.92)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.35rem',
            borderBottom: '1px solid #1a1a24',
            background: '#09090c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700 }}>
              REPORT GENERATION // @{report.username}
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f4f4f6', margin: '2px 0 0 0' }}>
              Export Developer Intelligence Report
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#14141c',
              border: '1px solid #232332',
              borderRadius: '4px',
              padding: '0.35rem',
              color: '#a1a1aa',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Report Type Selection */}
          <div>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#71717a', marginBottom: '0.5rem' }}>
              1. SELECT REPORT SCOPE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {REPORT_TYPES.map((rt) => {
                const active = selectedReportType === rt.id;
                return (
                  <div
                    key={rt.id}
                    onClick={() => setSelectedReportType(rt.id)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '4px',
                      background: active ? '#13131d' : '#0e0e13',
                      border: active ? '1px solid #38bdf8' : '1px solid #1b1b26',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: active ? '#f4f4f6' : '#d4d4d8' }}>
                        {rt.label}
                      </span>
                      {active && (
                        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                          SELECTED
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.73rem', color: '#71717a' }}>{rt.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#71717a', marginBottom: '0.5rem' }}>
              2. SELECT FORMAT
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {FORMATS.map((fmt) => {
                const Icon = fmt.icon;
                const active = selectedFormat === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '4px',
                      background: active ? '#13131d' : '#0e0e13',
                      border: active ? '1px solid #38bdf8' : '1px solid #1b1b26',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem'
                    }}
                  >
                    <Icon size={15} style={{ color: active ? '#38bdf8' : '#71717a', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f4f4f6' }}>{fmt.label}</div>
                      <div style={{ fontSize: '0.68rem', color: '#71717a' }}>{fmt.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Provenance Metadata */}
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '4px',
              background: '#09090c',
              border: '1px solid #181822',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: '#71717a'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={13} color="#10b981" />
              <span>Methodology {report.methodologyVersion || 'v2.1'}</span>
            </span>
            <span>Snapshot: {new Date(report.analyzed_at || Date.now()).toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.35rem',
            borderTop: '1px solid #181822',
            background: '#09090c',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem'
          }}
        >
          <button type="button" onClick={onClose} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}>
            Cancel
          </button>
          <button type="button" onClick={handleExport} className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.45rem 1rem' }}>
            <Download size={13} />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
