const axios = require('axios');
const GithubAnalysis = require('../models/GithubAnalysis');

const analyzeGithub = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'GitHub username is required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check MongoDB if analysis exists for this username < 24h old
    const cachedAnalysis = await GithubAnalysis.findOne({
      username: cleanUsername,
      analyzedAt: { $gte: oneDayAgo }
    }).sort({ analyzedAt: -1 });

    if (cachedAnalysis && cachedAnalysis.report) {
      return res.status(200).json(cachedAnalysis.report);
    }

    // Call Python microservice
    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${pythonUrl}/github/analyze`, { username: cleanUsername }, { timeout: 60000 });

    const finalReport = pyRes.data;

    // Save result to GithubAnalysis collection
    const newRecord = new GithubAnalysis({
      userId: req.user._id,
      username: cleanUsername,
      report: finalReport,
      analyzedAt: new Date()
    });
    await newRecord.save();

    return res.status(200).json(finalReport);
  } catch (err) {
    console.error('Github analyze error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'GitHub analysis failed.';
    return res.status(500).json({ error: msg });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await GithubAnalysis.find({ userId: req.user._id })
      .sort({ analyzedAt: -1 })
      .limit(5);

    return res.status(200).json(history);
  } catch (err) {
    console.error('Github history error:', err);
    return res.status(500).json({ error: 'Failed to fetch GitHub analysis history.' });
  }
};

module.exports = {
  analyzeGithub,
  getHistory
};
