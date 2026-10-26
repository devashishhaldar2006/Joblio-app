import { Router } from 'express';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import {
  findOpportunities,
  guideThroughIssue,
  reviewCode,
  getHistory,
  bookmarkIssue
} from '../controllers/opensourceController.js';

const router = Router();

router.post('/find', optionalAuthMiddleware, findOpportunities);
router.post('/guide', optionalAuthMiddleware, guideThroughIssue);
router.post('/review', optionalAuthMiddleware, reviewCode);
router.get('/history', optionalAuthMiddleware, getHistory);
router.post('/bookmark', optionalAuthMiddleware, bookmarkIssue);

export default router;
