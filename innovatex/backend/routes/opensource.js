const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { findOpportunities, guideThroughIssue, reviewCode } = require('../controllers/opensourceController');

router.post('/find', authMiddleware, findOpportunities);
router.post('/guide', authMiddleware, guideThroughIssue);
router.post('/review', authMiddleware, reviewCode);

module.exports = router;
