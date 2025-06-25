const express = require('express');
const { authenticateTokenWithRetry } = require('../middleware/authMiddleware');
const { checkIn, checkOut, getClientLocation, getHistory, getTotalWorkingHours } = require('../controllers/CheckinController');

const router = express.Router();

// Check-in route
router.post('/', authenticateTokenWithRetry, checkIn);
// Check-out route
router.post('/checkout', authenticateTokenWithRetry, checkOut);
// Get client location
router.get('/clients/:clientId/location', authenticateTokenWithRetry, getClientLocation);
// Get check-in history
router.get('/history', authenticateTokenWithRetry, getHistory);
// Get working hours
router.get('/working-hours', authenticateTokenWithRetry, getTotalWorkingHours);

module.exports = router;
