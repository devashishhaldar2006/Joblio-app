const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const {
  searchJobs,
  getHistory,
  getHistoryById,
  bookmarkJob,
  getBookmarks,
  updateBookmarkStatus,
  deleteBookmark
} = require('../controllers/jobController');

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/search', authMiddleware, upload.single('resume'), searchJobs);
router.get('/history', authMiddleware, getHistory);
router.get('/history/:id', authMiddleware, getHistoryById);

// Bookmarking & Tracking
router.post('/bookmark', authMiddleware, bookmarkJob);
router.get('/bookmarks', authMiddleware, getBookmarks);
router.patch('/bookmark/:id/status', authMiddleware, updateBookmarkStatus);
router.delete('/bookmark/:id', authMiddleware, deleteBookmark);

module.exports = router;
