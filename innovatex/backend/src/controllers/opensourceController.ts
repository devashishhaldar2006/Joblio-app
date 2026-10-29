import { Response } from 'express';
import axios from 'axios';
import OpenSourceHistory from '../models/OpenSourceHistory.js';
import { callPythonServiceWithRetry } from '../utils/pythonService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const findOpportunities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { skills, experience_level, preferred_language, query } = req.body;

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${pythonUrl}/opensource/find`, {
      skills: skills || [],
      experience_level: experience_level || 'beginner',
      preferred_language: preferred_language || 'javascript',
      query: query || ''
    }, { timeout: 120000 });

    const results = pyRes.data || [];

    if (req.user?._id) {
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
      } catch (dbErr: any) {
        console.warn('[OpenSourceController] History save warning:', dbErr.message);
      }
    }

    return res.status(200).json(results);
  } catch (err: any) {
    console.error('Open source find error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Failed to find open source issues.';
    return res.status(500).json({ error: msg });
  }
};

export const guideThroughIssue = async (req: AuthenticatedRequest, res: Response) => {
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

    if (req.user?._id) {
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
      } catch (dbErr: any) {
        console.warn('[OpenSourceController] Guide save warning:', dbErr.message);
      }
    }

    return res.status(200).json(guide);
  } catch (err: any) {
    console.error('Open source guide error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Failed to generate PR guide.';
    return res.status(500).json({ error: msg });
  }
};

export const reviewCode = async (req: AuthenticatedRequest, res: Response) => {
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

    if (req.user?._id) {
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
      } catch (dbErr: any) {
        console.warn('[OpenSourceController] Review save warning:', dbErr.message);
      }
    }

    return res.status(200).json(review);
  } catch (err: any) {
    console.error('Open source review error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Code review failed.';
    return res.status(500).json({ error: msg });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(200).json([]);
    }
    const history = await OpenSourceHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json(history);
  } catch (err) {
    console.error('Open source history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve open source history.' });
  }
};

export const bookmarkIssue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: 'Authentication required to bookmark.' });
    }

    const raw = req.body?.issue || req.body;
    const issue_url = raw?.issue_url || raw?.url || req.body?.issue_url;
    const repo_name = raw?.repo_name || raw?.repo || req.body?.repo_name;
    const issue_title = raw?.issue_title || raw?.title || req.body?.issue_title;
    const issue_number = raw?.issue_number || raw?.number || req.body?.issue_number;
    const metadata = raw?.metadata || raw || req.body?.metadata;

    if (!issue_url || !repo_name) {
      return res.status(400).json({ error: 'issue_url and repo_name are required.' });
    }

    const existing = await OpenSourceHistory.findOne({
      userId: req.user._id,
      actionType: 'bookmark',
      issueUrl: issue_url
    });

    if (existing) {
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
