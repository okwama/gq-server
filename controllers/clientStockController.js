const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Feature flag to enable/disable client stock functionality
const CLIENT_STOCK_ENABLED = process.env.CLIENT_STOCK_ENABLED !== 'false'; // Default: enabled

// Get all client stock entries with optional filters
exports.getClientStock = async (req, res) => {
  try {
    // Check if feature is enabled
    if (!CLIENT_STOCK_ENABLED) {
      return res.status(403).json({
        success: false,
        message: 'Client stock feature is currently disabled'
      });
    }

    const { clientId, productId, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (clientId) where.clientId = parseInt(clientId);
    if (productId) where.productId = parseInt(productId);
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [clientStock, total] = await Promise.all([
      prisma.clientStock.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              contact: true,
              address: true,
              region: true
            }
          },
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
        },
        orderBy: {
          id: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.clientStock.count({ where })
    ]);

    res.json({
      success: true,
      data: clientStock,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching client stock:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching client stock',
      error: error.message 
    });
  }
};

// Get client stock by ID
exports.getClientStockById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const clientStock = await prisma.clientStock.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            contact: true,
            address: true,
            region: true,
            balance: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unit_cost: true,
            description: true,
            image: true,
            currentStock: true
          }
        }
      }
    });

    if (!clientStock) {
      return res.status(404).json({ 
        success: false,
        message: 'Client stock entry not found' 
      });
    }

    res.json({
      success: true,
      data: clientStock
    });
  } catch (error) {
    console.error('Error fetching client stock:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching client stock',
      error: error.message 
    });
  }
};

// Get stock for a specific client
exports.getClientStockByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [clientStock, total] = await Promise.all([
      prisma.clientStock.findMany({
        where: { clientId: parseInt(clientId) },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              unit_cost: true,
              description: true,
              image: true,
              currentStock: true
            }
          }
        },
        orderBy: {
          id: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.clientStock.count({ 
        where: { clientId: parseInt(clientId) } 
      })
    ]);

    res.json({
      success: true,
      data: clientStock,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching client stock:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching client stock',
      error: error.message 
    });
  }
};

// Create or update client stock
exports.upsertClientStock = async (req, res) => {
  try {
    const { clientId, productId, quantity } = req.body;

    // Validation
    if (!clientId || !productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'clientId, productId, and quantity are required'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    // Verify client and product exist
    const [client, product] = await Promise.all([
      prisma.clients.findUnique({ where: { id: parseInt(clientId) } }),
      prisma.product.findUnique({ where: { id: parseInt(productId) } })
    ]);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Upsert client stock (create if doesn't exist, update if exists)
    const clientStock = await prisma.clientStock.upsert({
      where: {
        clientId_productId: {
          clientId: parseInt(clientId),
          productId: parseInt(productId)
        }
      },
      update: {
        quantity: parseInt(quantity)
      },
      create: {
        clientId: parseInt(clientId),
        productId: parseInt(productId),
        quantity: parseInt(quantity)
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            contact: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unit_cost: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Client stock updated successfully',
      data: clientStock
    });
  } catch (error) {
    console.error('Error upserting client stock:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating client stock',
      error: error.message 
    });
  }
};

// Update client stock quantity
exports.updateClientStock = async (req, res) => {
  try {
    // Check if feature is enabled
    if (!CLIENT_STOCK_ENABLED) {
      return res.status(403).json({
        success: false,
        message: 'Client stock feature is currently disabled'
      });
    }

    const { clientId, productId, quantity } = req.body;

    // Validation
    if (!clientId || !productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'clientId, productId, and quantity are required'
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    // Verify client and product exist
    const [client, product] = await Promise.all([
      prisma.clients.findUnique({ where: { id: parseInt(clientId) } }),
      prisma.product.findUnique({ where: { id: parseInt(productId) } })
    ]);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Upsert client stock (create if doesn't exist, update if exists)
    const clientStock = await prisma.clientStock.upsert({
      where: {
        clientId_productId: {
          clientId: parseInt(clientId),
          productId: parseInt(productId)
        }
      },
      update: {
        quantity: parseInt(quantity)
      },
      create: {
        clientId: parseInt(clientId),
        productId: parseInt(productId),
        quantity: parseInt(quantity)
      },
      include: {
        Clients: {
          select: {
            id: true,
            name: true,
            contact: true
          }
        },
        Product: {
          select: {
            id: true,
            name: true,
            category: true,
            unit_cost: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Client stock updated successfully',
      data: clientStock
    });
  } catch (error) {
    console.error('Error updating client stock:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating client stock',
      error: error.message 
    });
  }
};

// Bulk update client stock
exports.bulkUpdateClientStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { clientId, productId, quantity, operation }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required and cannot be empty'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { clientId, productId, quantity, operation = 'set' } = update;

        if (!clientId || !productId || quantity === undefined) {
          errors.push({
            clientId,
            productId,
            error: 'clientId, productId, and quantity are required'
          });
          continue;
        }

        // Find existing stock
        const existingStock = await prisma.clientStock.findUnique({
          where: {
            clientId_productId: {
              clientId: parseInt(clientId),
              productId: parseInt(productId)
            }
          }
        });

        let newQuantity;
        if (existingStock) {
          switch (operation) {
            case 'add':
              newQuantity = existingStock.quantity + parseInt(quantity);
              break;
            case 'subtract':
              newQuantity = existingStock.quantity - parseInt(quantity);
              if (newQuantity < 0) {
                errors.push({
                  clientId,
                  productId,
                  error: 'Cannot subtract more than available quantity'
                });
                continue;
              }
              break;
            case 'set':
            default:
              newQuantity = parseInt(quantity);
              if (newQuantity < 0) {
                errors.push({
                  clientId,
                  productId,
                  error: 'Quantity cannot be negative'
                });
                continue;
              }
              break;
          }

          const updatedStock = await prisma.clientStock.update({
            where: {
              clientId_productId: {
                clientId: parseInt(clientId),
                productId: parseInt(productId)
              }
            },
            data: { quantity: newQuantity }
          });
          results.push(updatedStock);
        } else {
          // Create new stock entry
          if (operation === 'subtract') {
            errors.push({
              clientId,
              productId,
              error: 'Cannot subtract from non-existent stock'
            });
            continue;
          }

          const newStock = await prisma.clientStock.create({
            data: {
              clientId: parseInt(clientId),
              productId: parseInt(productId),
              quantity: parseInt(quantity)
            }
          });
          results.push(newStock);
        }
      } catch (error) {
        errors.push({
          clientId: update.clientId,
          productId: update.productId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} updates successfully`,
      data: {
        successful: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Error bulk updating client stock:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error bulk updating client stock',
      error: error.message 
    });
  }
};

// Delete client stock entry
exports.deleteClientStock = async (req, res) => {
  try {
    const { id } = req.params;

    const clientStock = await prisma.clientStock.findUnique({
      where: { id: parseInt(id) }
    });

    if (!clientStock) {
      return res.status(404).json({
        success: false,
        message: 'Client stock entry not found'
      });
    }

    await prisma.clientStock.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Client stock entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client stock:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting client stock',
      error: error.message 
    });
  }
};

// Get low stock alerts
exports.getLowStockAlerts = async (req, res) => {
  try {
    const { threshold = 10, clientId } = req.query;
    
    const where = {
      quantity: {
        lte: parseInt(threshold)
      }
    };
    
    if (clientId) {
      where.clientId = parseInt(clientId);
    }

    const lowStockItems = await prisma.clientStock.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            contact: true,
            address: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            unit_cost: true,
            currentStock: true
          }
        }
      },
      orderBy: {
        quantity: 'asc'
      }
    });

    res.json({
      success: true,
      data: lowStockItems,
      threshold: parseInt(threshold)
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching low stock alerts',
      error: error.message 
    });
  }
};

// Get stock summary for dashboard
exports.getStockSummary = async (req, res) => {
  try {
    const { clientId } = req.query;
    
    const where = {};
    if (clientId) {
      where.clientId = parseInt(clientId);
    }

    const [totalProducts, totalQuantity, lowStockCount, outOfStockCount] = await Promise.all([
      prisma.clientStock.count({ where }),
      prisma.clientStock.aggregate({
        where,
        _sum: { quantity: true }
      }),
      prisma.clientStock.count({
        where: {
          ...where,
          quantity: {
            lte: 10,
            gt: 0
          }
        }
      }),
      prisma.clientStock.count({
        where: {
          ...where,
          quantity: 0
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalQuantity: totalQuantity._sum.quantity || 0,
        lowStockCount,
        outOfStockCount,
        averageQuantity: totalProducts > 0 ? Math.round((totalQuantity._sum.quantity || 0) / totalProducts) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching stock summary',
      error: error.message 
    });
  }
};

// Get client stock for a specific client
exports.getClientStock = async (req, res) => {
  try {
    // Check if feature is enabled
    if (!CLIENT_STOCK_ENABLED) {
      return res.status(403).json({
        success: false,
        message: 'Client stock feature is currently disabled'
      });
    }

    const { clientId } = req.params;

    const clientStock = await prisma.clientStock.findMany({
      where: { clientId: parseInt(clientId) },
      include: {
        Product: {
          select: {
            id: true,
            name: true,
            category: true,
            unit_cost: true,
            description: true,
            image: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    res.json({
      success: true,
      data: clientStock
    });
  } catch (error) {
    console.error('Error fetching client stock:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching client stock',
      error: error.message 
    });
  }
}; 