import { Response } from 'express';
import axios from 'axios';
import ResearchHistory from '../models/ResearchHistory.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const explainPaper = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Paper input (ArXiv URL or title) is required.' });
    }

    const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${pythonUrl}/research/explain`, { input }, { timeout: 60000 });

    const finalOutput = pyRes.data;

    if (req.user?._id) {
      try {
        const record = new ResearchHistory({
          userId: req.user._id,
          input,
          output: finalOutput,
          timestamp: new Date()
        });
        await record.save();
      } catch (saveErr: any) {
        console.warn('Research history save warning:', saveErr.message);
      }
    }

    return res.status(200).json(finalOutput);
  } catch (err: any) {
    console.error('Research explain error:', err.response?.data || err.message);
    const msg = err.response?.data?.detail || err.message || 'Paper analysis failed.';
    return res.status(500).json({ error: msg });
  }
};

export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(200).json([]);
    }
    const history = await ResearchHistory.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(10);

    return res.status(200).json(history);
  } catch (err) {
    console.error('Research history error:', err);
    return res.status(500).json({ error: 'Failed to fetch research history.' });
  }
};
