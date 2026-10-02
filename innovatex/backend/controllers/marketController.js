const axios = require('axios');
const MarketSnapshot = require('../models/MarketSnapshot');
const SkillDataPoint = require('../models/SkillDataPoint');
const JobSearchHistory = require('../models/JobSearchHistory');
const User = require('../models/User');

const getPythonBaseUrl = () => process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/market/forecast
 * Auth required
 * Body: { skill, user_skills }
 */
const forecastSkill = async (req, res) => {
  try {
    const { skill } = req.body;
    let user_skills = req.body.user_skills || [];

    if (!skill || typeof skill !== 'string') {
      return res.status(400).json({ error: 'Please specify a skill name to forecast.' });
    }

    // If user_skills not supplied in payload, extract from User profile or latest JobSearchHistory
    if ((!user_skills || user_skills.length === 0) && req.user && req.user._id) {
      try {
        const userDoc = await User.findById(req.user._id).select('skills');
        if (userDoc?.skills && Array.isArray(userDoc.skills) && userDoc.skills.length > 0) {
          user_skills = userDoc.skills;
        } else {
          const lastSearch = await JobSearchHistory.findOne({ userId: req.user._id })
            .sort({ searchedAt: -1 })
            .select('parsedProfile.skills');
          if (lastSearch?.parsedProfile?.skills && Array.isArray(lastSearch.parsedProfile.skills)) {
            user_skills = lastSearch.parsedProfile.skills;
          }
        }
      } catch (profileErr) {
        console.warn('[Market Controller] Could not load user profile skills:', profileErr.message);
      }
    }

    const pyUrl = `${getPythonBaseUrl()}/market/forecast`;
    const response = await axios.post(
      pyUrl,
      { skill, user_skills },
      { timeout: 60000 } // 60s timeout for ML forecasting pipeline
    );

    return res.status(200).json(response.data);
  } catch (err) {
    console.error('[Market Controller] Forecast error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Skill forecasting failed.';
    return res.status(500).json({ error: msg });
  }
};

/**
 * GET /api/market/trending
 * No auth required
 * Checks MongoDB MarketSnapshot (<24h old) or fetches from Python service
 */
const getTrending = async (req, res) => {
  try {
    // Check latest MarketSnapshot in MongoDB
    const latest = await MarketSnapshot.findOne().sort({ week_start: -1 });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (latest && latest.collected_at && latest.collected_at > oneDayAgo) {
      const top10 = (latest.top_skills || []).slice(0, 10);
      const emerging5 = (latest.emerging_skills || []).slice(0, 5);

      // Safely format week_start whether it's a Date object or string
      let weekStr = 'Current';
      if (latest.week_start) {
        try {
          const wsDate = latest.week_start instanceof Date ? latest.week_start : new Date(latest.week_start);
          weekStr = wsDate.toISOString().slice(0, 10);
        } catch {
          weekStr = String(latest.week_start);
        }
      }

      return res.status(200).json({
        top_10_rising: top10,
        top_5_emerging: emerging5,
        week: weekStr,
        last_updated: latest.collected_at
      });
    }

    // Call Python GET /market/trending
    try {
      const pyUrl = `${getPythonBaseUrl()}/market/trending`;
      const pyRes = await axios.get(pyUrl, { timeout: 30000 });
      return res.status(200).json(pyRes.data);
    } catch (pyErr) {
      // Fallback to latest available snapshot even if > 24h
      if (latest) {
        return res.status(200).json({
          top_10_rising: (latest.top_skills || []).slice(0, 10),
          top_5_emerging: (latest.emerging_skills || []).slice(0, 5),
          week: latest.week_start,
          last_updated: latest.collected_at
        });
      }
      throw pyErr;
    }
  } catch (err) {
    console.error('[Market Controller] Trending error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to retrieve trending skills data.' });
  }
};

/**
 * GET /api/market/snapshot
 * No auth required
 * Returns full market snapshot for latest week
 */
const getSnapshot = async (req, res) => {
  try {
    const latest = await MarketSnapshot.findOne().sort({ week_start: -1 });
    if (latest) {
      return res.status(200).json(latest);
    }

    // Forward to Python if DB snapshot not yet saved
    const pyUrl = `${getPythonBaseUrl()}/market/snapshot`;
    const pyRes = await axios.get(pyUrl, { timeout: 30000 });
    return res.status(200).json(pyRes.data);
  } catch (err) {
    console.error('[Market Controller] Snapshot error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to retrieve market snapshot.' });
  }
};

/**
 * POST /api/market/gap-report
 * Auth required
 * Body: { user_skills }
 */
const getGapReport = async (req, res) => {
  try {
    let user_skills = req.body.user_skills || [];

    // Fallback to profile skills if empty
    if ((!user_skills || user_skills.length === 0) && req.user && req.user._id) {
      try {
        const userDoc = await User.findById(req.user._id).select('skills');
        if (userDoc?.skills && Array.isArray(userDoc.skills) && userDoc.skills.length > 0) {
          user_skills = userDoc.skills;
        } else {
          const lastSearch = await JobSearchHistory.findOne({ userId: req.user._id })
            .sort({ searchedAt: -1 })
            .select('parsedProfile.skills');
          if (lastSearch?.parsedProfile?.skills && Array.isArray(lastSearch.parsedProfile.skills)) {
            user_skills = lastSearch.parsedProfile.skills;
          }
        }
      } catch (e) {
        console.warn('[Market Controller] Failed loading profile skills for gap report:', e.message);
      }
    }

    const pyUrl = `${getPythonBaseUrl()}/market/gap-report`;
    const pyRes = await axios.post(pyUrl, { user_skills }, { timeout: 60000 });
    return res.status(200).json(pyRes.data);
  } catch (err) {
    console.error('[Market Controller] Gap report error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Failed to generate skill gap report.';
    return res.status(500).json({ error: msg });
  }
};

/**
 * GET /api/market/history/:skill
 * No auth required
 * Forward to Python GET /market/history/:skill
 */
const getSkillHistory = async (req, res) => {
  try {
    const { skill } = req.params;
    const pyUrl = `${getPythonBaseUrl()}/market/history/${encodeURIComponent(skill)}`;
    const pyRes = await axios.get(pyUrl, { timeout: 60000 });
    return res.status(200).json(pyRes.data);
  } catch (err) {
    console.error('[Market Controller] History error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Failed to retrieve skill history.';
    return res.status(500).json({ error: msg });
  }
};

module.exports = {
  forecastSkill,
  getTrending,
  getSnapshot,
  getGapReport,
  getSkillHistory
};
