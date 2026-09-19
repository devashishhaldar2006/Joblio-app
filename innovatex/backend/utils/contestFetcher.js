const axios = require('axios');
const ContestCache = require('../models/ContestCache');

function inferDifficulty(title) {
  const t = title.toLowerCase();
  if (t.includes('div. 3') || t.includes('div.3') || t.includes('div. 4') || t.includes('div.4') || t.includes('biweekly') || t.includes('beginner') || t.includes('starter')) {
    return 'beginner';
  }
  if (t.includes('div. 1') || t.includes('div.1') || t.includes('grand') || t.includes('agc') || t.includes('advanced') || t.includes('hard')) {
    return 'advanced';
  }
  return 'intermediate';
}

function getPlatformKey(platformStr) {
  const p = platformStr.toLowerCase();
  if (p.includes('codeforces')) return 'codeforces';
  if (p.includes('leetcode')) return 'leetcode';
  if (p.includes('codechef')) return 'codechef';
  if (p.includes('atcoder')) return 'atcoder';
  if (p.includes('hackerrank')) return 'hackerrank';
  if (p.includes('hackerearth')) return 'hackerearth';
  if (p.includes('geeksforgeeks')) return 'geeksforgeeks';
  return 'other';
}

async function fetchFromCLIST() {
  const username = process.env.CLIST_USERNAME;
  const apiKey = process.env.CLIST_API_KEY;
  if (!username || !apiKey || username === 'your_clist_username') {
    return [];
  }

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    const resp = await axios.get('https://clist.by/api/v2/contest/', {
      headers: {
        Authorization: `ApiKey ${username}:${apiKey}`
      },
      params: {
        upcoming: 'true',
        order_by: 'start',
        limit: 100,
        start__gte: now.toISOString(),
        end__lte: sevenDaysLater.toISOString(),
        resource__name__in: 'codeforces.com,leetcode.com,codechef.com,atcoder.jp,hackerrank.com,hackerearth.com,geeksforgeeks.org'
      },
      timeout: 10000
    });

    if (resp.data && resp.data.objects) {
      return resp.data.objects.map(c => ({
        contest_id: `clist_${c.id}`,
        title: c.event,
        platform: c.resource,
        platform_logo_key: getPlatformKey(c.resource),
        start_time: c.start,
        end_time: c.end,
        duration_seconds: c.duration,
        url: c.href,
        difficulty: inferDifficulty(c.event)
      }));
    }
  } catch (err) {
    console.error('CLIST API fetch failed or rate-limited:', err.message);
  }
  return [];
}

async function fetchFromCodeforces() {
  try {
    const resp = await axios.get('https://codeforces.com/api/contest.list', { timeout: 10000 });
    if (resp.data && resp.data.status === 'OK' && Array.isArray(resp.data.result)) {
      const nowSec = Math.floor(Date.now() / 1000);
      const sevenDaysSec = nowSec + 7 * 24 * 60 * 60;

      const upcoming = resp.data.result.filter(c => c.phase === 'BEFORE' && c.startTimeSeconds && c.startTimeSeconds <= sevenDaysSec);

      return upcoming.map(c => {
        const startIso = new Date(c.startTimeSeconds * 1000).toISOString();
        const endIso = new Date((c.startTimeSeconds + c.durationSeconds) * 1000).toISOString();
        return {
          contest_id: `cf_${c.id}`,
          title: c.name,
          platform: 'Codeforces',
          platform_logo_key: 'codeforces',
          start_time: startIso,
          end_time: endIso,
          duration_seconds: c.durationSeconds,
          url: `https://codeforces.com/contest/${c.id}`,
          difficulty: inferDifficulty(c.name)
        };
      });
    }
  } catch (err) {
    console.error('Codeforces API fetch failed:', err.message);
  }
  return [];
}

async function fetchFromLeetCode() {
  try {
    const query = `{ allContests { title titleSlug startTime duration } }`;
    const resp = await axios.post(
      'https://leetcode.com/graphql',
      { query },
      {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'InnovateX' },
        timeout: 10000
      }
    );

    if (resp.data && resp.data.data && resp.data.data.allContests) {
      const nowSec = Math.floor(Date.now() / 1000);
      const sevenDaysSec = nowSec + 7 * 24 * 60 * 60;

      const upcoming = resp.data.data.allContests.filter(c => c.startTime > nowSec && c.startTime <= sevenDaysSec);

      return upcoming.map((c, idx) => {
        const startIso = new Date(c.startTime * 1000).toISOString();
        const endIso = new Date((c.startTime + c.duration) * 1000).toISOString();
        return {
          contest_id: `lc_${c.titleSlug || idx}`,
          title: c.title,
          platform: 'LeetCode',
          platform_logo_key: 'leetcode',
          start_time: startIso,
          end_time: endIso,
          duration_seconds: c.duration,
          url: `https://leetcode.com/contest/${c.titleSlug}`,
          difficulty: inferDifficulty(c.title)
        };
      });
    }
  } catch (err) {
    console.error('LeetCode GraphQL API fetch failed:', err.message);
  }
  return [];
}

async function updateContestCache() {
  console.log('[ContestFetcher] Starting multi-source contest fetch...');

  const [clistList, cfList, lcList] = await Promise.all([
    fetchFromCLIST(),
    fetchFromCodeforces(),
    fetchFromLeetCode()
  ]);

  const combined = [...clistList, ...cfList, ...lcList];

  // Deduplicate by platform_logo_key + start_time
  const seen = new Set();
  const deduplicated = [];

  for (const c of combined) {
    // Normalise start time to hour level for cross-source matching
    const startHour = c.start_time ? c.start_time.substring(0, 13) : '';
    const key = `${c.platform_logo_key}_${startHour}_${c.title.slice(0, 10).toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(c);
    }
  }

  // Sort chronologically by start_time
  deduplicated.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  try {
    await ContestCache.findOneAndUpdate(
      {},
      { contests: deduplicated, fetchedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`[ContestFetcher] Successfully cached ${deduplicated.length} live upcoming contests.`);
  } catch (err) {
    console.error('[ContestFetcher] Error writing to MongoDB ContestCache:', err.message);
  }

  return deduplicated;
}

module.exports = {
  updateContestCache,
  fetchFromCodeforces,
  fetchFromLeetCode,
  inferDifficulty
};
