const axios = require('axios');
const ResearchHistory = require('../models/ResearchHistory');

const explainPaper = async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Paper input (ArXiv URL or title) is required.' });
    }

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${pythonUrl}/research/explain`, { input }, { timeout: 60000 });

    const finalOutput = pyRes.data;

    const record = new ResearchHistory({
      userId: req.user._id,
      input,
      output: finalOutput,
      timestamp: new Date()
    });
    await record.save();

    return res.status(200).json(finalOutput);
  } catch (err) {
    console.error('Research explain error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Paper analysis failed.';
    return res.status(500).json({ error: msg });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await ResearchHistory.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(10);

    return res.status(200).json(history);
  } catch (err) {
    console.error('Research history error:', err);
    return res.status(500).json({ error: 'Failed to fetch research history.' });
  }
};

module.exports = {
  explainPaper,
  getHistory
};
