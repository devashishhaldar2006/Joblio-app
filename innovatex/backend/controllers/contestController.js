const ContestCache = require('../models/ContestCache');
const { updateContestCache, inferDifficulty } = require('../utils/contestFetcher');

const getContests = async (req, res) => {
  try {
    const { platform, days } = req.query;
    const maxDays = days ? parseInt(days, 10) : 7;

    // Check existing cache
    let cacheDoc = await ContestCache.findOne({});
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    // If cache empty or stale, trigger refetch
    if (!cacheDoc || !cacheDoc.fetchedAt || cacheDoc.fetchedAt < sixHoursAgo || !cacheDoc.contests || cacheDoc.contests.length === 0) {
      console.log('[ContestController] Cache is stale or empty, refetching live...');
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

    // Rule-based scoring:
    // beginner -> prioritize Div.3, Div.4, LeetCode biweekly, beginner
    // intermediate -> Div.2, CodeChef Starters
    // advanced -> Div.1, AtCoder ARC/AGC
    const scoredContests = contests.map(c => {
      let matchScore = 50;
      const diff = c.difficulty || inferDifficulty(c.title);
      let isRecommended = false;

      if (level === 'beginner') {
        if (diff === 'beginner') {
          matchScore = 95;
          isRecommended = true;
        } else if (diff === 'intermediate') {
          matchScore = 65;
        } else {
          matchScore = 30;
        }
      } else if (level === 'intermediate') {
        if (diff === 'intermediate') {
          matchScore = 95;
          isRecommended = true;
        } else if (diff === 'beginner') {
          matchScore = 75;
        } else {
          matchScore = 60;
        }
      } else { // advanced
        if (diff === 'advanced') {
          matchScore = 95;
          isRecommended = true;
        } else if (diff === 'intermediate') {
          matchScore = 80;
        } else {
          matchScore = 40;
        }
      }

      return {
        ...c,
        personalized_score: matchScore,
        is_recommended: isRecommended,
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
