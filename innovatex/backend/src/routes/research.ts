import { Router } from 'express';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { explainPaper, getHistory } from '../controllers/researchController.js';

const router = Router();

router.post('/explain', optionalAuthMiddleware, explainPaper);
router.get('/history', optionalAuthMiddleware, getHistory);

export default router;
