const express = require('express');
const { getOutlets, createOutlet, updateOutlet, getOutletProducts, getOutletLocation, addClientPayment, getClientPayments, updateOutletLocation, updateClientDiscount, getClientDiscount } = require('../controllers/outletController');
const { authenticateTokenWithRetry } = require('../middleware/authMiddleware');

const router = express.Router();

// Add enhanced authentication middleware to all outlet routes
router.use(authenticateTokenWithRetry);

// ✅ Fix: Remove the extra "/outlets"
router
  .route('/')
  .get(getOutlets) // GET /api/outlets
  .post(createOutlet); // POST /api/outlets

router
  .route('/:id')
  .get(getOutletLocation) // GET /api/outlets/:id
  .put(updateOutlet); // PUT /api/outlets/:id

router
  .route('/:id/location')
  .patch(updateOutletLocation); // PATCH /api/outlets/:id/location

router
  .route('/:id/products')
  .get(getOutletProducts); // GET /api/outlets/:id/products

router
  .route('/:id/payments')
  .post(addClientPayment) // POST /api/outlets/:id/payments
  .get(getClientPayments); // GET /api/outlets/:id/payments

router
  .route('/:id/discount')
  .get(getClientDiscount) // GET /api/outlets/:id/discount
  .put(updateClientDiscount); // PUT /api/outlets/:id/discount

module.exports = router;
