const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { analyzeGithub, getHistory } = require('../controllers/githubController');

router.post('/analyze', authMiddleware, analyzeGithub);
router.get('/history', authMiddleware, getHistory);

module.exports = router;
