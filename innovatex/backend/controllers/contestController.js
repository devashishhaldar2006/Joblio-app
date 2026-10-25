const ContestCache = require('../models/ContestCache');
const { updateContestCache, inferDifficulty } = require('../utils/contestFetcher');

const getContests = async (req, res) => {
  try {
    const { platform, days, refresh } = req.query;
    const maxDays = days ? parseInt(days, 10) : 60;
    const forceRefresh = refresh === 'true' || refresh === '1';

    // Check existing cache
    let cacheDoc = await ContestCache.findOne({});
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    // If cache empty, stale, has very few items, or explicit refresh requested, trigger refetch
    if (forceRefresh || !cacheDoc || !cacheDoc.fetchedAt || cacheDoc.fetchedAt < sixHoursAgo || !cacheDoc.contests || cacheDoc.contests.length < 15) {
      console.log('[ContestController] Refreshing live multi-source contest cache...');
      const freshContests = await updateContestCache();
      cacheDoc = { contests: freshContests, fetchedAt: new Date() };
    }

    let contests = cacheDoc.contests || [];

    // Filter by max days
    const limitDate = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);
    contests = contests.filter(c => new Date(c.start_time) <= limitDate);

    // Filter by platform if provided
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

const getPersonalizedContests = async (req, res) => {
  try {
    const { skill_level, preferred_platforms } = req.body;
    const level = (skill_level || 'beginner').toLowerCase();

    let cacheDoc = await ContestCache.findOne({});
    if (!cacheDoc || !cacheDoc.contests || cacheDoc.contests.length === 0) {
      const freshContests = await updateContestCache();
      cacheDoc = { contests: freshContests, fetchedAt: new Date() };
    }

    let contests = [...(cacheDoc.contests || [])];

    // Filter platforms if selected
    if (preferred_platforms && Array.isArray(preferred_platforms) && preferred_platforms.length > 0) {
      const allowed = preferred_platforms.map(p => p.toLowerCase());
      contests = contests.filter(c => allowed.includes(c.platform_logo_key) || allowed.includes(c.platform.toLowerCase()));
    }

    // Dynamic scoring based on difficulty match, duration compatibility, and platform reliability:
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
      } else { // advanced
        if (diff === 'advanced') {
          baseScore = 94;
          isRecommended = true;
        } else if (diff === 'intermediate') {
          baseScore = 82;
        } else {
          baseScore = 52;
        }
      }

      // Duration factor: standard contest rounds (1h - 3h) get a slight synergy bonus
      const durHours = (c.duration_seconds || 7200) / 3600;
      let durationModifier = 0;
      if (durHours >= 1.5 && durHours <= 3.5) {
        durationModifier = 3;
      } else if (durHours > 12) {
        durationModifier = -4;
      }

      // Platform affinity bonus for official rated circuits
      const platformLower = (c.platform || '').toLowerCase();
      let platformModifier = 0;
      if (platformLower.includes('codeforces') || platformLower.includes('leetcode') || platformLower.includes('atcoder')) {
        platformModifier = 2;
      }

      // Deterministic title variance (0-3%) so scores are granular rather than identical blocks
      const hashBonus = (c.title || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 4;

      const finalMatchScore = Math.min(99, Math.max(25, baseScore + durationModifier + platformModifier + hashBonus));

      return {
        ...c,
        personalized_score: finalMatchScore,
        is_recommended: isRecommended || finalMatchScore >= 85,
        target_skill: level
      };
    });

    scoredContests.sort((a, b) => b.personalized_score - a.personalized_score || new Date(a.start_time) - new Date(b.start_time));

    return res.status(200).json(scoredContests);
  } catch (err) {
    console.error('Personalized contests error:', err);
    return res.status(500).json({ error: 'Failed to generate personalized contests.' });
  }
};

module.exports = {
  getContests,
  getPersonalizedContests
};
