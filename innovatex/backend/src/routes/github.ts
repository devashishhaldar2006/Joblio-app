import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  analyzeGithub,
  getLatestAnalysis,
  getHistory,
  updateState,
  generateAIFix,
  askAICommand
} from '../controllers/githubController.js';

const router = Router();

router.post('/analyze', authMiddleware, analyzeGithub);
router.get('/latest', authMiddleware, getLatestAnalysis);
router.get('/history', authMiddleware, getHistory);
router.patch('/state', authMiddleware, updateState);
router.post('/ai-generate', authMiddleware, generateAIFix);
router.post('/ai-ask', authMiddleware, askAICommand);

export default router;
