const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const {
  forecastSkill,
  getTrending,
  getSnapshot,
  getGapReport,
  getSkillHistory
} = require('../controllers/marketController');

// Public endpoints
router.get('/trending', getTrending);
router.get('/snapshot', getSnapshot);
router.get('/history/:skill', getSkillHistory);

// Forecast supports both authenticated users and guests
router.post('/forecast', optionalAuthMiddleware, forecastSkill);

// Gap report requires authentication
router.post('/gap-report', authMiddleware, getGapReport);

module.exports = router;

