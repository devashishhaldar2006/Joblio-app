import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createDailyQuotaMiddleware } from '../middleware/quotaMiddleware.js';
import {
  searchJobs,
  getHistory,
  getHistoryById,
  bookmarkJob,
  getBookmarks,
  updateBookmarkStatus,
  deleteBookmark
} from '../controllers/jobController.js';

const router = Router();

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Protect AI resume job matching with daily quota (15 searches per day per user)
const jobSearchQuota = createDailyQuotaMiddleware(15, 'Resume Job Matches');

router.post('/search', authMiddleware, jobSearchQuota, upload.single('resume'), searchJobs);
router.get('/history', authMiddleware, getHistory);
router.get('/history/:id', authMiddleware, getHistoryById);

// Bookmarking & Tracking
router.post('/bookmark', authMiddleware, bookmarkJob);
router.get('/bookmarks', authMiddleware, getBookmarks);
router.patch('/bookmark/:id/status', authMiddleware, updateBookmarkStatus);
router.delete('/bookmark/:id', authMiddleware, deleteBookmark);

export default router;
