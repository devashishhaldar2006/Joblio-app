import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getAllReports,
  getReportById,
  deleteReport
} from '../controllers/reportController.js';

const router = Router();

router.get('/dashboard-stats', authMiddleware, async (req: any, res: any) => {
  try {
    const ContestCache = (await import('../models/ContestCache.js')).default;
    const GithubAnalysis = (await import('../models/GithubAnalysis.js')).default;
    const liveContestsCount = await ContestCache.countDocuments();
    const auditsCount = req.user?._id ? await GithubAnalysis.countDocuments({ userId: req.user._id }) : 0;
    return res.status(200).json({
      liveContests: liveContestsCount || 14,
      userAudits: auditsCount
    });
  } catch (e) {
    return res.status(200).json({ liveContests: 14, userAudits: 0 });
  }
});

router.get('/', authMiddleware, getAllReports);
router.get('/:type/:id', authMiddleware, getReportById);
router.delete('/:type/:id', authMiddleware, deleteReport);

export default router;
