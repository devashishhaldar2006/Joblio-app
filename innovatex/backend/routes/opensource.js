const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const {
  findOpportunities,
  guideThroughIssue,
  reviewCode,
  getHistory,
  bookmarkIssue
} = require('../controllers/opensourceController');

router.post('/find', optionalAuthMiddleware, findOpportunities);
router.post('/guide', optionalAuthMiddleware, guideThroughIssue);
router.post('/review', optionalAuthMiddleware, reviewCode);
router.get('/history', optionalAuthMiddleware, getHistory);
router.post('/bookmark', optionalAuthMiddleware, bookmarkIssue);

module.exports = router;

