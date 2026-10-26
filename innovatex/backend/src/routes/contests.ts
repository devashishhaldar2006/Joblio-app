import { Router } from 'express';
import { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { getContests, getPersonalizedContests } from '../controllers/contestController.js';

const router = Router();

// Public route (no auth required)
router.get('/', getContests);

// Personalized recommendation route (supports both auth and guest)
router.post('/personalized', optionalAuthMiddleware, getPersonalizedContests);

export default router;
