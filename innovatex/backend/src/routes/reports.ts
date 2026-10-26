import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getAllReports,
  getReportById,
  deleteReport
} from '../controllers/reportController.js';

const router = Router();

router.get('/', authMiddleware, getAllReports);
router.get('/:type/:id', authMiddleware, getReportById);
router.delete('/:type/:id', authMiddleware, deleteReport);

export default router;
