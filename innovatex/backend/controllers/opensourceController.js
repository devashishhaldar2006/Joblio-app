const axios = require('axios');

const findOpportunities = async (req, res) => {
  try {
    const { skills, experience_level, preferred_language } = req.body;

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${pythonUrl}/opensource/find`, {
      skills: skills || [],
      experience_level: experience_level || 'beginner',
      preferred_language: preferred_language || 'javascript'
    }, { timeout: 90000 });

    return res.status(200).json(pyRes.data);
  } catch (err) {
    console.error('Open source find error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Failed to find open source issues.';
    return res.status(500).json({ error: msg });
  }
};

const guideThroughIssue = async (req, res) => {
  try {
    const { issue_url, repo_name, issue_number } = req.body;
    if (!issue_url || !repo_name || issue_number === undefined) {
      return res.status(400).json({ error: 'issue_url, repo_name, and issue_number are required.' });
    }

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${pythonUrl}/opensource/guide`, {
      issue_url,
      repo_name,
      issue_number: Number(issue_number)
    }, { timeout: 60000 });

    return res.status(200).json(pyRes.data);
  } catch (err) {
    console.error('Open source guide error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Failed to generate PR guide.';
    return res.status(500).json({ error: msg });
  }
};

const reviewCode = async (req, res) => {
  try {
    const { user_code, issue_url, original_code } = req.body;
    if (!user_code || !issue_url) {
      return res.status(400).json({ error: 'user_code and issue_url are required.' });
    }

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${pythonUrl}/opensource/review`, {
      user_code,
      issue_url,
      original_code: original_code || ''
    }, { timeout: 60000 });

    return res.status(200).json(pyRes.data);
  } catch (err) {
    console.error('Open source review error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Code review failed.';
    return res.status(500).json({ error: msg });
  }
};

module.exports = {
  findOpportunities,
  guideThroughIssue,
  reviewCode
};
