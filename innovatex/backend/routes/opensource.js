const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  findOpportunities,
  guideThroughIssue,
  reviewCode,
  getHistory,
  bookmarkIssue
} = require('../controllers/opensourceController');

router.post('/find', authMiddleware, findOpportunities);
router.post('/guide', authMiddleware, guideThroughIssue);
router.post('/review', authMiddleware, reviewCode);
router.get('/history', authMiddleware, getHistory);
router.post('/bookmark', authMiddleware, bookmarkIssue);

module.exports = router;

