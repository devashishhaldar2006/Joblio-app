const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllReports,
  getReportById,
  deleteReport
} = require('../controllers/reportController');

router.get('/', authMiddleware, getAllReports);
router.get('/:type/:id', authMiddleware, getReportById);
router.delete('/:type/:id', authMiddleware, deleteReport);

module.exports = router;
