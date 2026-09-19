const axios = require('axios');
const FormData = require('form-data');
const JobSearchHistory = require('../models/JobSearchHistory');

const searchJobs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF resume file.' });
    }

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    // Prepare multipart form data to forward to FastAPI
    const form = new FormData();
    form.append('resume', req.file.buffer, {
      filename: req.file.originalname || 'resume.pdf',
      contentType: req.file.mimetype || 'application/pdf'
    });

    const pyRes = await axios.post(`${pythonUrl}/jobs/search`, form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000
    });

    const { parsed_profile, results } = pyRes.data;

    // Save to JobSearchHistory
    const historyDoc = new JobSearchHistory({
      userId: req.user._id,
      parsedProfile: parsed_profile || {},
      results: results || [],
      searchedAt: new Date()
    });
    await historyDoc.save();

    return res.status(200).json({
      history_id: historyDoc._id,
      parsed_profile,
      results
    });
  } catch (err) {
    console.error('Job search error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Job search pipeline failed.';
    return res.status(500).json({ error: msg });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await JobSearchHistory.find({ userId: req.user._id })
      .sort({ searchedAt: -1 })
      .limit(10)
      .select('searchedAt parsedProfile.name parsedProfile.current_role results');

    return res.status(200).json(history);
  } catch (err) {
    console.error('Job history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve job search history.' });
  }
};

const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await JobSearchHistory.findOne({ _id: id, userId: req.user._id });
    if (!doc) {
      return res.status(404).json({ error: 'Search history record not found or access denied.' });
    }
    return res.status(200).json(doc);
  } catch (err) {
    console.error('Job history by id error:', err);
    return res.status(500).json({ error: 'Failed to retrieve job search record.' });
  }
};

module.exports = {
  searchJobs,
  getHistory,
  getHistoryById
};
