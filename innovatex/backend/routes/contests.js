const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getContests, getPersonalizedContests } = require('../controllers/contestController');

// Public route (no auth required)
router.get('/', getContests);

// Personalized recommendation route (auth required)
router.post('/personalized', authMiddleware, getPersonalizedContests);

module.exports = router;
