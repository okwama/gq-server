const prisma = require('../lib/prisma');

// Create a new uplift sale
exports.createUpliftSale = async (req, res) => {
  try {
    console.log('[UpliftSale] Received request body:', req.body);
    const { clientId, userId, items } = req.body;

    // Validate required fields
    if (!clientId || !userId || !items || !Array.isArray(items) || items.length === 0) {
      console.log('[UpliftSale] Validation failed:', { clientId, userId, items });
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: clientId, userId, and items are required' 
      });
    }

    console.log('[UpliftSale] Looking up client and sales rep:', { clientId, userId });
    // Verify client and sales rep exist
    const [client, salesRep] = await Promise.all([
      prisma.clients.findUnique({ where: { id: clientId } }),
      prisma.salesRep.findUnique({ where: { id: userId } })
    ]);

    console.log('[UpliftSale] Found client:', client);
    console.log('[UpliftSale] Found salesRep:', salesRep);

    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: 'Client not found' 
      });
    }

    if (!salesRep) {
      return res.status(404).json({ 
        success: false,
        message: 'Sales representative not found' 
      });
    }

    // Create the uplift sale with items in a transaction
    const upliftSale = await prisma.$transaction(async (tx) => {
      console.log('[UpliftSale] Creating sale record');
      // Create the uplift sale
      const sale = await tx.upliftSale.create({
        data: {
          clientId,
          userId,
          status: 'pending',
          totalAmount: 0 // Will be calculated from items
        }
      });

      console.log('[UpliftSale] Created sale:', sale);

      // Create sale items and calculate total
      let totalAmount = 0;
      const saleItems = await Promise.all(items.map(async (item) => {
        console.log('[UpliftSale] Processing item:', item);
        
        // Find the client's stock for the product
        const clientStock = await tx.clientStock.findUnique({
          where: {
            clientId_productId: {
              clientId: clientId,
              productId: item.productId,
            },
          },
        });

        if (!clientStock || clientStock.quantity < item.quantity) {
          const available = clientStock?.quantity || 0;
          const requested = item.quantity;
          throw new Error(`Insufficient stock for product ID ${item.productId}. Available: ${available}, Requested: ${requested}. Please add stock before proceeding with the sale.`);
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        const itemTotal = item.unitPrice * item.quantity;
        totalAmount += itemTotal;

        // Deduct stock from ClientStock
        await tx.clientStock.update({
          where: {
            clientId_productId: {
              clientId: clientId,
              productId: item.productId,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        const saleItem = await tx.upliftSaleItem.create({
          data: {
            upliftSaleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: itemTotal
          }
        });
        console.log('[UpliftSale] Created sale item:', saleItem);

        return saleItem;
      }));

      console.log('[UpliftSale] Updating total amount:', totalAmount);
      // Update total amount
      await tx.upliftSale.update({
        where: { id: sale.id },
        data: { totalAmount }
      });

      return {
        ...sale,
        items: saleItems
      };
    }, {
      timeout: 10000 // 10 seconds, in milliseconds
    });

    console.log('[UpliftSale] Successfully created sale:', upliftSale);
    res.status(201).json({
      success: true,
      message: 'Uplift sale created successfully',
      data: upliftSale
    });
  } catch (error) {
    console.error('[UpliftSale] Error creating uplift sale:', error);
    console.error('[UpliftSale] Error stack:', error.stack);
    
    // Handle insufficient stock error specifically
    if (error.message.includes('Not enough stock')) {
      return res.status(400).json({ 
        success: false,
        message: 'Insufficient stock',
        error: error.message,
        type: 'INSUFFICIENT_STOCK'
      });
    }
    
    // Handle other validation errors
    if (error.message.includes('not found')) {
      return res.status(404).json({ 
        success: false,
        message: 'Resource not found',
        error: error.message
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating uplift sale',
      error: error.message 
    });
  }
};

// Get uplift sales with optional filters
exports.getUpliftSales = async (req, res) => {
  try {
    const { status, startDate, endDate, clientId, userId } = req.query;
    
    const where = {};
    
    if (status) where.status = status;
    if (clientId) where.clientId = parseInt(clientId);
    if (userId) where.userId = parseInt(userId);
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const upliftSales = await prisma.upliftSale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        client: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: upliftSales
    });
  } catch (error) {
    console.error('Error fetching uplift sales:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching uplift sales',
      error: error.message 
    });
  }
};

// Get a single uplift sale by ID
exports.getUpliftSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const upliftSale = await prisma.upliftSale.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true
          }
        },
        client: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!upliftSale) {
      return res.status(404).json({ 
        success: false,
        message: 'Uplift sale not found' 
      });
    }

    res.json({
      success: true,
      data: upliftSale
    });
  } catch (error) {
    console.error('Error fetching uplift sale:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching uplift sale',
      error: error.message 
    });
  }
};

// Update uplift sale status
exports.updateUpliftSaleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const upliftSale = await prisma.upliftSale.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true // Include items to revert stock if voided
      }
    });

    if (!upliftSale) {
      return res.status(404).json({
        success: false,
        message: 'Uplift sale not found'
      });
    }

    // If the sale is being voided, revert the stock
    if (status === 'voided' && upliftSale.status !== 'voided') {
      const updatedSale = await prisma.$transaction(async (tx) => {
        // Restore stock for each item
        for (const item of upliftSale.items) {
          await tx.clientStock.update({
            where: {
              clientId_productId: {
                clientId: upliftSale.clientId,
                productId: item.productId,
              },
            },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }

        // Update the sale status to 'voided'
        return tx.upliftSale.update({
          where: { id: parseInt(id) },
          data: { status: 'voided' }
        });
      });

      return res.json({
        success: true,
        message: 'Status updated to voided and stock reverted',
        data: updatedSale
      });
    } else {
      const updatedSale = await prisma.upliftSale.update({
        where: { id: parseInt(id) },
        data: { status }
      });

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: updatedSale
      });
    }
  } catch (error) {
    console.error('Error updating uplift sale status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating uplift sale status',
      error: error.message
    });
  }
};

// Delete an uplift sale
exports.deleteUpliftSale = async (req, res) => {
  try {
    const { id } = req.params;
    
    const upliftSale = await prisma.upliftSale.findUnique({
      where: { id: parseInt(id) }
    });

    if (!upliftSale) {
      return res.status(404).json({ 
        success: false,
        message: 'Uplift sale not found' 
      });
    }

    // Delete associated items first
    await prisma.upliftSaleItem.deleteMany({
      where: { upliftSaleId: parseInt(id) }
    });
    
    // Then delete the sale
    await prisma.upliftSale.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ 
      success: true,
      message: 'Uplift sale deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting uplift sale:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting uplift sale',
      error: error.message 
    });
  }
};

// Get uplift sales by user ID
exports.getUpliftSalesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    const where = {
      userId: parseInt(userId)
    };
    
    // Add optional filters
    if (status) where.status = status;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count for pagination
    const totalCount = await prisma.upliftSale.count({ where });
    const totalPages = Math.ceil(totalCount / take);

    const upliftSales = await prisma.upliftSale.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                unit_cost: true,
                description: true,
                image: true
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            contact: true,
            address: true,
            region: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    });

    res.json({
      success: true,
      data: upliftSales,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching uplift sales by user ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching uplift sales',
      error: error.message 
    });
  }
};
