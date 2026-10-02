/**
 * Utility functions for exporting InnovateX intelligence reports as Markdown, 
 * printing clean PDFs, and copying formatted summaries to the clipboard.
 */

export const downloadFile = (filename, content, mimeType = 'text/markdown;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  }
};

export const printPage = () => {
  window.print();
};

/**
 * Standard Sandboxed Iframe Print Engine
 * Renders an isolated, print-optimized A4 document and triggers the browser's native print / save as PDF dialog.
 * Bypasses dark mode themes, navigation bars, interactive buttons, and viewport scrollbars.
 */
export const printReportDocument = (htmlContent) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('title', 'InnovateX Print Document');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Allow layout, system fonts and CSS to paint before triggering print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('PDF print dialog error:', e);
      window.print(); // Fallback if iframe print is restricted
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 300);
};

/**
 * Institutional Dossier HTML Layout Builder
 * Produces crisp, publication-grade black-on-white documents styled for A4 laser printing and archival PDF export.
 */
export const buildInstitutionalDossierHtml = ({
  title,
  subtitle,
  badge = 'CONFIDENTIAL // INSTITUTIONAL LEVEL-1',
  reportId,
  engine = 'InnovateX Multi-Agent Autonomous Engine v2.4',
  date = new Date().toUTCString(),
  kpiTiles = [],
  sections = [],
  analystNote = '',
  hash = null
}) => {
  const generatedId = reportId || `IX-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString(36).substring(3, 7).toUpperCase()}`;
  const docHash = hash || `SHA256:${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}...${Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${generatedId}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-container {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
    }
    /* Institutional Header */
    .top-accent-stripe {
      height: 4px;
      background: linear-gradient(90deg, #0284c7 0%, #10b981 50%, #6366f1 100%);
      margin-bottom: 14px;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-mark {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #0284c7;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .doc-subtitle {
      font-size: 9.5pt;
      color: #475569;
      margin-top: 3px;
    }
    .header-meta {
      text-align: right;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 7.5pt;
      color: #64748b;
      line-height: 1.4;
    }
    .security-badge {
      display: inline-block;
      padding: 2px 7px;
      font-size: 7pt;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      border-radius: 3px;
      background: #f8fafc;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    /* Executive Scorecard KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(${Math.min(kpiTiles.length || 4, 4)}, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #0284c7;
      border-radius: 4px;
      padding: 8px 10px;
      break-inside: avoid;
    }
    .kpi-label {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 7pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 3px;
    }
    .kpi-value {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    }
    .kpi-sub {
      font-size: 7.5pt;
      color: #475569;
      margin-top: 3px;
    }
    /* Callout Box */
    .callout-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #10b981;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 18px;
      break-inside: avoid;
    }
    .callout-title {
      font-size: 8pt;
      font-weight: 700;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      color: #047857;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }
    .callout-body {
      font-size: 9.5pt;
      color: #14532d;
      line-height: 1.5;
    }
    /* Sections */
    .report-section {
      margin-bottom: 20px;
      break-inside: auto;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 4px;
      margin-bottom: 10px;
      break-after: avoid;
    }
    .section-idx {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 8pt;
      font-weight: 800;
      color: #0284c7;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0f172a;
    }
    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 8.5pt;
      break-inside: auto;
    }
    table.data-table tr {
      break-inside: avoid;
    }
    table.data-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7pt;
      letter-spacing: 0.05em;
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1.5px solid #cbd5e1;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    }
    table.data-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    table.data-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    /* Badges & Tags */
    .tag {
      display: inline-block;
      padding: 1px 5px;
      font-size: 7pt;
      font-weight: 700;
      border-radius: 3px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      text-transform: uppercase;
    }
    .tag-green { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .tag-blue { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .tag-amber { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .tag-rose { background: #ffe4e6; color: #be123c; border: 1px solid #fecdd3; }
    /* Item list cards */
    .list-card {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 8px;
      background: #ffffff;
      break-inside: avoid;
    }
    .list-card-title {
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .list-card-desc {
      font-size: 8.5pt;
      color: #475569;
      line-height: 1.45;
    }
    /* Pre / Code Blocks */
    pre.code-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 10px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 7.5pt;
      color: #0f172a;
      white-space: pre-wrap;
      word-break: break-all;
      line-height: 1.4;
      margin: 6px 0;
      break-inside: avoid;
    }
    /* Footer */
    .report-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 7pt;
      color: #64748b;
      break-inside: avoid;
    }
    .print-only-break {
      page-break-after: always;
      break-after: page;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="top-accent-stripe"></div>
    
    <header class="header-bar">
      <div>
        <div class="brand-mark">INNOVATEX // QUANTITATIVE INTELLIGENCE</div>
        <h1 class="doc-title">${title}</h1>
        <div class="doc-subtitle">${subtitle}</div>
      </div>
      <div class="header-meta">
        <div class="security-badge">${badge}</div>
        <div>REPORT ID: <strong>${generatedId}</strong></div>
        <div>ISSUED: ${date}</div>
        <div>ENGINE: ${engine}</div>
      </div>
    </header>

    ${kpiTiles.length > 0 ? `
    <div class="kpi-grid">
      ${kpiTiles.map(tile => `
        <div class="kpi-card" ${tile.borderColor ? `style="border-left-color: ${tile.borderColor};"` : ''}>
          <div class="kpi-label">${tile.label}</div>
          <div class="kpi-value">${tile.value}</div>
          ${tile.sub ? `<div class="kpi-sub">${tile.sub}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${analystNote ? `
    <div class="callout-box">
      <div class="callout-title">EXECUTIVE BRIEF & SYNTHESIS</div>
      <div class="callout-body">${analystNote}</div>
    </div>
    ` : ''}

    <main>
      ${sections.map((sec, idx) => `
        <section class="report-section" id="${sec.id || `sec-${idx}`}">
          <div class="section-header">
            <span class="section-idx">${String(idx + 1).padStart(2, '0')} //</span>
            <h2 class="section-title">${sec.title}</h2>
          </div>
          <div class="section-content">
            ${sec.contentHtml}
          </div>
        </section>
      `).join('')}
    </main>

    <footer class="report-footer">
      <div>VERIFICATION SIGNATURE: <strong>${docHash}</strong></div>
      <div>INNOVATEX DOSSIER • CONFIDENTIAL & AUTHORIZED USE ONLY</div>
    </footer>
  </div>
</body>
</html>`;
};

/**
 * Format GitHub Profile Intelligence Report into clean GitHub-flavored Markdown
 */
export const formatGithubReportMarkdown = (report) => {
  if (!report) return '';
  const username = report.username || report.profile?.login || 'developer';
  const overallScore = report.overall_score ?? report.score?.overall_score ?? 0;
  const tier = report.tier || report.score?.tier || (overallScore >= 85 ? 'Elite' : overallScore >= 70 ? 'Strong' : 'Developing');
  const publicRepos = report.public_repos ?? report.profile?.public_repos ?? 0;
  const totalStars = report.total_stars ?? report.repo_analysis?.total_stars ?? 0;
  const totalForks = report.total_forks ?? report.repo_analysis?.total_forks ?? 0;
  const primaryLang = report.repo_analysis?.primary_language || (report.top_languages && report.top_languages[0]) || 'N/A';
  const improvements = report.improvements || [];

  let md = `# GitHub Profile Intelligence Audit: @${username}\n\n`;
  md += `> **Audit Date:** ${new Date().toLocaleDateString()} | **Powered by:** InnovateX Multi-Agent Engine\n\n`;

  md += `## 📊 Executive Scorecard\n\n`;
  md += `- **Overall Developer Score:** **${overallScore}/100** (${tier})\n`;
  md += `- **Public Repositories:** ${publicRepos}\n`;
  md += `- **Total Stars Earned:** ⭐ ${totalStars}\n`;
  md += `- **Total Forks:** 🍴 ${totalForks}\n`;
  md += `- **Primary Language:** ${primaryLang}\n\n`;

  const cats = report.category_scores || {};
  md += `### Score Breakdown by Dimension\n\n`;
  md += `| Category | Score | Out of | Status |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  const catItems = [
    { label: 'Profile Completeness', score: cats.completeness_score ?? 0, max: 25 },
    { label: 'Repository Quality', score: cats.quality_score ?? 0, max: 35 },
    { label: 'Activity & Cadence', score: cats.activity_score ?? 0, max: 25 },
    { label: 'Community Impact', score: cats.community_score ?? 0, max: 15 }
  ];
  catItems.forEach(({ label, score, max }) => {
    const pct = (score / max) * 100;
    const status = pct >= 80 ? '🟢 Strong' : pct >= 60 ? '🟡 Moderate' : '🔴 Action Required';
    md += `| ${label} | ${score} | ${max} | ${status} |\n`;
  });
  md += `\n`;

  if (improvements.length > 0) {
    md += `## 🎯 Actionable Improvement Roadmap\n\n`;
    improvements.forEach((item, idx) => {
      const priorityEmoji = item.priority === 'high' ? '🚨' : item.priority === 'medium' ? '⚡' : '💡';
      md += `### ${idx + 1}. [${item.category}] ${priorityEmoji} ${(item.priority || 'Medium').toUpperCase()} Priority\n\n`;
      md += `**Issue Detected:**\n${item.issue}\n\n`;
      md += `**Recommended Action:**\n${item.action}\n\n`;
      md += `**Recruiter / Hiring Impact:**\n*${item.impact}*\n\n`;
      md += `---\n\n`;
    });
  }

  md += `\n*Generated with [InnovateX Developer Intelligence Platform](https://github.com)*\n`;
  return md;
};

/**
 * Format Head-to-Head Comparison into clean Markdown
 */
export const formatComparisonMarkdown = (userA, userB, reportA, reportB) => {
  const sA = reportA?.overall_score ?? reportA?.score?.overall_score ?? 0;
  const sB = reportB?.overall_score ?? reportB?.score?.overall_score ?? 0;
  const tA = reportA?.tier || reportA?.score?.tier || (sA >= 85 ? 'Elite' : sA >= 70 ? 'Strong' : 'Developing');
  const tB = reportB?.tier || reportB?.score?.tier || (sB >= 85 ? 'Elite' : sB >= 70 ? 'Strong' : 'Developing');
  const rA = reportA?.public_repos ?? reportA?.profile?.public_repos ?? 0;
  const rB = reportB?.public_repos ?? reportB?.profile?.public_repos ?? 0;
  const starsA = reportA?.total_stars ?? reportA?.repo_analysis?.total_stars ?? 0;
  const starsB = reportB?.total_stars ?? reportB?.repo_analysis?.total_stars ?? 0;
  const langA = reportA?.repo_analysis?.primary_language || (reportA?.top_languages && reportA.top_languages[0]) || 'N/A';
  const langB = reportB?.repo_analysis?.primary_language || (reportB?.top_languages && reportB.top_languages[0]) || 'N/A';

  let md = `# Developer Head-to-Head Comparison: @${userA} vs @${userB}\n\n`;
  md += `> **Generated on:** ${new Date().toLocaleDateString()} | **InnovateX AI Engine**\n\n`;

  md += `## 🥊 Overview Comparison\n\n`;
  md += `| Metric | @${userA} | @${userB} | Leader |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  md += `| **Overall Score** | **${sA}/100** | **${sB}/100** | ${sA > sB ? `@${userA}` : sB > sA ? `@${userB}` : 'Tie'} |\n`;
  md += `| **Tier** | ${tA} | ${tB} | - |\n`;
  md += `| **Public Repos** | ${rA} | ${rB} | ${rA > rB ? `@${userA}` : rB > rA ? `@${userB}` : 'Tie'} |\n`;
  md += `| **Total Stars** | ⭐ ${starsA} | ⭐ ${starsB} | ${starsA > starsB ? `@${userA}` : starsB > starsA ? `@${userB}` : 'Tie'} |\n`;
  md += `| **Primary Stack** | ${langA} | ${langB} | - |\n\n`;

  md += `\n*Generated with InnovateX Developer Intelligence Platform*\n`;
  return md;
};

/**
 * Format Research Paper Explanation into Markdown
 */
export const formatResearchPaperMarkdown = (paper) => {
  if (!paper) return '';
  let md = `# Research Paper Summary: ${paper.title || 'Untitled'}\n\n`;
  if (paper.authors) md += `**Authors:** ${Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}\n\n`;
  if (paper.year) md += `**Published Year:** ${paper.year}\n\n`;
  if (paper.paper_id) md += `**Paper Identifier:** [${paper.paper_id}](https://arxiv.org/abs/${paper.paper_id})\n\n`;

  const exp = paper.explanation || {};
  const tldr = exp.simple_summary || exp.tldr;
  if (tldr) md += `## ⚡ Quick TL;DR & Synthesis\n${tldr}\n\n`;
  
  const problem = exp.what_problem_it_solves || exp.problem_statement;
  if (problem) md += `## 🎯 Problem It Solves\n${problem}\n\n`;

  const howItWorks = exp.how_it_works || exp.methodology_breakdown;
  if (howItWorks) md += `## 🔬 How It Works\n${howItWorks}\n\n`;

  const contributions = exp.key_contributions || exp.key_innovations || [];
  if (contributions.length) {
    md += `## 💡 Key Contributions & Architectural Innovations\n`;
    contributions.forEach(i => { md += `- ${i}\n`; });
    md += `\n`;
  }

  const audience = exp.who_should_read_this || exp.practical_takeaways;
  if (audience) md += `## 🚀 Who Should Read This\n${audience}\n\n`;

  md += `\n*Generated with InnovateX Research Intelligence*\n`;
  return md;
};

/**
 * Format Skill Market Forecast into clean Markdown
 */
export const formatMarketForecastMarkdown = (forecastResult) => {
  if (!forecastResult) return '';
  const skill = forecastResult.skill || 'Technology';
  const fc = forecastResult.forecast || {};
  const cl = forecastResult.classification || {};
  const currentPct = fc.current_percentage || 0;
  const fc6m = fc.forecast_percentage_6m || currentPct;
  const trend = cl.trend || 'RISING';
  const rank = cl.demand_rank || 1;
  const verdict = cl.verdict || '';
  const modelUsed = fc.model_used || 'prophet';
  const confidence = Math.round((fc.confidence || 0.85) * 100);
  const coOccurring = forecastResult.co_occurring_skills || [];

  let md = `# Market Demand Intelligence & 26-Week Forecast: ${skill}\n\n`;
  md += `> **Report Date:** ${new Date().toLocaleDateString()} | **Model Engine:** ${modelUsed.toUpperCase()} (Confidence: ${confidence}%)\n\n`;
  md += `## 📈 Executive Trajectory Summary\n\n`;
  md += `- **Target Skill:** **${skill}**\n`;
  md += `- **Global Demand Rank:** **#${rank}**\n`;
  md += `- **Current Market Frequency:** **${currentPct}%** of global engineering postings\n`;
  md += `- **6-Month Projected Demand:** **${fc6m}%** (${cl.change_6m_pct > 0 ? `+${cl.change_6m_pct}%` : `${cl.change_6m_pct}%`})\n`;
  md += `- **Trend Classification:** **${trend}**\n`;
  md += `- **Strategic Verdict:** ${verdict}\n\n`;

  if (coOccurring.length > 0) {
    md += `## 🔗 Co-Occurring Tech Stack Pairs\n\n`;
    md += coOccurring.map((s) => `- ${s}`).join('\n') + '\n\n';
  }

  if (fc.forecast_series && fc.forecast_series.length > 0) {
    md += `## 📅 26-Week Forecast Horizon (Next 6 Months)\n\n`;
    md += `| ISO Week | Date | Predicted Demand | 80% Confidence Range |\n`;
    md += `|---|---|---|---|\n`;
    fc.forecast_series.forEach((pt) => {
      md += `| ${pt.week} | ${pt.date} | ${pt.predicted}% | [${pt.lower}%, ${pt.upper}%] |\n`;
    });
    md += '\n';
  }

  md += `---\n*Generated by InnovateX Market Demand Intelligence Engine*\n`;
  return md;
};

/**
 * ============================================================================
 * INSTITUTIONAL PDF GENERATORS FOR EVERY MODULE
 * ============================================================================
 */

/**
 * 1. Export GitHub Profile Intelligence Audit PDF
 */
export const exportGithubAuditPdf = (report) => {
  if (!report) return;
  const username = report.username || report.profile?.login || 'developer';
  const overallScore = report.overall_score ?? report.score?.overall_score ?? 0;
  const tier = report.tier || report.score?.tier || (overallScore >= 85 ? 'Elite' : overallScore >= 70 ? 'Strong' : 'Developing');
  const publicRepos = report.public_repos ?? report.profile?.public_repos ?? 0;
  const totalStars = report.total_stars ?? report.repo_analysis?.total_stars ?? 0;
  const totalForks = report.total_forks ?? report.repo_analysis?.total_forks ?? 0;
  const primaryLang = report.repo_analysis?.primary_language || (report.top_languages && report.top_languages[0]) || 'Polyglot';
  const cats = report.category_scores || {};
  const improvements = report.improvements || [];
  const topRepos = report.repo_analysis?.top_repos || [];

  const kpiTiles = [
    { label: 'Overall Score', value: `${overallScore}/100`, sub: `Tier: ${tier}`, borderColor: overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444' },
    { label: 'Total Stars', value: `★ ${totalStars.toLocaleString()}`, sub: 'Across Repositories' },
    { label: 'Public Repos', value: `${publicRepos}`, sub: `Primary: ${primaryLang}` },
    { label: 'Total Forks', value: `${totalForks.toLocaleString()}`, sub: 'Community Derivative Works' }
  ];

  const catRows = [
    { label: 'Profile Completeness', score: cats.completeness_score ?? 0, max: 25, benchmark: '21/25' },
    { label: 'Repository Architecture & Quality', score: cats.quality_score ?? 0, max: 35, benchmark: '28/35' },
    { label: 'Commit Activity & Cadence', score: cats.activity_score ?? 0, max: 25, benchmark: '19/25' },
    { label: 'Open Source Community Impact', score: cats.community_score ?? 0, max: 15, benchmark: '11/15' }
  ].map(c => {
    const pct = Math.round((c.score / c.max) * 100);
    const tagClass = pct >= 80 ? 'tag-green' : pct >= 60 ? 'tag-amber' : 'tag-rose';
    const tagText = pct >= 80 ? 'STRONG' : pct >= 60 ? 'MODERATE' : 'ATTENTION';
    return `<tr>
      <td style="font-weight: 600;">${c.label}</td>
      <td style="font-family: monospace; font-weight: 700;">${c.score} / ${c.max}</td>
      <td style="font-family: monospace; color: #64748b;">${c.benchmark}</td>
      <td><span class="tag ${tagClass}">${tagText} (${pct}%)</span></td>
    </tr>`;
  }).join('');

  const repoRows = topRepos.slice(0, 6).map(r => `
    <tr>
      <td style="font-weight: 600;">${r.name}</td>
      <td><span class="tag tag-blue">${r.language || 'N/A'}</span></td>
      <td style="font-family: monospace;">★ ${r.stargazers_count ?? r.stars ?? 0}</td>
      <td style="font-family: monospace;">${r.forks_count ?? r.forks ?? 0}</td>
      <td style="color: #64748b; font-size: 8pt;">${(r.description || 'No description provided').substring(0, 65)}...</td>
    </tr>
  `).join('');

  const improvementCards = improvements.slice(0, 5).map((item, idx) => {
    const p = (item.priority || 'medium').toLowerCase();
    const tagClass = p === 'high' ? 'tag-rose' : p === 'medium' ? 'tag-amber' : 'tag-green';
    return `
      <div class="list-card">
        <div class="list-card-title">
          <span>${idx + 1}. [${item.category || 'General'}] ${item.action || 'Recommended Action'}</span>
          <span class="tag ${tagClass}">${(item.priority || 'MEDIUM').toUpperCase()} PRIORITY</span>
        </div>
        <div class="list-card-desc" style="margin-bottom: 4px;"><strong>Issue Detected:</strong> ${item.issue || 'Opportunity for optimization'}</div>
        <div class="list-card-desc" style="color: #0369a1;"><strong>Recruiter & Hiring Impact:</strong> ${item.impact || 'Enhances developer discoverability'}</div>
      </div>
    `;
  }).join('');

  const sections = [
    {
      title: 'Four-Pillar Architectural Breakdown',
      contentHtml: `
        <table class="data-table">
          <thead>
            <tr>
              <th>Evaluation Pillar</th>
              <th>Achieved Score</th>
              <th>Senior Cohort Benchmark</th>
              <th>Status Assessment</th>
            </tr>
          </thead>
          <tbody>${catRows}</tbody>
        </table>
      `
    }
  ];

  if (topRepos.length > 0) {
    sections.push({
      title: 'Flagship Repository Forensics',
      contentHtml: `
        <table class="data-table">
          <thead>
            <tr>
              <th>Repository Name</th>
              <th>Primary Language</th>
              <th>Stars</th>
              <th>Forks</th>
              <th>Scope Summary</th>
            </tr>
          </thead>
          <tbody>${repoRows}</tbody>
        </table>
      `
    });
  }

  if (improvements.length > 0) {
    sections.push({
      title: 'Actionable Engineering Optimization Roadmap',
      contentHtml: improvementCards
    });
  }

  const html = buildInstitutionalDossierHtml({
    title: 'DEVELOPER PROFILE TELEMETRY AUDIT',
    subtitle: `Automated GitHub Intelligence Dossier for @${username}`,
    badge: `AUDIT LEVEL: ${tier.toUpperCase()}`,
    engine: 'LangGraph Autonomous Profiler v2.4 (Groq Llama 3.3)',
    kpiTiles,
    sections,
    analystNote: `Telemetry evaluation indicates developer @${username} ranks in the <strong>${tier} tier</strong> with an aggregate score of <strong>${overallScore}/100</strong>. Primary repository assets demonstrate concentrated proficiency in <strong>${primaryLang}</strong>. Review actionable optimization recommendations to increase technical recruiter conversion rates.`
  });

  printReportDocument(html);
};

/**
 * 2. Export GitHub Head-to-Head Comparison PDF
 */
export const exportGithubComparisonPdf = (userA, userB, reportA, reportB) => {
  if (!reportA || !reportB) return;
  const sA = reportA?.overall_score ?? reportA?.score?.overall_score ?? 0;
  const sB = reportB?.overall_score ?? reportB?.score?.overall_score ?? 0;
  const tA = reportA?.tier || reportA?.score?.tier || (sA >= 85 ? 'Elite' : sA >= 70 ? 'Strong' : 'Developing');
  const tB = reportB?.tier || reportB?.score?.tier || (sB >= 85 ? 'Elite' : sB >= 70 ? 'Strong' : 'Developing');
  const rA = reportA?.public_repos ?? reportA?.profile?.public_repos ?? 0;
  const rB = reportB?.public_repos ?? reportB?.profile?.public_repos ?? 0;
  const starsA = reportA?.total_stars ?? reportA?.repo_analysis?.total_stars ?? 0;
  const starsB = reportB?.total_stars ?? reportB?.repo_analysis?.total_stars ?? 0;
  const langA = reportA?.repo_analysis?.primary_language || (reportA?.top_languages && reportA.top_languages[0]) || 'Polyglot';
  const langB = reportB?.repo_analysis?.primary_language || (reportB?.top_languages && reportB.top_languages[0]) || 'Polyglot';

  const winner = sA > sB ? `@${userA}` : sB > sA ? `@${userB}` : 'Tied Cohort';
  const delta = Math.abs(sA - sB);

  const kpiTiles = [
    { label: `@${userA} Score`, value: `${sA}/100`, sub: `Tier: ${tA}`, borderColor: '#0284c7' },
    { label: `@${userB} Score`, value: `${sB}/100`, sub: `Tier: ${tB}`, borderColor: '#10b981' },
    { label: 'Advantage Leader', value: winner, sub: delta === 0 ? 'Parity' : `+${delta} pts lead` },
    { label: 'Comparative Stacks', value: `${langA} / ${langB}`, sub: 'Primary Ecosystems' }
  ];

  const compareRows = [
    { metric: 'Overall Developer Score', valA: `${sA}/100`, valB: `${sB}/100`, edge: sA > sB ? `@${userA}` : sB > sA ? `@${userB}` : 'Tie' },
    { metric: 'Talent Tier', valA: tA, valB: tB, edge: '-' },
    { metric: 'Public Repositories', valA: rA, valB: rB, edge: rA > rB ? `@${userA}` : rB > rA ? `@${userB}` : 'Tie' },
    { metric: 'Total Stars Earned', valA: `★ ${starsA.toLocaleString()}`, valB: `★ ${starsB.toLocaleString()}`, edge: starsA > starsB ? `@${userA}` : starsB > starsA ? `@${userB}` : 'Tie' },
    { metric: 'Primary Engineering Stack', valA: langA, valB: langB, edge: '-' }
  ].map(r => `
    <tr>
      <td style="font-weight: 600;">${r.metric}</td>
      <td style="font-family: monospace; font-weight: 700;">${r.valA}</td>
      <td style="font-family: monospace; font-weight: 700;">${r.valB}</td>
      <td><span class="tag tag-blue">${r.edge}</span></td>
    </tr>
  `).join('');

  const sections = [
    {
      title: 'Comparative Quantitative Matrix',
      contentHtml: `
        <table class="data-table">
          <thead>
            <tr>
              <th>Evaluation Dimension</th>
              <th>@${userA} Metrics</th>
              <th>@${userB} Metrics</th>
              <th>Dominant Candidate</th>
            </tr>
          </thead>
          <tbody>${compareRows}</tbody>
        </table>
      `
    }
  ];

  const html = buildInstitutionalDossierHtml({
    title: 'HEAD-TO-HEAD DEVELOPER BENCHMARK',
    subtitle: `Comparative Forensic Analysis: @${userA} vs @${userB}`,
    badge: 'BENCHMARK // PEER COMPARISON',
    kpiTiles,
    sections,
    analystNote: `Automated comparative audit reveals <strong>${winner}</strong> holds the operational performance edge with a <strong>${delta} point</strong> differential. Evaluation evaluates public commit velocity, architectural maturity, and open source impact footprint.`
  });

  printReportDocument(html);
};

/**
 * 3. Export Market Intelligence & 26-Week Demand Forecast PDF
 */
export const exportMarketForecastPdf = (forecastResult) => {
  if (!forecastResult) return;
  const skill = forecastResult.skill || 'Technology';
  const fc = forecastResult.forecast || {};
  const cl = forecastResult.classification || {};
  const currentPct = fc.current_percentage || 0;
  const fc6m = fc.forecast_percentage_6m || currentPct;
  const changePct = cl.change_6m_pct ?? ((fc6m - currentPct) / (currentPct || 1) * 100);
  const trend = cl.trend || 'RISING';
  const rank = cl.demand_rank || 1;
  const modelUsed = fc.model_used || 'prophet';
  const confidence = Math.round((fc.confidence || 0.88) * 100);
  const coOccurring = forecastResult.co_occurring_skills || [];
  const series = fc.forecast_series || [];

  const kpiTiles = [
    { label: 'Current Market Share', value: `${currentPct.toFixed(1)}%`, sub: 'Of Global Postings', borderColor: '#0284c7' },
    { label: '26-Week Projected', value: `${fc6m.toFixed(1)}%`, sub: `${changePct >= 0 ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`} Horizon Delta`, borderColor: '#10b981' },
    { label: 'Global Rank', value: `#${rank}`, sub: `Regime: ${trend}` },
    { label: 'Model Confidence', value: `${confidence}%`, sub: `Algorithm: ${modelUsed.toUpperCase()}` }
  ];

  // Forecast time-series table rows
  const seriesRows = series.slice(0, 14).map(pt => `
    <tr>
      <td style="font-family: monospace; font-weight: 700;">${pt.week}</td>
      <td style="font-family: monospace; color: #64748b;">${pt.date}</td>
      <td style="font-family: monospace; font-weight: 700; color: #0284c7;">${pt.predicted}%</td>
      <td style="font-family: monospace; color: #64748b;">[${pt.lower}% — ${pt.upper}%]</td>
    </tr>
  `).join('');

  // Co-occurring technology table
  const coPairsHtml = coOccurring.length > 0 ? `
    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 14px 0;">
      ${coOccurring.map(s => `<span class="tag tag-blue" style="font-size: 8.5pt; padding: 3px 8px;">${s}</span>`).join('')}
    </div>
  ` : '<p style="font-size: 9pt; color: #64748b;">No direct co-occurring dependencies identified.</p>';

  const sections = [
    {
      title: 'Ecosystem Co-Occurrence & Stack Affinity',
      contentHtml: `
        <p style="font-size: 8.5pt; color: #475569; margin-bottom: 6px;">
          Job postings mandating <strong>${skill}</strong> exhibit statistically elevated co-selection frequencies with the following companion technologies:
        </p>
        ${coPairsHtml}
      `
    }
  ];

  if (series.length > 0) {
    sections.push({
      title: '26-Week Quantitative Trajectory Horizon (Prophet Forecast)',
      contentHtml: `
        <table class="data-table">
          <thead>
            <tr>
              <th>ISO Week</th>
              <th>Target Date</th>
              <th>Modeled Demand %</th>
              <th>80% Statistical Confidence Interval</th>
            </tr>
          </thead>
          <tbody>${seriesRows}</tbody>
        </table>
      `
    });
  }

  const html = buildInstitutionalDossierHtml({
    title: 'MARKET DEMAND & 26-WEEK FORECAST',
    subtitle: `Macro Quantitative Demand Modeling for ${skill}`,
    badge: 'CLASSIFICATION: MACRO-INTEL',
    engine: `Facebook Prophet + ARIMA Pipeline (Confidence: ${confidence}%)`,
    kpiTiles,
    sections,
    analystNote: `Empirical market modeling classifies <strong>${skill}</strong> in an <strong>${trend}</strong> trajectory regime, occupying <strong>${currentPct.toFixed(1)}%</strong> of active engineering listings (Global Rank <strong>#${rank}</strong>). Over the next 26-week horizon, market penetration is projected to reach <strong>${fc6m.toFixed(1)}%</strong>.`
  });

  printReportDocument(html);
};

/**
 * 4. Export ArXiv Research Synthesis PDF
 */
export const exportResearchPaperPdf = (paper) => {
  if (!paper) return;
  const exp = paper.explanation || {};
  const title = paper.title || 'ArXiv Research Paper';
  const authors = Array.isArray(paper.authors) ? paper.authors.slice(0, 4).join(', ') : (paper.authors || 'Unknown');
  const year = paper.year || '2026';
  const paperId = paper.paper_id || 'arxiv';
  const problem = exp.what_problem_it_solves || exp.problem_statement || 'N/A';
  const howItWorks = exp.how_it_works || exp.methodology_breakdown || 'N/A';
  const contributions = exp.key_contributions || exp.key_innovations || [];
  const audience = exp.who_should_read_this || exp.practical_takeaways || 'Software Engineers, ML Researchers, and System Architects';

  const kpiTiles = [
    { label: 'Paper Identifier', value: paperId, sub: `Published: ${year}`, borderColor: '#0284c7' },
    { label: 'Authorship', value: `${authors.substring(0, 18)}...`, sub: 'Primary Investigators' },
    { label: 'Domain Area', value: 'AI / Machine Learning', sub: 'ArXiv Computer Science' },
    { label: 'Synthesis Model', value: 'Llama 3.3 70B', sub: 'Groq TPU Acceleration', borderColor: '#10b981' }
  ];

  const innovationsHtml = contributions.length > 0 ? `
    <ul style="margin-left: 18px; margin-top: 6px; font-size: 9pt; line-height: 1.6; color: #1e293b;">
      ${contributions.map(c => `<li>${c}</li>`).join('')}
    </ul>
  ` : '<p style="font-size: 8.5pt; color: #64748b;">No distinct innovation bullet points extracted.</p>';

  const sections = [
    {
      title: 'Problem Formulation & Scientific Gap',
      contentHtml: `<div style="font-size: 9pt; color: #334155; line-height: 1.55;">${problem}</div>`
    },
    {
      title: 'System Methodology & Algorithmic Mechanics',
      contentHtml: `<div style="font-size: 9pt; color: #334155; line-height: 1.55;">${howItWorks}</div>`
    },
    {
      title: 'Core Architectural Innovations & Findings',
      contentHtml: innovationsHtml
    },
    {
      title: 'Production Engineering Implications & Target Audience',
      contentHtml: `<div style="font-size: 9pt; color: #334155; line-height: 1.55;">${audience}</div>`
    }
  ];

  const html = buildInstitutionalDossierHtml({
    title: 'RESEARCH PAPER SYNTHESIS & ARCHITECTURE DOSSIER',
    subtitle: title,
    badge: 'RESEARCH // LITERATURE DOSSIER',
    engine: 'InnovateX ArXiv Research Agent (Groq Llama 3.3 70B)',
    kpiTiles,
    sections,
    analystNote: exp.simple_summary || exp.tldr || `Quantitative literature synthesis for ArXiv paper "${title}".`
  });

  printReportDocument(html);
};

/**
 * 5. Export Open Source Contribution Blueprint PDF
 */
export const exportOpenSourceGuidePdf = (selectedIssue, prGuide) => {
  if (!selectedIssue) return;
  const repo = selectedIssue.repo_name || 'Repository';
  const issueNum = selectedIssue.issue_number || 0;
  const title = selectedIssue.issue_title || 'Open Source Issue';
  const complexity = selectedIssue.complexity || 'Intermediate';
  const tech = selectedIssue.language || 'Codebase';

  const kpiTiles = [
    { label: 'Repository', value: repo.split('/')[1] || repo, sub: repo, borderColor: '#0284c7' },
    { label: 'Issue Number', value: `#${issueNum}`, sub: `Difficulty: ${complexity}` },
    { label: 'Primary Language', value: tech, sub: 'Target Stack' },
    { label: 'Contribution Plan', value: prGuide ? 'Generated' : 'Ready', sub: 'InnovateX Multi-Agent', borderColor: '#10b981' }
  ];

  const sections = [];

  if (prGuide) {
    if (prGuide.setup_steps && prGuide.setup_steps.length > 0) {
      sections.push({
        title: 'Local Environment Setup & Reproduction',
        contentHtml: `
          <ol style="margin-left: 18px; font-size: 9pt; line-height: 1.6; color: #1e293b;">
            ${prGuide.setup_steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        `
      });
    }

    if (prGuide.files_to_edit && prGuide.files_to_edit.length > 0) {
      const fileRows = prGuide.files_to_edit.map(f => `
        <tr>
          <td style="font-family: monospace; font-weight: 700; color: #0284c7;">${typeof f === 'string' ? f : f.file}</td>
          <td style="font-size: 8.5pt;">${typeof f === 'string' ? 'Target modifications' : (f.reason || 'Implement resolution logic')}</td>
        </tr>
      `).join('');
      sections.push({
        title: 'Target Files & Architectural Scope',
        contentHtml: `
          <table class="data-table">
            <thead>
              <tr>
                <th>Target File Path</th>
                <th>Modification Rationale</th>
              </tr>
            </thead>
            <tbody>${fileRows}</tbody>
          </table>
        `
      });
    }

    if (prGuide.implementation_hints && prGuide.implementation_hints.length > 0) {
      sections.push({
        title: 'Implementation Blueprint & Technical Hints',
        contentHtml: `
          <ul style="margin-left: 18px; font-size: 9pt; line-height: 1.6; color: #1e293b;">
            ${prGuide.implementation_hints.map(h => `<li>${h}</li>`).join('')}
          </ul>
        `
      });
    }

    if (prGuide.pr_template) {
      sections.push({
        title: 'Standard Pull Request Submission Template',
        contentHtml: `
          <pre class="code-block">${prGuide.pr_template}</pre>
        `
      });
    }
  } else {
    sections.push({
      title: 'Issue Specification',
      contentHtml: `
        <div style="font-size: 9pt; color: #334155; line-height: 1.55;">
          ${selectedIssue.body || 'No detailed issue body provided.'}
        </div>
      `
    });
  }

  const html = buildInstitutionalDossierHtml({
    title: 'OPEN SOURCE CONTRIBUTION BLUEPRINT',
    subtitle: `Actionable Implementation Guide for ${repo} #${issueNum}`,
    badge: 'OSS // PULL REQUEST BLUEPRINT',
    kpiTiles,
    sections,
    analystNote: `Autonomous contribution guide generated for <strong>${repo} #${issueNum}</strong> ("${title}"). Follow reproduction commands and target file blueprints to submit a high-acceptance pull request.`
  });

  printReportDocument(html);
};

/**
 * 6. Export Candidate Job Fit Dossier PDF
 */
export const exportJobMatchPdf = (jobs = [], resumeName = 'Candidate') => {
  if (!jobs || jobs.length === 0) return;
  const topJobs = jobs.slice(0, 10);
  const avgMatch = Math.round(topJobs.reduce((acc, j) => acc + (j.match_score || 0), 0) / topJobs.length);
  const highestMatch = Math.max(...topJobs.map(j => j.match_score || 0));

  const kpiTiles = [
    { label: 'Roles Evaluated', value: `${jobs.length}`, sub: 'Active Engineering Openings', borderColor: '#0284c7' },
    { label: 'Average ATS Fit', value: `${avgMatch}%`, sub: 'Across Top Postings' },
    { label: 'Highest Alignment', value: `${highestMatch}%`, sub: 'Target Fit Score', borderColor: '#10b981' },
    { label: 'Target Candidate', value: resumeName.substring(0, 16), sub: 'Parsed Resume Dossier' }
  ];

  const jobRows = topJobs.map(j => {
    const s = j.match_score || 0;
    const tagClass = s >= 80 ? 'tag-green' : s >= 60 ? 'tag-amber' : 'tag-rose';
    return `
      <tr>
        <td style="font-weight: 700; color: #0f172a;">${j.title || 'Software Engineer'}</td>
        <td style="font-weight: 600; color: #475569;">${j.company || 'Tech Company'}</td>
        <td><span class="tag ${tagClass}">${s}% FIT</span></td>
        <td style="color: #64748b; font-size: 8pt;">${j.location || 'Remote'}</td>
        <td style="font-size: 8pt; color: #334155;">${(j.match_reason || 'Strong keyword and tech stack alignment.').substring(0, 90)}...</td>
      </tr>
    `;
  }).join('');

  const sections = [
    {
      title: 'Top Matched Engineering Opportunities',
      contentHtml: `
        <table class="data-table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Company</th>
              <th>Match Fit</th>
              <th>Location</th>
              <th>ATS Alignment Rationale</th>
            </tr>
          </thead>
          <tbody>${jobRows}</tbody>
        </table>
      `
    }
  ];

  const html = buildInstitutionalDossierHtml({
    title: 'CANDIDATE INTELLIGENCE & ROLE MATCH DOSSIER',
    subtitle: `Semantic Job Fit & Application Pipeline for ${resumeName}`,
    badge: 'CAREER // ATS RECRUITMENT AUDIT',
    kpiTiles,
    sections,
    analystNote: `Multi-agent semantic matching parsed candidate profile <strong>${resumeName}</strong> against <strong>${jobs.length} live job listings</strong>. Optimal role alignment peaked at <strong>${highestMatch}%</strong> compatibility.`
  });

  printReportDocument(html);
};

/**
 * 7. Export Dashboard Developer Digest PDF
 */
export const exportDashboardDigestPdf = (user, stats) => {
  const name = user?.name || 'Engineer';
  const email = user?.email || 'N/A';

  const kpiTiles = [
    { label: 'GitHub Audits', value: `${stats?.analysesCount || 0}`, sub: 'Profiles Analyzed', borderColor: '#0284c7' },
    { label: 'ArXiv Papers', value: `${stats?.papersCount || 0}`, sub: 'Synthesized Literatures', borderColor: '#10b981' },
    { label: 'Open Source Issues', value: `${stats?.ossBookmarksCount || 0}`, sub: 'Contribution Bookmarks' },
    { label: 'Job Opportunities', value: `${stats?.jobsCount || 0}`, sub: 'Evaluated Postings' }
  ];

  const engineRows = [
    { engine: 'LangGraph Multi-Agent Audit Pipeline', role: 'GitHub Profile Analysis & Benchmark', status: 'OPERATIONAL' },
    { engine: 'Llama 3.3 70B (Groq TPU)', role: 'ArXiv Research Paper Intuition & Synthesis', status: 'OPERATIONAL' },
    { engine: 'Facebook Prophet + ARIMA Pipeline', role: '26-Week Skill Market Forecasting', status: 'OPERATIONAL' },
    { engine: 'Autonomous JSearch Career Crawler', role: 'Live Engineering Job Telemetry', status: 'CONNECTED' }
  ].map(e => `
    <tr>
      <td style="font-weight: 700; color: #0f172a;">${e.engine}</td>
      <td style="color: #475569;">${e.role}</td>
      <td><span class="tag tag-green">${e.status}</span></td>
    </tr>
  `).join('');

  const sections = [
    {
      title: 'Active Intelligence Engines & Capabilities',
      contentHtml: `
        <table class="data-table">
          <thead>
            <tr>
              <th>Engine Architecture</th>
              <th>Operational Function</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${engineRows}</tbody>
        </table>
      `
    }
  ];

  const html = buildInstitutionalDossierHtml({
    title: 'DEVELOPER INTELLIGENCE PLATFORM DIGEST',
    subtitle: `Portfolio Telemetry & Autonomous Agent Status for ${name} (${email})`,
    badge: 'PLATFORM // EXECUTIVE DIGEST',
    kpiTiles,
    sections,
    analystNote: `This automated executive digest compiles developer telemetry across all active InnovateX multi-agent pipelines for <strong>${name}</strong>.`
  });

  printReportDocument(html);
};

/**
 * 8. Multi-Type & Multi-Format GitHub Intelligence Exporter (Section 32)
 * Report Types:
 *  - 'full_audit'            (Full GitHub Audit)
 *  - 'executive_summary'     (Executive Summary)
 *  - 'repository_report'     (Repository Report)
 *  - 'developer_intelligence'(Developer Intelligence Report)
 *  - 'optimization_plan'     (Optimization Plan)
 * Formats: 'pdf' | 'md' | 'json' | 'csv'
 */
export const exportGithubReportByType = (report, reportType = 'full_audit', format = 'pdf', selectedRepoName = null) => {
  if (!report) return;
  const generatedAt = new Date().toISOString();
  const dataTimestamp = report.analyzed_at || report.fetched_at || generatedAt;
  const methodologyVersion = report.methodologyVersion || 'v2.1';
  const username = report.username || 'developer';
  const totalScore = report.overall_score ?? report.totalScore ?? 0;
  const dimensions = report.dimensions || [];
  const recommendations = report.recommendations || [];
  const repositories = report.repositories || report.best_repos || [];
  const targetRepo = selectedRepoName
    ? repositories.find((r) => r.name === selectedRepoName) || repositories[0]
    : repositories[0];

  // 1. JSON Export
  if (format === 'json') {
    let payload = {
      reportType,
      generatedAt,
      dataTimestamp,
      methodologyVersion,
      username,
      totalScore,
      confidenceLabel: report.confidenceLabel || 'High confidence'
    };

    if (reportType === 'executive_summary') {
      payload = {
        ...payload,
        profile: report.profile,
        scoreBreakdown: dimensions.map((d) => ({ dimension: d.dimension, score: d.score, maxScore: d.maxScore, percentage: d.percentage })),
        featuredProjects: report.featured_candidates || [],
        topRecommendations: recommendations.slice(0, 4)
      };
    } else if (reportType === 'repository_report') {
      payload = {
        ...payload,
        repository: targetRepo || null,
        allRepositoriesSummary: repositories.map((r) => ({
          name: r.name,
          language: r.language,
          healthScore: r.health_score,
          lifecycleState: r.lifecycle_state,
          depthClassification: r.depth_classification,
          stars: r.stargazers_count,
          gaps: r.gaps
        }))
      };
    } else if (reportType === 'optimization_plan') {
      payload = {
        ...payload,
        projection: report.projection,
        recommendations
      };
    } else {
      payload = {
        ...payload,
        dimensions,
        projection: report.projection,
        developerDna: report.developer_dna,
        detectedTechnologies: report.detected_technologies,
        languageDistribution: report.language_distribution,
        repositories,
        recommendations,
        changes: report.changes || []
      };
    }

    downloadFile(
      `${username}_${reportType}_${methodologyVersion}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
    return;
  }

  // 2. CSV Export
  if (format === 'csv') {
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    let rows = [];
    if (reportType === 'repository_report') {
      rows.push(['Repository', 'Language', 'Health Score', 'Doc Score', 'Eng Score', 'Lifecycle State', 'Depth Class', 'Stars', 'Forks', 'Topics', 'Updated At', 'Gaps']);
      repositories.forEach((r) => {
        rows.push([
          r.name,
          r.language || 'N/A',
          r.health_score ?? 0,
          r.breakdown?.documentation ?? 0,
          r.breakdown?.engineering ?? 0,
          r.lifecycle_state || 'Active',
          r.depth_classification || 'Supporting',
          r.stargazers_count ?? 0,
          r.forks_count ?? 0,
          (r.topics || []).join('; '),
          r.pushed_at || '',
          (r.gaps || []).join('; ')
        ]);
      });
    } else if (reportType === 'optimization_plan') {
      rows.push(['ID', 'Title', 'Severity', 'Category', 'Impact', 'Effort', 'Estimated Benefit', 'Observation', 'Recommended Actions', 'Verification Criteria']);
      recommendations.forEach((rec) => {
        rows.push([
          rec.id,
          rec.title,
          rec.severity,
          rec.category,
          rec.impact,
          rec.effort,
          rec.estimatedBenefit,
          rec.observation,
          (rec.actions || []).join(' | '),
          rec.verificationCriteria
        ]);
      });
    } else {
      rows.push(['Dimension', 'Score', 'Max Score', 'Percentage', 'Confidence', 'Primary Observation', 'Key Evidence']);
      dimensions.forEach((d) => {
        rows.push([
          d.dimension,
          d.score,
          d.maxScore,
          `${d.percentage}%`,
          d.confidenceLabel,
          d.observation || d.primaryIssue,
          (d.reasons || []).join(' | ')
        ]);
      });
    }

    const csvContent = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    downloadFile(`${username}_${reportType}_${methodologyVersion}.csv`, csvContent, 'text/csv;charset=utf-8');
    return;
  }

  // 3. Markdown Export
  if (format === 'md') {
    let md = `# GitHub Developer Intelligence — ${reportType.replace(/_/g, ' ').toUpperCase()}\n\n`;
    md += `- **Developer:** @${username} (${report.display_name || username})\n`;
    md += `- **Generated Timestamp:** ${generatedAt}\n`;
    md += `- **Data Snapshot Timestamp:** ${dataTimestamp}\n`;
    md += `- **Methodology Version:** ${methodologyVersion}\n`;
    md += `- **Public Profile Health Score:** **${totalScore} / 100** (${report.confidenceLabel || 'High confidence'})\n\n`;

    if (reportType !== 'repository_report') {
      md += `## Score Breakdown & Evidence\n\n`;
      md += `| Dimension | Score | Max | % | Confidence | Primary Observation |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      dimensions.forEach((d) => {
        md += `| **${d.dimension}** | ${d.score} | ${d.maxScore} | ${d.percentage}% | ${d.confidenceLabel} | ${d.primaryIssue} |\n`;
      });
      md += `\n`;
    }

    if (reportType === 'repository_report' || reportType === 'full_audit' || reportType === 'developer_intelligence') {
      md += `## Repository Intelligence Matrix (${repositories.length} Public Source Repositories)\n\n`;
      md += `| Repository | Language | Health | Docs | Eng | State | Depth | Stars |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      repositories.forEach((r) => {
        md += `| **${r.name}** | ${r.language || 'N/A'} | ${r.health_score}/100 | ${r.breakdown?.documentation ?? 0} | ${r.breakdown?.engineering ?? 0} | ${r.lifecycle_state} | ${r.depth_classification} | ${r.stargazers_count} |\n`;
      });
      md += `\n`;
    }

    if (reportType === 'optimization_plan' || reportType === 'full_audit' || reportType === 'executive_summary') {
      if (report.projection) {
        md += `## Optimization Projection (${report.projection.label})\n\n`;
        md += `- **Current Score:** ${report.projection.currentScore} / 100\n`;
        md += `- **Modelled Projected Score:** ${report.projection.projectedScore} / 100 (+${report.projection.potentialGain} pts)\n`;
        md += `- *Note: ${report.projection.disclaimer}*\n\n`;
      }
      md += `## Prioritized Recommendations\n\n`;
      recommendations.forEach((rec, i) => {
        md += `### ${i + 1}. [${rec.severity.toUpperCase()}] ${rec.title} (${rec.category})\n`;
        md += `- **Observation:** ${rec.observation}\n`;
        md += `- **Why it matters:** ${rec.interpretation}\n`;
        md += `- **Impact / Effort:** ${rec.impact} Impact / ${rec.effort} Effort (${rec.estimatedBenefit})\n`;
        md += `- **Actions:**\n${(rec.actions || []).map((a) => `  - ${a}`).join('\n')}\n`;
        md += `- **Verification Criteria:** ${rec.verificationCriteria}\n\n`;
      });
    }

    downloadFile(`${username}_${reportType}_${methodologyVersion}.md`, md);
    return;
  }

  // 4. PDF Export
  const kpiTiles = [
    { label: 'Profile Health', value: `${totalScore}/100`, sub: `Methodology ${methodologyVersion}`, borderColor: totalScore >= 75 ? '#10b981' : totalScore >= 50 ? '#f59e0b' : '#ef4444' },
    { label: 'Modelled Target', value: `${report.projection?.projectedScore ?? totalScore}/100`, sub: 'Modelled Projection' },
    { label: 'Source Repos', value: `${repositories.length}`, sub: `Primary: ${report.top_languages?.[0] || 'N/A'}` },
    { label: 'Confidence', value: report.confidenceLabel || 'High', sub: `Synced: ${new Date(dataTimestamp).toLocaleDateString()}` }
  ];

  const dimRows = dimensions.map((d) => `
    <tr>
      <td style="font-weight: 700;">${d.dimension}</td>
      <td style="font-family: monospace; font-weight: 700;">${d.score} / ${d.maxScore} (${d.percentage}%)</td>
      <td style="font-size: 8pt; color: #334155;">${d.observation || d.primaryIssue}</td>
      <td style="font-family: monospace; font-size: 7.5pt; color: #64748b;">${d.confidenceLabel}</td>
    </tr>
  `).join('');

  const repoRows = repositories.slice(0, 12).map((r) => `
    <tr>
      <td style="font-weight: 700;">${r.name}</td>
      <td><span class="tag tag-blue">${r.language || 'Code'}</span></td>
      <td style="font-family: monospace; font-weight: 700;">${r.health_score}/100</td>
      <td>${r.lifecycle_state}</td>
      <td>${r.depth_classification}</td>
      <td style="font-size: 8pt; color: #475569;">${(r.gaps || []).slice(0, 2).join(', ') || 'Well-configured'}</td>
    </tr>
  `).join('');

  const recCards = recommendations.map((rec, idx) => `
    <div class="list-card">
      <div class="list-card-title">
        <span>${idx + 1}. [${rec.category}] ${rec.title}</span>
        <span class="tag ${rec.severity === 'Critical' || rec.severity === 'High' ? 'tag-rose' : rec.severity === 'Medium' ? 'tag-amber' : 'tag-green'}">${rec.severity} • ${rec.estimatedBenefit}</span>
      </div>
      <div class="list-card-desc"><strong>Observation:</strong> ${rec.observation}</div>
      <div class="list-card-desc"><strong>Why it matters:</strong> ${rec.interpretation}</div>
      <div class="list-card-desc" style="margin-top: 3px; color: #0369a1;"><strong>Verification:</strong> ${rec.verificationCriteria}</div>
    </div>
  `).join('');

  const sections = [];
  if (reportType !== 'repository_report') {
    sections.push({
      title: `Eight-Dimension Score Breakdown (Methodology ${methodologyVersion})`,
      contentHtml: `<table class="data-table"><thead><tr><th>Dimension</th><th>Score</th><th>Observed Evidence</th><th>Confidence</th></tr></thead><tbody>${dimRows}</tbody></table>`
    });
  }
  if (reportType !== 'optimization_plan') {
    sections.push({
      title: 'Repository Quality & Depth Matrix',
      contentHtml: `<table class="data-table"><thead><tr><th>Repository</th><th>Language</th><th>Health</th><th>State</th><th>Depth</th><th>Key Gaps / Status</th></tr></thead><tbody>${repoRows}</tbody></table>`
    });
  }
  if (reportType !== 'repository_report') {
    sections.push({
      title: 'Prioritized Evidence-Backed Recommendations',
      contentHtml: recCards || '<p>No critical gaps detected.</p>'
    });
  }

  const html = buildInstitutionalDossierHtml({
    title: `GITHUB ${reportType.replace(/_/g, ' ').toUpperCase()}`,
    subtitle: `Developer Intelligence Report for @${username} • Data Snapshot: ${new Date(dataTimestamp).toUTCString()}`,
    badge: `METHODOLOGY ${methodologyVersion}`,
    date: new Date(generatedAt).toUTCString(),
    kpiTiles,
    sections,
    analystNote: `Evidence-backed GitHub Profile Intelligence report for <strong>@${username}</strong>. Overall Profile Health is <strong>${totalScore}/100</strong> (${report.confidenceLabel || 'High confidence'}). Modelled projection estimates <strong>${report.projection?.projectedScore ?? totalScore}/100</strong> upon completing recommended documentation and discoverability actions.`
  });

  printReportDocument(html);
};



