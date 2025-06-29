const express = require('express');
const { authenticateTokenWithRetry } = require('../middleware/authMiddleware');
const { recordLogin, recordLogout, getSessionHistory } = require('../controllers/sessionController');

const router = express.Router();

// Record login - no authentication required
router.post('/login',  recordLogin);

// Protect all other routes with enhanced authentication middleware
router.use(authenticateTokenWithRetry);

// Record logout
router.post('/logout', recordLogout);

// Get session history
router.get('/history/:userId', getSessionHistory);

module.exports = router; 