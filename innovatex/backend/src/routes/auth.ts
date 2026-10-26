import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getProfile, updateProfile, syncClerkUser, completeOnboarding } from '../controllers/authController.js';

const router = Router();

// Clerk Session Synchronization
router.post('/sync', authMiddleware, syncClerkUser);

// Developer Profile Management (secured with Clerk Auth)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/onboarding', authMiddleware, completeOnboarding);

export default router;
