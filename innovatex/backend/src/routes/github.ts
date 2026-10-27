import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createDailyQuotaMiddleware } from '../middleware/quotaMiddleware.js';
import {
  analyzeGithub,
  getLatestAnalysis,
  getHistory,
  updateState,
  generateAIFix,
  askAICommand
} from '../controllers/githubController.js';

const router = Router();

const githubAuditQuota = createDailyQuotaMiddleware(10, 'GitHub Profile Audits');
const githubFixQuota = createDailyQuotaMiddleware(15, 'AI Workflow & Readme Generations');

router.post('/analyze', authMiddleware, githubAuditQuota, analyzeGithub);
router.get('/latest', authMiddleware, getLatestAnalysis);
router.get('/history', authMiddleware, getHistory);
router.patch('/state', authMiddleware, updateState);
router.post('/ai-generate', authMiddleware, githubFixQuota, generateAIFix);
router.post('/ai-ask', authMiddleware, githubFixQuota, askAICommand);

export default router;
