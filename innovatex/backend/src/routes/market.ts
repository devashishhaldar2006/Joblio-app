import { Router } from 'express';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import {
  forecastSkill,
  getTrending,
  getSnapshot,
  getGapReport,
  getSkillHistory
} from '../controllers/marketController.js';

const router = Router();

// Public endpoints
router.get('/trending', getTrending);
router.get('/snapshot', getSnapshot);
router.get('/history/:skill', getSkillHistory);

// Forecast supports both authenticated users and guests
router.post('/forecast', optionalAuthMiddleware, forecastSkill);

// Gap report supports both authenticated users and guests
router.post('/gap-report', optionalAuthMiddleware, getGapReport);

export default router;
