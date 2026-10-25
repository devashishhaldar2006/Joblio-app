const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const { explainPaper, getHistory } = require('../controllers/researchController');

router.post('/explain', optionalAuthMiddleware, explainPaper);
router.get('/history', optionalAuthMiddleware, getHistory);

module.exports = router;
