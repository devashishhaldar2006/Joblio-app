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
  const p = (platformStr || '').toLowerCase();
  if (p.includes('codeforces')) return 'codeforces';
  if (p.includes('leetcode')) return 'leetcode';
  if (p.includes('codechef')) return 'codechef';
  if (p.includes('atcoder')) return 'atcoder';
  if (p.includes('hackerrank')) return 'hackerrank';
  if (p.includes('hackerearth')) return 'hackerearth';
  if (p.includes('geeksforgeeks') || p.includes('code360')) return 'geeksforgeeks';
  if (p.includes('ctftime')) return 'ctftime';
  if (p.includes('kattis')) return 'kattis';
  if (p.includes('luogu')) return 'luogu';
  if (p.includes('projecteuler')) return 'projecteuler';
  if (p.includes('topcoder')) return 'topcoder';
  return 'other';
}

function getPlatformDisplayName(platformStr) {
  const p = (platformStr || '').toLowerCase();
  if (p.includes('codeforces')) return 'Codeforces';
  if (p.includes('leetcode')) return 'LeetCode';
  if (p.includes('codechef')) return 'CodeChef';
  if (p.includes('atcoder')) return 'AtCoder';
  if (p.includes('hackerrank')) return 'HackerRank';
  if (p.includes('hackerearth')) return 'HackerEarth';
  if (p.includes('geeksforgeeks') || p.includes('code360')) return 'GeeksforGeeks';
  if (p.includes('ctftime')) return 'CTFtime';
  if (p.includes('kattis')) return 'ICPC / Kattis';
  if (p.includes('luogu')) return 'Luogu';
  if (p.includes('projecteuler')) return 'Project Euler';
  if (p.includes('topcoder')) return 'TopCoder';
  return platformStr ? platformStr.replace(/\.com|\.org|\.jp|\.net|\.cn|\.ru|\.by|\.in/g, '').toUpperCase() : 'Competitive';
}

function inferTechnologies(title, platform) {
  const t = (title + ' ' + platform).toLowerCase();
  const techs = [];
  if (t.includes('ctf') || t.includes('security') || t.includes('cyber') || t.includes('ctftime')) {
    return ['Security', 'Reverse Eng', 'Cryptography'];
  }
  if (t.includes('ai') || t.includes('ml') || t.includes('machine learning') || t.includes('llm') || t.includes('gpt')) {
    techs.push('AI / ML');
  }
  if (t.includes('web') || t.includes('fullstack') || t.includes('hackathon')) {
    techs.push('Fullstack / Web');
  }
  if (t.includes('cloud') || t.includes('aws') || t.includes('azure') || t.includes('gcp')) {
    techs.push('Cloud');
  }
  if (t.includes('atcoder') || t.includes('math') || t.includes('projecteuler')) {
    techs.push('Mathematics');
  }
  if (t.includes('codeforces') || t.includes('c++')) {
    techs.push('Systems & C++');
  }
  if (techs.length === 0) {
    techs.push('Algorithms', 'Data Structures');
  } else {
    techs.push('Algorithms');
  }
  return techs.slice(0, 3);
}

async function fetchFromCLIST() {
  const username = process.env.CLIST_USERNAME;
  const apiKey = process.env.CLIST_API_KEY;
  if (!username || !apiKey || username === 'your_clist_username') {
    return [];
  }

  const now = new Date();
  const sixtyDaysLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  try {
    const resp = await axios.get('https://clist.by/api/v2/contest/', {
      headers: {
        Authorization: `ApiKey ${username}:${apiKey}`
      },
      params: {
        upcoming: 'true',
        order_by: 'start',
        limit: 200,
        start__gte: now.toISOString(),
        end__lte: sixtyDaysLater.toISOString()
      },
      timeout: 15000
    });

    if (resp.data && resp.data.objects) {
      return resp.data.objects.map(c => {
        const platformKey = getPlatformKey(c.resource || c.host);
        const displayName = getPlatformDisplayName(c.resource || c.host);
        return {
          contest_id: `clist_${c.id}`,
          title: c.event,
          platform: displayName,
          platform_logo_key: platformKey,
          start_time: c.start,
          end_time: c.end,
          duration_seconds: c.duration,
          url: c.href,
          difficulty: inferDifficulty(c.event),
          technologies: inferTechnologies(c.event, displayName),
          format: 'Online',
          location: 'Global · Virtual'
        };
      });
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
      const sixtyDaysSec = nowSec + 60 * 24 * 60 * 60;

      const upcoming = resp.data.result.filter(c => c.phase === 'BEFORE' && c.startTimeSeconds && c.startTimeSeconds <= sixtyDaysSec);

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
          difficulty: inferDifficulty(c.name),
          technologies: ['Competitive Programming', 'C++', 'Algorithms'],
          format: 'Online',
          location: 'Global · Virtual'
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
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 10000
      }
    );

    if (resp.data && resp.data.data && resp.data.data.allContests) {
      const nowSec = Math.floor(Date.now() / 1000);
      const sixtyDaysSec = nowSec + 60 * 24 * 60 * 60;

      const upcoming = resp.data.data.allContests.filter(c => c.startTime > nowSec && c.startTime <= sixtyDaysSec);

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
          difficulty: inferDifficulty(c.title),
          technologies: ['Algorithms', 'Data Structures', 'Python / Java'],
          format: 'Online',
          location: 'Global · Virtual'
        };
      });
    }
  } catch (err) {
    console.error('LeetCode GraphQL API fetch failed:', err.message);
  }
  return [];
}

async function fetchFromCodeChef() {
  try {
    const resp = await axios.get(
      'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    );
    if (resp.data && resp.data.status === 'success') {
      const future = resp.data.future_contests || [];
      const present = resp.data.present_contests || [];
      const allUpcoming = [...present, ...future];

      const now = Date.now();
      const sixtyDaysLater = now + 60 * 24 * 60 * 60 * 1000;

      return allUpcoming
        .filter(c => {
          const sTime = new Date(c.contest_start_date_iso || c.contest_start_date).getTime();
          return sTime >= now - 4 * 60 * 60 * 1000 && sTime <= sixtyDaysLater;
        })
        .map(c => {
          const startIso = new Date(c.contest_start_date_iso || c.contest_start_date).toISOString();
          const endIso = new Date(c.contest_end_date_iso || c.contest_end_date).toISOString();
          const durationMin = parseInt(c.contest_duration, 10) || 120;
          return {
            contest_id: `cc_${c.contest_code}`,
            title: c.contest_name,
            platform: 'CodeChef',
            platform_logo_key: 'codechef',
            start_time: startIso,
            end_time: endIso,
            duration_seconds: durationMin * 60,
            url: `https://www.codechef.com/${c.contest_code}`,
            difficulty: inferDifficulty(c.contest_name),
            technologies: ['Algorithms', 'Data Structures', 'Problem Solving'],
            format: 'Online',
            location: 'Global · Virtual'
          };
        });
    }
  } catch (err) {
    console.error('CodeChef API fetch failed:', err.message);
  }
  return [];
}

async function fetchFromAtCoder() {
  try {
    const resp = await axios.get('https://kenkoooo.com/atcoder/resources/contests.json', { timeout: 10000 });
    if (Array.isArray(resp.data)) {
      const nowSec = Math.floor(Date.now() / 1000);
      const sixtyDaysSec = nowSec + 60 * 24 * 60 * 60;

      const upcoming = resp.data.filter(
        c => c.start_epoch_second && (c.start_epoch_second + c.duration_second) > nowSec && c.start_epoch_second <= sixtyDaysSec
      );

      return upcoming.map(c => {
        const startIso = new Date(c.start_epoch_second * 1000).toISOString();
        const endIso = new Date((c.start_epoch_second + c.duration_second) * 1000).toISOString();
        return {
          contest_id: `ac_${c.id}`,
          title: c.title,
          platform: 'AtCoder',
          platform_logo_key: 'atcoder',
          start_time: startIso,
          end_time: endIso,
          duration_seconds: c.duration_second,
          url: `https://atcoder.jp/contests/${c.id}`,
          difficulty: inferDifficulty(c.title),
          technologies: ['Algorithms', 'Mathematics', 'C++'],
          format: 'Online',
          location: 'Global · Virtual'
        };
      });
    }
  } catch (err) {
    console.error('AtCoder API fetch failed:', err.message);
  }
  return [];
}

async function updateContestCache() {
  console.log('[ContestFetcher] Starting multi-source contest fetch...');

  const results = await Promise.allSettled([
    fetchFromCLIST(),
    fetchFromCodeforces(),
    fetchFromLeetCode(),
    fetchFromCodeChef(),
    fetchFromAtCoder()
  ]);

  const combined = [];
  results.forEach((r, idx) => {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      combined.push(...r.value);
    } else if (r.status === 'rejected') {
      console.warn(`[ContestFetcher] Source #${idx} failed:`, r.reason?.message || r.reason);
    }
  });

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
  fetchFromCodeChef,
  fetchFromAtCoder,
  inferDifficulty
};

