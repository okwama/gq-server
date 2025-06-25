const express = require('express');
const router = express.Router();
const { getAllNotices, getNoticeById } = require('../controllers/noticeBoardController');
const { authenticateTokenWithRetry } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateTokenWithRetry);

router.get('/', getAllNotices);
router.get('/:id', getNoticeById);

module.exports = router;
