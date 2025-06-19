const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getProducts,
  getProductsForClient,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authenticateToken);

// Get all products
router.get('/', getProducts);

// Get products for a specific client with their discount applied
router.get('/client/:clientId', getProductsForClient);

// Create a new product
router.post('/', createProduct);

// Update a product
router.put('/:id', updateProduct);

// Delete a product
router.delete('/:id', deleteProduct);

module.exports = router;
