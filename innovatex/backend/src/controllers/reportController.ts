import { Response } from 'express';
import GithubAnalysis from '../models/GithubAnalysis.js';
import ResearchHistory from '../models/ResearchHistory.js';
import JobSearchHistory from '../models/JobSearchHistory.js';
import OpenSourceHistory from '../models/OpenSourceHistory.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

function normalizeGithubReport(doc: any) {
  const r = doc.report || {};
  const username = doc.username || r.username || 'developer';
  const score = doc.overallScore ?? r.overall_score ?? r.totalScore ?? 0;
  const repos = r.repositories || r.best_repos || [];
  const topLangs = r.top_languages || (r.repo_analysis?.primary_language ? [r.repo_analysis.primary_language] : []);
  const recsCount = (r.recommendations || []).length;

  return {
    id: doc._id.toString(),
    type: 'github',
    categoryLabel: 'GitHub Intelligence',
    title: `GitHub Profile Audit: @${username}`,
    subtitle: `Methodology ${doc.methodologyVersion || r.methodologyVersion || 'v2.1'} • ${new Date(doc.analyzedAt).toLocaleDateString()}`,
    createdAt: doc.analyzedAt,
    score,
    scoreLabel: '/ 100',
    tier: r.tier || (score >= 85 ? 'Elite' : score >= 70 ? 'Strong' : 'Developing'),
    tags: topLangs.length > 0 ? topLangs.slice(0, 4) : ['Profile Audit'],
    metrics: [
      { label: 'Score', value: `${score} / 100` },
      { label: 'Public Repos', value: repos.length || r.public_repos || 0 },
      { label: 'Total Stars', value: r.total_stars ?? r.repo_analysis?.total_stars ?? 0 },
      { label: 'Recommendations', value: recsCount },
      ...(doc.scoreDelta !== null && doc.scoreDelta !== undefined ? [{
        label: 'Delta',
        value: doc.scoreDelta > 0 ? `+${doc.scoreDelta}` : `${doc.scoreDelta}`
      }] : [])
    ],
    summary: r.confidenceLabel
      ? `Profile health evaluated with ${r.confidenceLabel.toLowerCase()}. ${recsCount} actionable optimizations identified.`
      : `Complete forensic GitHub audit evaluating code cadence, repository depth, and developer footprint.`,
    targetUrl: `/github?tab=overview`,
    data: {
      ...r,
      snapshotId: doc._id,
      username,
      analyzedAt: doc.analyzedAt,
      overallScore: score,
      scoreDelta: doc.scoreDelta,
      changes: doc.changes || [],
      verifiedRecommendations: doc.verifiedRecommendations || [],
      recommendationStatuses: doc.recommendationStatuses || {},
      selectedGoal: doc.selectedGoal
    },
    rawData: {
      ...r,
      snapshotId: doc._id,
      username,
      analyzedAt: doc.analyzedAt,
      overallScore: score,
      scoreDelta: doc.scoreDelta,
      changes: doc.changes || [],
      verifiedRecommendations: doc.verifiedRecommendations || [],
      recommendationStatuses: doc.recommendationStatuses || {},
      selectedGoal: doc.selectedGoal
    }
  };
}

function normalizeResearchReport(doc: any) {
  const out = doc.output || {};
  const exp = out.explanation || {};
  const contributions = exp.key_contributions || exp.key_innovations || [];
  const paperId = out.paper_id || 'ArXiv';
  const title = out.title || doc.input || 'Synthesized Research Paper';

  const rawData = {
    ...out,
    input: doc.input,
    timestamp: doc.timestamp
  };

  return {
    id: doc._id.toString(),
    type: 'research',
    categoryLabel: 'Research Synthesis',
    title: `Paper Synthesis: ${title}`,
    subtitle: `ArXiv: ${paperId} • Published: ${out.year || 'N/A'} • ${new Date(doc.timestamp).toLocaleDateString()}`,
    createdAt: doc.timestamp,
    score: null,
    scoreLabel: null,
    tags: ['ArXiv', out.year ? `Year ${out.year}` : 'AI/ML', 'Paper Synthesis'],
    metrics: [
      { label: 'Identifier', value: paperId },
      { label: 'Innovations', value: contributions.length },
      { label: 'Model', value: 'Llama 3.3 70B' }
    ],
    summary: exp.simple_summary || exp.tldr || exp.what_problem_it_solves || 'Comprehensive literature breakdown and architectural innovations.',
    targetUrl: `/research`,
    data: rawData,
    rawData
  };
}

function normalizeJobReport(doc: any) {
  const prof = doc.parsedProfile || {};
  const results = doc.results || [];
  const highestMatch = results.length > 0
    ? Math.max(...results.map((r: any) => r.match_score || 0))
    : null;
  const avgMatch = results.length > 0
    ? Math.round(results.reduce((acc: number, j: any) => acc + (j.match_score || 0), 0) / results.length)
    : null;

  const candidateName = prof.name || 'Candidate';
  const role = prof.current_role || prof.target_role || 'Software Engineer';
  const skills = Array.isArray(prof.skills) ? prof.skills.slice(0, 5) : [];

  const rawData = {
    parsedProfile: prof,
    results,
    searchedAt: doc.searchedAt
  };

  return {
    id: doc._id.toString(),
    type: 'jobs',
    categoryLabel: 'ATS Job Match',
    title: `Job Fit Audit: ${role} (${candidateName})`,
    subtitle: `${results.length} Roles Analyzed • ${new Date(doc.searchedAt).toLocaleDateString()}`,
    createdAt: doc.searchedAt,
    score: highestMatch,
    scoreLabel: '% Peak Fit',
    tags: skills.length > 0 ? skills : ['ATS Resume Match', role],
    metrics: [
      { label: 'Roles Evaluated', value: results.length },
      { label: 'Peak Match', value: highestMatch !== null ? `${highestMatch}%` : 'N/A' },
      { label: 'Average ATS Fit', value: avgMatch !== null ? `${avgMatch}%` : 'N/A' }
    ],
    summary: prof.summary || `Semantic ATS resume parsing evaluated against ${results.length} active market engineering positions.`,
    targetUrl: `/jobs`,
    data: rawData,
    rawData
  };
}

function normalizeOpenSourceReport(doc: any) {
  const isReview = doc.actionType === 'review';
  const repo = doc.repoName || 'Open Source Project';
  const issueNum = doc.issueNumber ? `#${doc.issueNumber}` : '';
  const title = isReview
    ? `Code Review: ${doc.issueUrl || repo}`
    : `Contribution Blueprint: ${repo} ${issueNum}`.trim();

  const guide = doc.data?.guide;
  const review = doc.data?.review;
  const filesCount = guide?.files_to_edit ? guide.files_to_edit.length : 0;
  const score = review?.score ?? null;

  const rawData = {
    actionType: doc.actionType,
    repoName: doc.repoName,
    issueUrl: doc.issueUrl,
    issueTitle: doc.issueTitle,
    issueNumber: doc.issueNumber,
    skills: doc.skills,
    preferredLanguage: doc.preferredLanguage,
    experienceLevel: doc.experienceLevel,
    data: doc.data,
    createdAt: doc.createdAt
  };

  return {
    id: doc._id.toString(),
    type: 'opensource',
    categoryLabel: isReview ? 'OSS Code Review' : 'OSS Blueprint',
    title,
    subtitle: `${repo} • ${doc.preferredLanguage || 'Polyglot'} • ${new Date(doc.createdAt).toLocaleDateString()}`,
    createdAt: doc.createdAt,
    score,
    scoreLabel: score !== null ? '/ 100' : null,
    tags: [
      isReview ? 'Code Review' : 'Contribution Guide',
      doc.preferredLanguage || 'Open Source',
      doc.experienceLevel || 'Intermediate'
    ],
    metrics: [
      { label: 'Repository', value: repo.split('/')[1] || repo },
      { label: 'Action', value: doc.actionType.toUpperCase() },
      ...(filesCount > 0 ? [{ label: 'Files to Edit', value: filesCount }] : [])
    ],
    summary: doc.issueTitle
      ? `Issue: "${doc.issueTitle}". Architectural blueprint and setup instructions for community contribution.`
      : (review?.feedback || 'Comprehensive open-source contribution guidance.'),
    targetUrl: `/opensource`,
    data: rawData,
    rawData
  };
}

export const getAllReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { type, search, limit = 50 } = req.query as { type?: string; search?: string; limit?: string };

    const ghFilter: Record<string, any> = {
      $or: [
        { userId }
      ]
    };
    if (req.user?.githubUsername) {
      ghFilter.$or.push({ username: req.user.githubUsername.trim().toLowerCase() });
    }

    const [ghDocs, researchDocs, jobDocs, ossDocs] = await Promise.all([
      GithubAnalysis.find(ghFilter).sort({ analyzedAt: -1 }).limit(Number(limit)).lean(),
      ResearchHistory.find({ userId }).sort({ timestamp: -1 }).limit(Number(limit)).lean(),
      JobSearchHistory.find({ userId }).sort({ searchedAt: -1 }).limit(Number(limit)).lean(),
      OpenSourceHistory.find({
        userId,
        actionType: { $in: ['guide', 'review', 'bookmark', 'search'] }
      }).sort({ createdAt: -1 }).limit(Number(limit)).lean()
    ]);

    let reports: any[] = [];

    if (!type || type === 'all' || type === 'github') {
      ghDocs.forEach((d) => {
        reports.push(normalizeGithubReport(d));
      });
    }

    if (!type || type === 'all' || type === 'research') {
      researchDocs.forEach((d) => {
        reports.push(normalizeResearchReport(d));
      });
    }

    if (!type || type === 'all' || type === 'jobs') {
      jobDocs.forEach((d) => {
        reports.push(normalizeJobReport(d));
      });
    }

    if (!type || type === 'all' || type === 'opensource') {
      ossDocs.forEach((d) => {
        reports.push(normalizeOpenSourceReport(d));
      });
    }

    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      reports = reports.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        (r.tags || []).some((t: string) => t.toLowerCase().includes(q))
      );
    }

    const stats = {
      totalReports: ghDocs.length + researchDocs.length + jobDocs.length + ossDocs.length,
      byCategory: {
        github: ghDocs.length,
        research: researchDocs.length,
        jobs: jobDocs.length,
        opensource: ossDocs.length
      },
      latestReportAt: reports.length > 0 ? reports[0].createdAt : null
    };

    return res.status(200).json({
      stats,
      reports
    });
  } catch (err) {
    console.error('[ReportController] getAllReports error:', err);
    return res.status(500).json({ error: 'Failed to retrieve reports archive.' });
  }
};

export const getReportById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, id } = req.params;
    const userId = req.user!._id;

    let doc: any = null;
    let normalized: any = null;

    if (type === 'github') {
      doc = await GithubAnalysis.findOne({ _id: id });
      if (doc) normalized = normalizeGithubReport(doc);
    } else if (type === 'research') {
      doc = await ResearchHistory.findOne({ _id: id, userId });
      if (doc) normalized = normalizeResearchReport(doc);
    } else if (type === 'jobs') {
      doc = await JobSearchHistory.findOne({ _id: id, userId });
      if (doc) normalized = normalizeJobReport(doc);
    } else if (type === 'opensource') {
      doc = await OpenSourceHistory.findOne({ _id: id, userId });
      if (doc) normalized = normalizeOpenSourceReport(doc);
    }

    if (!normalized) {
      return res.status(404).json({ error: 'Report not found or access denied.' });
    }

    return res.status(200).json(normalized);
  } catch (err) {
    console.error('[ReportController] getReportById error:', err);
    return res.status(500).json({ error: 'Failed to retrieve report.' });
  }
};

export const deleteReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, id } = req.params;
    const userId = req.user!._id;

    let deleted: any = null;
    if (type === 'github') {
      deleted = await GithubAnalysis.findOneAndDelete({ _id: id });
    } else if (type === 'research') {
      deleted = await ResearchHistory.findOneAndDelete({ _id: id, userId });
    } else if (type === 'jobs') {
      deleted = await JobSearchHistory.findOneAndDelete({ _id: id, userId });
    } else if (type === 'opensource') {
      deleted = await OpenSourceHistory.findOneAndDelete({ _id: id, userId });
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Report could not be found or was already deleted.' });
    }

    return res.status(200).json({ success: true, message: 'Report removed from archive.' });
  } catch (err) {
    console.error('[ReportController] deleteReport error:', err);
    return res.status(500).json({ error: 'Failed to delete report.' });
  }
};
