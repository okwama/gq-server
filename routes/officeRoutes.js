const express = require('express');
const { getOffice, createOffice, updateOffice, deleteOffice } = require('../controllers/officeController');
const { authenticateTokenWithRetry } = require('../middleware/authMiddleware');

const router = express.Router();

// Add enhanced authentication middleware to all office routes
router.use(authenticateTokenWithRetry);

// ✅ Fix: Remove the extra "/outlets"
router
  .route('/')
  .get(getOffice) // GET /api/offices
  .post(createOffice); // POST /api/offices

router
  .route('/:id')
  .put(updateOffice) // PUT /api/offices/:id
  .delete(deleteOffice); // DELETE /api/offices/:id

module.exports = router;
