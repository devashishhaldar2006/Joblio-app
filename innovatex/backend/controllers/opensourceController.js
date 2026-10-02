const axios = require('axios');
const OpenSourceHistory = require('../models/OpenSourceHistory');

const findOpportunities = async (req, res) => {
  try {
    const { skills, experience_level, preferred_language } = req.body;

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${pythonUrl}/opensource/find`, {
      skills: skills || [],
      experience_level: experience_level || 'beginner',
      preferred_language: preferred_language || 'javascript'
    }, { timeout: 120000 });

    const results = pyRes.data || [];

    // Persist search to OpenSourceHistory if authenticated
    if (req.user && req.user._id) {
      try {
        const record = new OpenSourceHistory({
          userId: req.user._id,
          actionType: 'search',
          skills: skills || [],
          experienceLevel: experience_level || 'beginner',
          preferredLanguage: preferred_language || 'javascript',
          data: { results }
        });
        await record.save();
      } catch (dbErr) {
        console.warn('[OpenSourceController] History save warning:', dbErr.message);
      }
    }

    return res.status(200).json(results);
  } catch (err) {
    console.error('Open source find error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Failed to find open source issues.';
    return res.status(500).json({ error: msg });
  }
};

const guideThroughIssue = async (req, res) => {
  try {
    const { issue_url, repo_name, issue_number, issue_title } = req.body;
    if (!issue_url || !repo_name || issue_number === undefined) {
      return res.status(400).json({ error: 'issue_url, repo_name, and issue_number are required.' });
    }

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${pythonUrl}/opensource/guide`, {
      issue_url,
      repo_name,
      issue_number: Number(issue_number)
    }, { timeout: 60000 });

    const guide = pyRes.data;

    // Persist generated guide
    if (req.user && req.user._id) {
      try {
        const record = new OpenSourceHistory({
          userId: req.user._id,
          actionType: 'guide',
          repoName: repo_name,
          issueUrl: issue_url,
          issueTitle: issue_title || `Issue #${issue_number}`,
          issueNumber: Number(issue_number),
          data: { guide }
        });
        await record.save();
      } catch (dbErr) {
        console.warn('[OpenSourceController] Guide save warning:', dbErr.message);
      }
    }

    return res.status(200).json(guide);
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

    const review = pyRes.data;

    // Persist code review
    if (req.user && req.user._id) {
      try {
        const record = new OpenSourceHistory({
          userId: req.user._id,
          actionType: 'review',
          issueUrl: issue_url,
          data: {
            user_code,
            original_code: original_code || '',
            review
          }
        });
        await record.save();
      } catch (dbErr) {
        console.warn('[OpenSourceController] Review save warning:', dbErr.message);
      }
    }

    return res.status(200).json(review);
  } catch (err) {
    console.error('Open source review error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Code review failed.';
    return res.status(500).json({ error: msg });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await OpenSourceHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json(history);
  } catch (err) {
    console.error('Open source history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve open source history.' });
  }
};

const bookmarkIssue = async (req, res) => {
  try {
    const { issue_url, repo_name, issue_title, issue_number, metadata } = req.body;
    if (!issue_url || !repo_name) {
      return res.status(400).json({ error: 'issue_url and repo_name are required.' });
    }

    const existing = await OpenSourceHistory.findOne({
      userId: req.user._id,
      actionType: 'bookmark',
      issueUrl: issue_url
    });

    if (existing) {
      // Toggle off / remove bookmark
      await OpenSourceHistory.deleteOne({ _id: existing._id });
      return res.status(200).json({ bookmarked: false, message: 'Bookmark removed.' });
    }

    const bookmark = new OpenSourceHistory({
      userId: req.user._id,
      actionType: 'bookmark',
      repoName: repo_name,
      issueUrl: issue_url,
      issueTitle: issue_title || `Issue #${issue_number || ''}`,
      issueNumber: issue_number ? Number(issue_number) : undefined,
      data: metadata || {}
    });
    await bookmark.save();

    return res.status(201).json({ bookmarked: true, message: 'Issue bookmarked.', bookmark });
  } catch (err) {
    console.error('Bookmark issue error:', err);
    return res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
};

module.exports = {
  findOpportunities,
  guideThroughIssue,
  reviewCode,
  getHistory,
  bookmarkIssue
};

