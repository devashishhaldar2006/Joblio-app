const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { explainPaper, getHistory } = require('../controllers/researchController');

router.post('/explain', authMiddleware, explainPaper);
router.get('/history', authMiddleware, getHistory);

module.exports = router;
