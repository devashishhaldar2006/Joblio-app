import { Request, Response } from 'express';
import axios from 'axios';
import GithubAnalysis from '../models/GithubAnalysis.js';
import User from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

function computeSnapshotChanges(prevReport: any, currReport: any) {
  if (!prevReport || !currReport) return [];
  const changes: any[] = [];

  const prevScore = prevReport.overall_score ?? prevReport.totalScore ?? 0;
  const currScore = currReport.overall_score ?? currReport.totalScore ?? 0;
  if (currScore !== prevScore) {
    const diff = currScore - prevScore;
    changes.push({
      type: 'score_change',
      category: 'Score',
      delta: diff,
      title: `Profile Health Score ${diff > 0 ? `increased by +${diff}` : `changed by ${diff}`} points`,
      detail: `Previous: ${prevScore}/100 → Current: ${currScore}/100`
    });
  }

  const prevProf = prevReport.profile || {};
  const currProf = currReport.profile || {};

  if (!prevProf.has_profile_readme && currProf.has_profile_readme) {
    changes.push({
      type: 'profile_updated',
      category: 'Profile',
      title: 'Profile README added',
      detail: `Created profile repository ${currReport.username}/${currReport.username}`
    });
  }
  if ((prevProf.bio || '') !== (currProf.bio || '') && currProf.bio) {
    changes.push({
      type: 'profile_updated',
      category: 'Profile',
      title: 'Developer bio updated',
      detail: `New bio: "${currProf.bio}"`
    });
  }
  if ((prevProf.blog || '') !== (currProf.blog || '') && currProf.blog) {
    changes.push({
      type: 'profile_updated',
      category: 'Profile',
      title: 'External website / portfolio link updated',
      detail: `Linked: ${currProf.blog}`
    });
  }

  const prevFollowers = prevReport.followers ?? prevProf.followers ?? 0;
  const currFollowers = currReport.followers ?? currProf.followers ?? 0;
  if (currFollowers !== prevFollowers) {
    const d = currFollowers - prevFollowers;
    changes.push({
      type: 'follower_change',
      category: 'Community',
      delta: d,
      title: `${d > 0 ? `+${d} new follower(s)` : `${d} follower change`}`,
      detail: `Followers: ${prevFollowers} → ${currFollowers}`
    });
  }

  const prevStars = prevReport.total_stars ?? 0;
  const currStars = currReport.total_stars ?? 0;
  if (currStars !== prevStars) {
    const d = currStars - prevStars;
    changes.push({
      type: 'star_change',
      category: 'Community',
      delta: d,
      title: `${d > 0 ? `+${d} star(s) earned` : `${d} star change`} across repositories`,
      detail: `Total stars: ${prevStars} → ${currStars}`
    });
  }

  const prevRepos = prevReport.repositories || prevReport.repo_analysis?.repositories || prevReport.best_repos || [];
  const currRepos = currReport.repositories || currReport.repo_analysis?.repositories || [];

  const prevMap = new Map(prevRepos.map((r: any) => [r.name, r]));
  const currMap = new Map(currRepos.map((r: any) => [r.name, r]));

  for (const [name, cRepo] of currMap.entries()) {
    const pRepo: any = prevMap.get(name);
    if (!pRepo) {
      changes.push({
        type: 'repo_added',
        category: 'Repository',
        repo: name,
        title: `+ New public repository: ${name}`,
        detail: (cRepo as any).description || `Primary language: ${(cRepo as any).language || 'N/A'}`
      });
      continue;
    }

    if ((cRepo as any).pushed_at && pRepo.pushed_at && (cRepo as any).pushed_at !== pRepo.pushed_at) {
      changes.push({
        type: 'repo_pushed',
        category: 'Activity',
        repo: name,
        title: `New commits pushed to ${name}`,
        detail: `Last push updated to ${new Date((cRepo as any).pushed_at).toLocaleString()}`
      });
    }

    if ((pRepo.description || '') !== ((cRepo as any).description || '') && (cRepo as any).description) {
      changes.push({
        type: 'description_changed',
        category: 'Documentation',
        repo: name,
        title: `Repository description updated on ${name}`,
        detail: `"${(cRepo as any).description}"`
      });
    }

    const pTopics = (pRepo.topics || []).length;
    const cTopics = ((cRepo as any).topics || []).length;
    if (cTopics > pTopics) {
      changes.push({
        type: 'topics_changed',
        category: 'Discoverability',
        repo: name,
        title: `Added ${cTopics - pTopics} topic tag(s) to ${name}`,
        detail: `Topics: ${((cRepo as any).topics || []).join(', ')}`
      });
    }

    const pReadme = pRepo.readme || {};
    const cReadme = (cRepo as any).readme || {};
    if (pReadme.inspected && cReadme.inspected) {
      if (!pReadme.exists && cReadme.exists) {
        changes.push({
          type: 'readme_changed',
          category: 'Documentation',
          repo: name,
          title: `README.md added to ${name}`,
          detail: `${cReadme.word_count || 0} words (${cReadme.score || 0}/100 documentation score)`
        });
      } else if (cReadme.exists && pReadme.length && Math.abs((cReadme.length || 0) - pReadme.length) > 40) {
        changes.push({
          type: 'readme_changed',
          category: 'Documentation',
          repo: name,
          title: `README.md updated in ${name}`,
          detail: `Documentation score: ${pReadme.score || 0} → ${cReadme.score || 0}/100`
        });
      }
    }
  }

  for (const [name] of prevMap.entries()) {
    if (!currMap.has(name) && prevRepos.length > 3) {
      changes.push({
        type: 'repo_removed',
        category: 'Repository',
        repo: name,
        title: `- Repository no longer public or renamed: ${name}`,
        detail: 'Removed from public repository list'
      });
    }
  }

  return changes;
}

function verifyRecommendationsAgainstSnapshot(prevReport: any, currReport: any) {
  const verified: any[] = [];
  if (!prevReport || !currReport) return verified;

  const prevRecs = prevReport.recommendations || [];
  const currRepos = currReport.repositories || [];
  const repoMap = new Map(currRepos.map((r: any) => [r.name, r]));
  const currProfile = currReport.profile || {};

  for (const rec of prevRecs) {
    const rule = rec.verificationRule || {};
    let isVerified = false;
    let proof = '';

    if (rule.type === 'has_profile_readme' && currProfile.has_profile_readme) {
      isVerified = true;
      proof = `Profile repository ${currReport.username}/${currReport.username} is now active.`;
    } else if (rule.type === 'profile_has_bio_or_blog' && currProfile.bio && currProfile.blog) {
      isVerified = true;
      proof = `Profile now contains bio ("${currProfile.bio}") and link (${currProfile.blog}).`;
    } else if (rule.type === 'repo_has_description' && rule.targetRepo) {
      const r: any = repoMap.get(rule.targetRepo);
      if (r && r.description) {
        isVerified = true;
        proof = `Repository '${r.name}' now contains description: "${r.description}"`;
      }
    } else if (rule.type === 'repo_has_topics' && rule.targetRepo) {
      const r: any = repoMap.get(rule.targetRepo);
      if (r && r.topics && r.topics.length > 0) {
        isVerified = true;
        proof = `Repository '${r.name}' now has topics: ${r.topics.join(', ')}`;
      }
    } else if (rule.type === 'repo_has_readme' && rule.targetRepo) {
      const r: any = repoMap.get(rule.targetRepo);
      if (r && r.readme && r.readme.exists) {
        isVerified = true;
        proof = `Repository '${r.name}' now contains a README.md (${r.readme.word_count} words).`;
      }
    } else if (rule.type === 'repo_readme_score' && rule.targetRepo) {
      const r: any = repoMap.get(rule.targetRepo);
      if (r && r.readme && r.readme.score >= (rule.threshold || 65)) {
        isVerified = true;
        proof = `README score for '${r.name}' improved to ${r.readme.score}/100.`;
      }
    } else if (rule.type === 'repo_has_ci_or_tests' && rule.targetRepo) {
      const r: any = repoMap.get(rule.targetRepo);
      if (r && r.engineering && (r.engineering.has_tests || r.engineering.has_ci)) {
        isVerified = true;
        proof = `Repository '${r.name}' now contains automated test or CI configuration.`;
      }
    } else if (rule.type === 'min_licensed_repos') {
      if ((currReport.repo_analysis?.repos_with_license || 0) >= (rule.threshold || 1)) {
        isVerified = true;
        proof = `${currReport.repo_analysis.repos_with_license} repository(ies) now specify an open-source license.`;
      }
    }

    if (isVerified) {
      verified.push({
        id: rec.id,
        title: rec.title,
        category: rec.category,
        verifiedAt: new Date().toISOString(),
        proof
      });
    }
  }

  return verified;
}

async function enrichReportWithHistory(cleanUsername: string, currentRecord: any) {
  const snapshots = await GithubAnalysis.find({ username: cleanUsername })
    .sort({ analyzedAt: -1 })
    .limit(15)
    .lean();

  const scoreHistory = snapshots
    .slice()
    .reverse()
    .map((s: any) => ({
      id: s._id,
      analyzedAt: s.analyzedAt,
      overallScore: s.overallScore ?? s.report?.overall_score ?? 0,
      methodologyVersion: s.methodologyVersion || s.report?.methodologyVersion || 'v1.0',
      changesCount: Array.isArray(s.changes) ? s.changes.length : 0,
      changes: s.changes || []
    }));

  const prevSnapshot: any = snapshots.length > 1 ? snapshots[1] : null;
  const prevDims = prevSnapshot?.report?.dimensions || [];
  const prevDimMap = new Map(prevDims.map((d: any) => [d.id, d]));

  const report = { ...currentRecord.report };
  if (Array.isArray(report.dimensions)) {
    report.dimensions = report.dimensions.map((d: any) => {
      const pDim: any = prevDimMap.get(d.id);
      const delta = pDim && typeof pDim.score === 'number' ? Number((d.score - pDim.score).toFixed(1)) : null;
      return {
        ...d,
        delta
      };
    });
  }

  return {
    ...report,
    snapshotId: currentRecord._id,
    analyzed_at: currentRecord.analyzedAt,
    scoreDelta: currentRecord.scoreDelta,
    changes: currentRecord.changes || [],
    verifiedRecommendations: currentRecord.verifiedRecommendations || [],
    recommendationStatuses: currentRecord.recommendationStatuses || {},
    selectedGoal: currentRecord.selectedGoal || 'Improve GitHub profile',
    scoreHistory
  };
}

export const analyzeGithub = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, forceSync = false, goal } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'GitHub username is required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const previousRecord = await GithubAnalysis.findOne({
      username: cleanUsername
    }).sort({ analyzedAt: -1 });

    if (
      !forceSync &&
      previousRecord &&
      previousRecord.analyzedAt >= oneDayAgo &&
      previousRecord.report &&
      previousRecord.report.methodologyVersion === 'v2.1'
    ) {
      if (goal && goal !== previousRecord.selectedGoal) {
        previousRecord.selectedGoal = goal;
        await previousRecord.save();
      }
      const enriched = await enrichReportWithHistory(cleanUsername, previousRecord);
      return res.status(200).json(enriched);
    }

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(
      `${pythonUrl}/github/analyze`,
      { username: cleanUsername },
      { timeout: 65000 }
    );

    const finalReport = pyRes.data;
    const currScore = finalReport.overall_score ?? finalReport.totalScore ?? 0;

    let changes: any[] = [];
    let verifiedRecommendations: any[] = [];
    let scoreDelta: number | null = null;
    let carriedStatuses: Record<string, any> = {};
    let selectedGoal = goal || 'Improve GitHub profile';

    if (previousRecord && previousRecord.report) {
      const prevScore = previousRecord.overallScore ?? previousRecord.report.overall_score ?? null;
      if (typeof prevScore === 'number') {
        scoreDelta = currScore - prevScore;
      }
      changes = computeSnapshotChanges(previousRecord.report, finalReport);
      verifiedRecommendations = verifyRecommendationsAgainstSnapshot(previousRecord.report, finalReport);
      carriedStatuses = { ...(previousRecord.recommendationStatuses || {}) };
      for (const v of verifiedRecommendations) {
        carriedStatuses[v.id] = 'verified';
      }
      if (!goal && previousRecord.selectedGoal) {
        selectedGoal = previousRecord.selectedGoal;
      }
    }

    const newRecord = new GithubAnalysis({
      userId: req.user!._id,
      username: cleanUsername,
      methodologyVersion: finalReport.methodologyVersion || 'v2.1',
      overallScore: currScore,
      scoreDelta,
      changes,
      verifiedRecommendations,
      recommendationStatuses: carriedStatuses,
      selectedGoal,
      report: finalReport,
      analyzedAt: new Date()
    });
    await newRecord.save();

    try {
      await User.findByIdAndUpdate(req.user!._id, { githubUsername: cleanUsername });
    } catch (uErr: any) {
      console.warn('Could not sync user githubUsername:', uErr.message);
    }

    const enriched = await enrichReportWithHistory(cleanUsername, newRecord);
    return res.status(200).json(enriched);
  } catch (err: any) {
    console.error('Github analyze error:', err.response?.data || err.message);
    const detail = err.response?.data?.detail;
    const status = err.response?.status || 500;
    if (detail && typeof detail === 'object') {
      return res.status(status).json({
        error: detail.message || 'GitHub analysis failed.',
        rate_limit: detail.rate_limit || null
      });
    }
    const msg = detail || err.response?.data?.error || err.message || 'GitHub analysis failed.';
    return res.status(status).json({ error: msg });
  }
};

export const getLatestAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queryUsername = req.query.username ? (req.query.username as string).trim().toLowerCase() : null;
    let filter: Record<string, any>;
    if (queryUsername) {
      filter = {
        $or: [
          { username: queryUsername, userId: req.user!._id },
          { username: queryUsername }
        ]
      };
    } else {
      filter = {
        $or: [
          { userId: req.user!._id }
        ]
      };
      if (req.user?.githubUsername) {
        filter.$or.push({ username: req.user.githubUsername.trim().toLowerCase() });
      }
    }

    let latestRecord = await GithubAnalysis.findOne(filter).sort({ analyzedAt: -1 });
    if (!latestRecord || !latestRecord.report) {
      return res.status(200).json(null);
    }

    if (latestRecord.report.methodologyVersion !== 'v2.1') {
      try {
        const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
        const pyRes = await axios.post(
          `${pythonUrl}/github/analyze`,
          { username: latestRecord.username },
          { timeout: 65000 }
        );
        const finalReport = pyRes.data;
        const currScore = finalReport.overall_score ?? finalReport.totalScore ?? 0;
        latestRecord.methodologyVersion = finalReport.methodologyVersion || 'v2.1';
        latestRecord.overallScore = currScore;
        latestRecord.report = finalReport;
        latestRecord.analyzedAt = new Date();
        await latestRecord.save();
      } catch (upgradeErr: any) {
        console.warn('Auto-upgrade to v2.1 failed, returning existing record:', upgradeErr.message);
      }
    }

    const enriched = await enrichReportWithHistory(latestRecord.username, latestRecord);
    return res.status(200).json(enriched);
  } catch (err) {
    console.error('Github latest error:', err);
    return res.status(500).json({ error: 'Failed to fetch latest GitHub analysis.' });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter: Record<string, any> = {
      $or: [
        { userId: req.user!._id }
      ]
    };
    if (req.user?.githubUsername) {
      filter.$or.push({ username: req.user.githubUsername.trim().toLowerCase() });
    }
    if (req.query.username) {
      filter.$or.push({ username: (req.query.username as string).trim().toLowerCase() });
    }
    let history = await GithubAnalysis.find(filter)
      .sort({ analyzedAt: -1 })
      .limit(15);

    return res.status(200).json(history);
  } catch (err) {
    console.error('Github history error:', err);
    return res.status(500).json({ error: 'Failed to fetch GitHub analysis history.' });
  }
};

export const updateState = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, recommendationStatuses, selectedGoal } = req.body;
    const filter = username
      ? { username: username.trim().toLowerCase() }
      : { userId: req.user!._id };

    const latest = await GithubAnalysis.findOne(filter).sort({ analyzedAt: -1 });
    if (!latest) {
      return res.status(404).json({ error: 'No analysis record found to update.' });
    }

    if (recommendationStatuses && typeof recommendationStatuses === 'object') {
      latest.recommendationStatuses = {
        ...(latest.recommendationStatuses || {}),
        ...recommendationStatuses
      };
      latest.markModified('recommendationStatuses');
    }

    if (selectedGoal) {
      latest.selectedGoal = selectedGoal;
    }

    await latest.save();
    return res.status(200).json({
      recommendationStatuses: latest.recommendationStatuses,
      selectedGoal: latest.selectedGoal
    });
  } catch (err) {
    console.error('Github state update error:', err);
    return res.status(500).json({ error: 'Failed to update recommendation state.' });
  }
};

export const generateAIFix = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action_type, report, target_repo, custom_instructions } = req.body;
    if (!action_type || !report) {
      return res.status(400).json({ error: 'action_type and report context are required.' });
    }
    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(
      `${pythonUrl}/github/ai-generate`,
      { action_type, report, target_repo, custom_instructions },
      { timeout: 45000 }
    );
    return res.status(200).json(pyRes.data);
  } catch (err: any) {
    console.error('Github AI generate error:', err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data?.detail || 'Failed to generate AI fix.' });
  }
};

export const askAICommand = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query, report, changes } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required.' });
    }
    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(
      `${pythonUrl}/github/ai-ask`,
      { query, report: report || {}, changes: changes || [] },
      { timeout: 45000 }
    );
    return res.status(200).json(pyRes.data);
  } catch (err: any) {
    console.error('Github AI ask error:', err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data?.detail || 'Failed to execute AI query.' });
  }
};
