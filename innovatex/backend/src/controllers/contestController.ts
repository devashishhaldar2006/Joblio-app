import { Request, Response } from 'express';
import ContestCache from '../models/ContestCache.js';
import { updateContestCache, inferDifficulty, IContest } from '../utils/contestFetcher.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const getContests = async (req: Request, res: Response) => {
  try {
    const { platform, days, refresh } = req.query as { platform?: string; days?: string; refresh?: string };
    const maxDays = days ? parseInt(days, 10) : 60;
    const forceRefresh = refresh === 'true' || refresh === '1';

    let cacheDoc = await ContestCache.findOne({});
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    if (forceRefresh || !cacheDoc || !cacheDoc.fetchedAt || cacheDoc.fetchedAt < sixHoursAgo || !cacheDoc.contests || cacheDoc.contests.length < 15) {
      console.log('[ContestController] Refreshing live multi-source contest cache...');
      const freshContests = await updateContestCache();
      cacheDoc = { contests: freshContests, fetchedAt: new Date() } as any;
    }

    let contests: IContest[] = (cacheDoc?.contests || []) as IContest[];

    const nonEnglishRegex = /[\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0600-\u06FF]/;
    contests = contests.filter(c => c.title && !nonEnglishRegex.test(c.title) && c.url && c.url.startsWith('http'));

    const limitDate = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);
    contests = contests.filter(c => new Date(c.start_time) <= limitDate);

    if (platform && platform.toLowerCase() !== 'all') {
      const allowedPlatforms = platform.toLowerCase().split(',').map(p => p.trim());
      contests = contests.filter(c => allowedPlatforms.includes(c.platform_logo_key) || allowedPlatforms.includes(c.platform.toLowerCase()));
    }

    return res.status(200).json(contests);
  } catch (err) {
    console.error('Get contests error:', err);
    return res.status(500).json({ error: 'Failed to retrieve contests.' });
  }
};

export const getPersonalizedContests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { skill_level, preferred_platforms } = req.body;
    const level = (skill_level || 'beginner').toLowerCase();

    let cacheDoc = await ContestCache.findOne({});
    if (!cacheDoc || !cacheDoc.contests || cacheDoc.contests.length === 0) {
      const freshContests = await updateContestCache();
      cacheDoc = { contests: freshContests, fetchedAt: new Date() } as any;
    }

    let contests: IContest[] = [...(cacheDoc?.contests || [])] as IContest[];

    if (preferred_platforms && Array.isArray(preferred_platforms) && preferred_platforms.length > 0) {
      const allowed = preferred_platforms.map(p => p.toLowerCase());
      contests = contests.filter(c => allowed.includes(c.platform_logo_key) || allowed.includes(c.platform.toLowerCase()));
    }

    const scoredContests = contests.map(c => {
      const diff = c.difficulty || inferDifficulty(c.title);
      let baseScore = 60;
      let isRecommended = false;

      if (level === 'beginner') {
        if (diff === 'beginner') {
          baseScore = 92;
          isRecommended = true;
        } else if (diff === 'intermediate') {
          baseScore = 68;
        } else {
          baseScore = 38;
        }
      } else if (level === 'intermediate') {
        if (diff === 'intermediate') {
          baseScore = 93;
          isRecommended = true;
        } else if (diff === 'beginner') {
          baseScore = 78;
        } else {
          baseScore = 64;
        }
      } else {
        if (diff === 'advanced') {
          baseScore = 94;
          isRecommended = true;
        } else if (diff === 'intermediate') {
          baseScore = 82;
        } else {
          baseScore = 52;
        }
      }

      const durHours = (c.duration_seconds || 7200) / 3600;
      let durationModifier = 0;
      if (durHours >= 1.5 && durHours <= 3.5) {
        durationModifier = 3;
      } else if (durHours > 12) {
        durationModifier = -4;
      }

      const platformLower = (c.platform || '').toLowerCase();
      let platformModifier = 0;
      if (platformLower.includes('codeforces') || platformLower.includes('leetcode') || platformLower.includes('atcoder')) {
        platformModifier = 2;
      }

      const hashBonus = (c.title || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 4;
      const finalMatchScore = Math.min(99, Math.max(25, baseScore + durationModifier + platformModifier + hashBonus));

      return {
        ...c,
        personalized_score: finalMatchScore,
        is_recommended: isRecommended || finalMatchScore >= 85,
        target_skill: level
      };
    });

    scoredContests.sort((a, b) => b.personalized_score - a.personalized_score || new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return res.status(200).json(scoredContests);
  } catch (err) {
    console.error('Personalized contests error:', err);
    return res.status(500).json({ error: 'Failed to generate personalized contests.' });
  }
};
