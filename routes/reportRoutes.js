const express = require('express');
const router = express.Router();
const { authenticateTokenWithRetry } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.use(authenticateTokenWithRetry);

router.post('/', reportController.createReport);
router.get('/', reportController.getAllReports);
router.get('/:id', reportController.getReportById);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);

module.exports = router;
