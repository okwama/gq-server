const prisma = require('../lib/prisma');
const multer = require('multer');
const path = require('path');
const { uploadFile } = require('../lib/uploadService');

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  },
}).single('image');

// Ensure userId is not null
const getUserId = (req) => {
  if (!req.user || !req.user.id) {
    throw new Error('User authentication required');
  }
  return req.user.id;
};

// Helper function to calculate discounted price
const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
  if (!discountPercentage || discountPercentage <= 0) {
    return originalPrice;
  }
  
  const discount = originalPrice * (discountPercentage / 100);
  return Math.max(0, originalPrice - discount);
};

// Helper function to apply client discount to price options
const applyClientDiscount = (priceOptions, clientDiscountPercentage) => {
  if (!clientDiscountPercentage || clientDiscountPercentage <= 0) {
    return priceOptions;
  }

  return priceOptions.map(option => ({
    ...option,
    originalValue: option.value,
    value: calculateDiscountedPrice(option.value, clientDiscountPercentage),
    discountPercentage: clientDiscountPercentage
  }));
};

// Helper function to create fallback price options from unit_cost
const createFallbackPriceOptions = (unitCost, discountPercentage) => {
  const originalPrice = parseFloat(unitCost) || 0;
  const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercentage);
  
  return [{
    id: null,
    option: "Standard Price",
    originalValue: originalPrice,
    value: discountedPrice,
    discountPercentage: discountPercentage,
    isFallback: true
  }];
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { page = 1, limit = 10, clientId } = req.query;

    console.log('[Debug] getProducts called with params:', {
      page,
      limit,
      clientId,
      userId
    });

    // Get products with pagination
    const products = await prisma.product.findMany({
      include: {
        client: true,
        orderItems: true,
        storeQuantities: true,
        purchaseHistory: true
      },
      orderBy: {
        name: 'asc',
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    console.log('[Debug] Found products:', products.length);

    // Get client discount once if clientId is provided
    let clientDiscount = null;
    if (clientId) {
      clientDiscount = await prisma.clients.findUnique({
        where: { id: parseInt(clientId) },
        select: { 
          id: true, 
          name: true, 
          discountPercentage: true,
          status: true 
        }
      });
      
      if (clientDiscount) {
        console.log(`[Debug] Using query client discount: ${clientDiscount.name} (${clientDiscount.discountPercentage}%)`);
      } else {
        console.log(`[Debug] Client ${clientId} not found, using product's client discount`);
      }
    }

    // Batch fetch all categories with price options
    const categoryIds = [...new Set(products.map(p => p.category_id))];
    const categoriesWithPriceOptions = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      include: { priceOptions: true }
    });
    
    const categoriesById = Object.fromEntries(
      categoriesWithPriceOptions.map(cat => [cat.id, cat])
    );

    // Batch fetch all store quantities
    const productIds = products.map(p => p.id);
    const allStoreQuantities = await prisma.storeQuantity.findMany({
      where: { productId: { in: productIds } },
      include: { store: true }
    });
    
    const storeQuantitiesByProductId = {};
    allStoreQuantities.forEach(sq => {
      if (!storeQuantitiesByProductId[sq.productId]) {
        storeQuantitiesByProductId[sq.productId] = [];
      }
      storeQuantitiesByProductId[sq.productId].push(sq);
    });

    console.log('[Debug] Batch fetched data:', {
      categories: categoriesWithPriceOptions.length,
      totalStoreQuantities: allStoreQuantities.length
    });

    // Process products with batch data
    const productsWithPriceOptions = products.map(product => {
      const categoryWithPriceOptions = categoriesById[product.category_id];
      const storeQuantities = storeQuantitiesByProductId[product.id] || [];

      // Get discount percentage
      let discountPercentage = 0;
      let clientInfo = null;
      
      if (clientDiscount) {
        // Use the query client's discount
        discountPercentage = clientDiscount.discountPercentage || 0;
        clientInfo = {
          id: clientDiscount.id,
          name: clientDiscount.name,
          discountPercentage: discountPercentage
        };
      } else if (product.client) {
        // Use the product's associated client's discount
        discountPercentage = product.client.discountPercentage || 0;
        clientInfo = {
          id: product.client.id,
          name: product.client.name,
          discountPercentage: discountPercentage
        };
      }

      // Apply client discount to price options or create fallback pricing
      let discountedPriceOptions = [];
      
      if (categoryWithPriceOptions?.priceOptions && categoryWithPriceOptions.priceOptions.length > 0) {
        // Use existing price options with discount
        discountedPriceOptions = applyClientDiscount(
          categoryWithPriceOptions.priceOptions,
          discountPercentage
        );
        
        console.log(`[Debug] Product ${product.name}: Using ${categoryWithPriceOptions.priceOptions.length} price options with ${discountPercentage}% discount`);
        
        // Log details for each price option
        discountedPriceOptions.forEach((option, index) => {
          console.log(`  - Price Option ${index + 1}: ${option.option}`);
          console.log(`    Original: $${option.originalValue.toFixed(2)}`);
          console.log(`    Discount: ${option.discountPercentage}%`);
          console.log(`    Final: $${option.value.toFixed(2)}`);
        });
      } else {
        // Create fallback pricing using unit_cost
        discountedPriceOptions = createFallbackPriceOptions(
          product.unit_cost,
          discountPercentage
        );
        
        const originalPrice = parseFloat(product.unit_cost) || 0;
        const discountAmount = originalPrice * (discountPercentage / 100);
        const finalPrice = originalPrice - discountAmount;
        
        console.log(`[Debug] Product ${product.name}:`);
        console.log(`  - Original Price: $${originalPrice.toFixed(2)}`);
        console.log(`  - Discount Percentage: ${discountPercentage}%`);
        console.log(`  - Discount Amount: $${discountAmount.toFixed(2)}`);
        console.log(`  - Final Price: $${finalPrice.toFixed(2)}`);
        console.log(`  - Using fallback pricing (unit_cost: ${product.unit_cost})`);
      }

      return {
        ...product,
        priceOptions: discountedPriceOptions,
        storeQuantities: storeQuantities,
        appliedDiscountPercentage: discountPercentage,
        clientInfo: clientInfo
      };
    });

    // Get total count for pagination
    const totalProducts = await prisma.product.count();

    console.log('[Debug] Final response:', {
      totalProducts,
      returnedProducts: productsWithPriceOptions.length,
      clientId: clientId || 'none',
      discountApplied: productsWithPriceOptions.some(p => p.appliedDiscountPercentage > 0)
    });

    res.status(200).json({
      success: true,
      data: productsWithPriceOptions,
      pagination: {
        total: totalProducts,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalProducts / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    
    if (error.message === 'User authentication required') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get products for a specific client with their discount applied
const getProductsForClient = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { clientId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Get client with discount percentage
    const client = await prisma.clients.findUnique({
      where: { id: parseInt(clientId) },
      select: { 
        id: true, 
        name: true, 
        discountPercentage: true,
        status: true 
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (client.status !== 0) {
      return res.status(400).json({ error: 'Client is inactive' });
    }

    // Get products with pagination
    const products = await prisma.product.findMany({
      include: {
        client: true,
        orderItems: true,
        storeQuantities: true,
        purchaseHistory: true
      },
      orderBy: {
        name: 'asc',
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    // Get price options for the category_id of each product
    const productsWithPriceOptions = await Promise.all(products.map(async (product) => {
      const categoryWithPriceOptions = await prisma.category.findUnique({
        where: { id: product.category_id },
        include: {
          priceOptions: true
        }
      });

      // Get store quantities for this product
      const storeQuantities = await prisma.storeQuantity.findMany({
        where: { productId: product.id },
        include: {
          store: true
        }
      });

      // Apply the specified client's discount to price options or create fallback pricing
      let discountedPriceOptions = [];
      
      if (categoryWithPriceOptions?.priceOptions && categoryWithPriceOptions.priceOptions.length > 0) {
        // Use existing price options with discount
        discountedPriceOptions = applyClientDiscount(
          categoryWithPriceOptions.priceOptions,
          client.discountPercentage
        );
      } else {
        // Create fallback pricing using unit_cost
        discountedPriceOptions = createFallbackPriceOptions(
          product.unit_cost,
          client.discountPercentage
        );
      }

      return {
        ...product,
        priceOptions: discountedPriceOptions,
        storeQuantities: storeQuantities,
        appliedDiscountPercentage: client.discountPercentage,
        clientInfo: {
          id: client.id,
          name: client.name,
          discountPercentage: client.discountPercentage
        }
      };
    }));

    // Get total count for pagination
    const totalProducts = await prisma.product.count();

    res.status(200).json({
      success: true,
      data: productsWithPriceOptions,
      clientInfo: {
        id: client.id,
        name: client.name,
        discountPercentage: client.discountPercentage
      },
      pagination: {
        total: totalProducts,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalProducts / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching products for client:', error);
    
    if (error.message === 'User authentication required') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch products for client',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a new product
const createProduct = async (req, res) => {
  // Handle file upload first
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const {
        name,
        description,
        category_id,
        category,
        currentStock,
        clientId,
      } = req.body;
      const userId = getUserId(req);

      // Input validation
      if (!name) {
        return res.status(400).json({ error: 'Missing required field: name' });
      }

      if (!clientId) {
        return res.status(400).json({ error: 'Missing required field: clientId' });
      }

      // Check if client exists
      const client = await prisma.clients.findUnique({
        where: { id: parseInt(clientId) },
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Upload image if present
      let imageUrl = null;
      let thumbnailUrl = null;
      
      if (req.file) {
        try {
          const result = await uploadFile(req.file, {
            folder: 'products',
            type: 'product',
            generateThumbnail: true
          });
          imageUrl = result.main.url;
          thumbnailUrl = result.thumbnail?.url;
        } catch (error) {
          return res.status(500).json({ error: 'Image upload failed' });
        }
      }

      // Create the product
      const product = await prisma.product.create({
        data: {
          name,
          description,
          category_id: parseInt(category_id),
          category,
          currentStock: parseInt(currentStock) || 0,
          clientId: parseInt(clientId),
          image: imageUrl,
          thumbnailUrl: thumbnailUrl,
        },
        include: {
          client: true,
          orderItems: true,
          storeQuantities: true,
          purchase: true,
          purchaseHistory: true
        },
      });

      console.log('Product created successfully:', product);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });
};

// Update a product
const updateProduct = async (req, res) => {
  // Handle file upload first
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    try {
      const { id } = req.params;
      const {
        name,
        description,
        category_id,
        category,
        currentStock,
        clientId,
      } = req.body;
      const userId = getUserId(req);

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Upload image if present
      let imageUrl = null;
      let thumbnailUrl = null;
      
      if (req.file) {
        try {
          const result = await uploadFile(req.file, {
            folder: 'products',
            type: 'product',
            generateThumbnail: true
          });
          imageUrl = result.main.url;
          thumbnailUrl = result.thumbnail?.url;
        } catch (error) {
          return res.status(500).json({ error: 'Image upload failed' });
        }
      }

      // Update the product
      const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          name: name || existingProduct.name,
          description: description || existingProduct.description,
          category_id: category_id ? parseInt(category_id) : existingProduct.category_id,
          category: category || existingProduct.category,
          currentStock: currentStock ? parseInt(currentStock) : existingProduct.currentStock,
          clientId: clientId ? parseInt(clientId) : existingProduct.clientId,
          image: imageUrl || existingProduct.image,
          thumbnailUrl: thumbnailUrl || existingProduct.thumbnailUrl,
        },
        include: {
          client: true,
          orderItems: true,
          storeQuantities: true,
          purchase: true,
          purchaseHistory: true
        },
      });

      console.log('Product updated successfully:', product);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      
      if (error.message === 'User authentication required') {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      res.status(500).json({ 
        error: 'Failed to update product',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    // Input validation
    if (!id) {
      return res.status(400).json({ error: 'Missing required field: id' });
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete the product
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    console.log('Product deleted successfully:', id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    
    if (error.message === 'User authentication required') {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getProducts,
  getProductsForClient,
  createProduct,
  updateProduct,
  deleteProduct,
}; 