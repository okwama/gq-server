const express = require('express');
const router = express.Router();
const clientStockController = require('../controllers/clientStockController');
const { authenticateTokenWithRetry } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateTokenWithRetry);

// POST /api/client-stock - Update client stock (create or update)
router.post('/', clientStockController.updateClientStock);

// GET /api/client-stock/:clientId - Get stock for a specific client
router.get('/:clientId', clientStockController.getClientStock);

module.exports = router; 