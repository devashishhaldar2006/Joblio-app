const express = require('express');
const router = express.Router();
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const { getContests, getPersonalizedContests } = require('../controllers/contestController');

// Public route (no auth required)
router.get('/', getContests);

// Personalized recommendation route (supports both auth and guest)
router.post('/personalized', optionalAuthMiddleware, getPersonalizedContests);

module.exports = router;
