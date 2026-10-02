const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  analyzeGithub,
  getLatestAnalysis,
  getHistory,
  updateState,
  generateAIFix,
  askAICommand
} = require('../controllers/githubController');

router.post('/analyze', authMiddleware, analyzeGithub);
router.get('/latest', authMiddleware, getLatestAnalysis);
router.get('/history', authMiddleware, getHistory);
router.patch('/state', authMiddleware, updateState);
router.post('/ai-generate', authMiddleware, generateAIFix);
router.post('/ai-ask', authMiddleware, askAICommand);

module.exports = router;
