const express = require('express');
const { authenticateTokenWithRetry } = require('../middleware/authMiddleware');
const {  createOrder, getOrders, updateOrder, getUserSalesSummary, requestOrderVoid, checkVoidStatus } = require('../controllers/orderController');

const router = express.Router();

router.use(authenticateTokenWithRetry);

router.post('/', createOrder);
router.get('/', getOrders);
router.put('/:id', updateOrder);
router.get('/sales-summary', getUserSalesSummary);

router.post('/:id/void-request', requestOrderVoid);
router.get('/:id/void-status', checkVoidStatus);

module.exports = router;