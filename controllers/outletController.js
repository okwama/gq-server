const prisma = require('../lib/prisma');
const multer = require('multer');
const path = require('path');
const ImageKit = require('imagekit');
const { uploadFile } = require('../lib/uploadService');

// Configure ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${ext}. Only JPG, JPEG, PNG, and PDF files are allowed.`));
    }
  }
}).single('image');

// Get all outlets
const getOutlets = async (req, res) => {
  try {
    const { route_id, page = 1, limit = 2000, created_after } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Debug logging
    console.log(`[DEBUG] getOutlets called by user ID: ${req.user.id}, role: ${req.user.role}, countryId: ${req.user.countryId}`);

    let outlets;
    let total;

    // If user is a sales rep, use ClientAssignment table
    if (req.user.role === 'SALES_REP') {
      console.log(`[DEBUG] Sales rep ${req.user.id} fetching outlets...`);
      
      // Get outlets assigned to this sales rep
      const assignedOutlets = await prisma.clientAssignment.findMany({
        where: {
          salesRepId: req.user.id,
          status: 'active'
        },
        include: {
          outlet: {
            select: {
              id: true,
              name: true,
              balance: true,
              address: true,
              latitude: true,
              longitude: true,
              created_at: true,
              discountPercentage: true,
              route_id: true,
              countryId: true,
              status: true
            }
          }
        }
      });

      console.log(`[DEBUG] Found ${assignedOutlets.length} assigned outlets for sales rep ${req.user.id}`);

      // Also get outlets created by this sales rep
      const createdOutlets = await prisma.clients.findMany({
        where: {
          added_by: req.user.id,
          countryId: req.user.countryId,
          status: 0
        },
        select: {
          id: true,
          name: true,
          balance: true,
          address: true,
          latitude: true,
          longitude: true,
          created_at: true,
          discountPercentage: true,
          route_id: true,
          countryId: true,
          status: true
        }
      });

      console.log(`[DEBUG] Found ${createdOutlets.length} created outlets for sales rep ${req.user.id}`);

      // Combine and deduplicate outlets
      const assignedOutletIds = new Set(assignedOutlets.map(a => a.outlet.id));
      const allOutlets = [
        ...assignedOutlets.map(a => a.outlet),
        ...createdOutlets.filter(o => !assignedOutletIds.has(o.id))
      ];

      console.log(`[DEBUG] Total unique outlets for sales rep ${req.user.id}: ${allOutlets.length}`);

      // Apply additional filters
      let filteredOutlets = allOutlets.filter(outlet => {
        if (route_id && outlet.route_id !== parseInt(route_id)) return false;
        if (created_after && outlet.created_at <= new Date(created_after)) return false;
        return true;
      });

      console.log(`[DEBUG] After filtering, sales rep ${req.user.id} gets ${filteredOutlets.length} outlets`);

      total = filteredOutlets.length;
      outlets = filteredOutlets.slice(skip, skip + parseInt(limit));

    } else {
      console.log(`[DEBUG] Manager/Admin ${req.user.id} fetching all outlets...`);
      
      // For managers/admins, use the old logic
      const where = {
        countryId: req.user.countryId,
        status: 0
      };
      
      if (route_id) {
        where.route_id = parseInt(route_id);
      }
      if (created_after) {
        where.created_at = {
          gt: new Date(created_after)
        };
      }

      total = await prisma.clients.count({ where });

      outlets = await prisma.clients.findMany({
        where,
        select: {
          id: true,
          name: true,
          balance: true,
          address: true,
          latitude: true,
          longitude: true,
          created_at: true,
          discountPercentage: true,
        },
        skip: Math.max(0, skip),
        take: Math.min(Number(limit), 2000),
        orderBy: [
          { name: 'asc' },
          { id: 'asc' }
        ]
      });

      console.log(`[DEBUG] Manager/Admin ${req.user.id} found ${total} total outlets, returning ${outlets.length}`);
    }

    // Add default value for balance if it's null/undefined
    const outletsWithDefaultBalance = outlets.map(outlet => ({
      ...outlet,
      balance: String(outlet.balance ?? "0"),
      discountPercentage: outlet.discountPercentage || 0,
      created_at: outlet.created_at?.toISOString() ?? null,
    }));

    console.log(`[DEBUG] Final response for user ${req.user.id}: ${outletsWithDefaultBalance.length} outlets`);

    res.json({
      data: outletsWithDefaultBalance,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching outlets:', error);
    res.status(500).json({ error: 'Error fetching outlets' });
  }
};


// Create a new outlet
const createOutlet = async (req, res) => {
  const { 
    name, 
    address, 
    latitude, 
    longitude, 
    balance, 
    email, 
    contact,
    region_id,
    region,
    client_type,
    added_by,
    discountPercentage

  } = req.body;

  // Get route_id from authenticated user
  const route_id = req.user.route_id;

  if (!name || !address) {
    return res.status(400).json({ error: 'Name and address are required' });
  }

  try {
    // Create outlet and assignment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newOutlet = await tx.clients.create({
        data: {
          name,
          address,
          contact,
          client_type: 1,
          ...(balance !== undefined && { balance: balance.toString() }),
          ...(email && { email }),
          tax_pin: req.body.tax_pin || "0",
          location: req.body.location || "Unknown",
          latitude,
          longitude,
          countryId: req.user.countryId,
          region_id: parseInt(region_id),
          region: region || "Unknown",
          route_id: route_id ? parseInt(route_id) : null,
          route_id_update: route_id ? parseInt(route_id) : null,
          route_name_update: req.user.route_name || "Unknown",
          added_by: req.user.id,
          created_at: new Date(),
          discountPercentage: discountPercentage ? parseFloat(discountPercentage) : 0,
        },
      });

      // Create assignment for the sales rep who created the outlet
      await tx.clientAssignment.create({
        data: {
          outletId: newOutlet.id,
          salesRepId: req.user.id,
          status: 'active'
        }
      });

      return newOutlet;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating outlet:', error);
    res.status(500).json({ error: 'Failed to create outlet' });
  }
};


// Update an outlet
const updateOutlet = async (req, res) => {
  const { id } = req.params;
  const { name, address, latitude, longitude, balance, email, contact, tax_pin } = req.body;

  try {
    // First get the current outlet data
    const currentOutlet = await prisma.clients.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentOutlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    // If this is just a location update (only latitude and longitude provided)
    if (Object.keys(req.body).length === 2 && latitude !== undefined && longitude !== undefined) {
      const updatedOutlet = await prisma.clients.update({
        where: { id: parseInt(id) },
        data: {
          latitude,
          longitude,
        },
      });
      return res.status(200).json(updatedOutlet);
    }

    // For full updates, require name and address
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required for full updates' });
    }

    const updatedOutlet = await prisma.clients.update({
      where: { id: parseInt(id) },
      data: {
        name,
        address,
        ...(balance !== undefined && { balance: balance.toString() }),
        ...(email && { email }),
        ...(tax_pin && { tax_pin }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
    });
    res.status(200).json(updatedOutlet);
  } catch (error) {
    console.error('Error updating outlet:', error);
    res.status(500).json({ error: 'Failed to update outlet' });
  }
};

// Update outlet location only
const updateOutletLocation = async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;

  // Validate required fields
  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ 
      error: 'Both latitude and longitude are required for location update' 
    });
  }

  try {
    // First check if outlet exists
    const outlet = await prisma.clients.findUnique({
      where: { id: parseInt(id) }
    });

    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    // Update only location fields
    const updatedOutlet = await prisma.clients.update({
      where: { id: parseInt(id) },
      data: {
        latitude,
        longitude,
      },
    });

    res.status(200).json(updatedOutlet);
  } catch (error) {
    console.error('Error updating outlet location:', error);
    res.status(500).json({ error: 'Failed to update outlet location' });
  }
};

// Get products for a specific outlet
const getOutletProducts = async (req, res) => {
  const { id } = req.params;
  
  try {
    const outlet = await prisma.clients.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }
    
    // Format the response to return just the products
    const products = outlet.products.map(op => ({
      ...op.product,
      quantity: op.quantity
    }));
    
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching outlet products:', error);
    res.status(500).json({ error: 'Failed to fetch outlet products' });
  }
};

// Get outlet location
const getOutletLocation = async (req, res) => {
  const { id } = req.params;
  
  try {
    const outlet = await prisma.clients.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    });
    
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }
    
    res.status(200).json(outlet);
  } catch (error) {
    console.error('Error fetching outlet location:', error);
    res.status(500).json({ error: 'Failed to fetch outlet location' });
  }
};

// Add client payment
const addClientPayment = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { clientId, amount, paymentDate, paymentType } = req.body;

      if (!clientId || !amount || !paymentDate || !paymentType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      let imageUrl = null;
      let thumbnailUrl = null;

      if (req.file) {
        try {
          const result = await uploadFile(req.file, {
            folder: 'whoosh/payments',
            type: 'document',
            generateThumbnail: true
          });
          imageUrl = result.main.url;
          thumbnailUrl = result.thumbnail?.url;
        } catch (error) {
          return res.status(500).json({ error: 'Failed to upload payment document' });
        }
      }

      const payment = await prisma.clientPayment.create({
        data: {
          clientId: parseInt(clientId),
          amount: parseFloat(amount),
          paymentDate: new Date(paymentDate),
          paymentType,
          documentUrl: imageUrl,
          thumbnailUrl: thumbnailUrl,
          addedBy: req.user.id
        }
      });

      res.status(201).json(payment);
    } catch (error) {
      console.error('Error adding payment:', error);
      res.status(500).json({ error: 'Failed to add payment' });
    }
  });
};

// Get client payments
const getClientPayments = async (req, res) => {
  const clientId = parseInt(req.params.id);
  try {
    const payments = await prisma.clientPayment.findMany({
      where: { clientId },
      orderBy: { date: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client payments' });
  }
};

// Update client discount percentage
const updateClientDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountPercentage } = req.body;

    // Validate input
    if (discountPercentage === undefined || discountPercentage === null) {
      return res.status(400).json({ error: 'Discount percentage is required' });
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return res.status(400).json({ error: 'Discount percentage must be between 0 and 100' });
    }

    // Check if client exists and belongs to the user
    const existingClient = await prisma.clients.findFirst({
      where: {
        id: parseInt(id),
        countryId: req.user.countryId,
        ...(req.user.role === 'SALES_REP' && { salesRepId: req.user.id })
      }
    });

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found or unauthorized' });
    }

    // Update the client's discount percentage
    const updatedClient = await prisma.clients.update({
      where: { id: parseInt(id) },
      data: {
        discountPercentage: parseFloat(discountPercentage)
      },
      select: {
        id: true,
        name: true,
        discountPercentage: true,
        balance: true,
        status: true
      }
    });

    res.json({
      success: true,
      message: 'Client discount updated successfully',
      data: {
        ...updatedClient,
        balance: String(updatedClient.balance ?? "0")
      }
    });
  } catch (error) {
    console.error('Error updating client discount:', error);
    res.status(500).json({ error: 'Failed to update client discount' });
  }
};

// Get client discount percentage
const getClientDiscount = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if client exists and belongs to the user
    const client = await prisma.clients.findFirst({
      where: {
        id: parseInt(id),
        countryId: req.user.countryId,
        ...(req.user.role === 'SALES_REP' && { salesRepId: req.user.id })
      },
      select: {
        id: true,
        name: true,
        discountPercentage: true,
        status: true
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found or unauthorized' });
    }

    res.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        discountPercentage: client.discountPercentage || 0,
        status: client.status
      }
    });
  } catch (error) {
    console.error('Error fetching client discount:', error);
    res.status(500).json({ error: 'Failed to fetch client discount' });
  }
};

// Assign outlet to sales rep
const assignOutletToSalesRep = async (req, res) => {
  try {
    const { outletId, salesRepId } = req.body;

    if (!outletId || !salesRepId) {
      return res.status(400).json({ error: 'Outlet ID and Sales Rep ID are required' });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.clientAssignment.findUnique({
      where: {
        outletId_salesRepId: {
          outletId: parseInt(outletId),
          salesRepId: parseInt(salesRepId)
        }
      }
    });

    if (existingAssignment) {
      // Update status to active if it was inactive
      if (existingAssignment.status !== 'active') {
        await prisma.clientAssignment.update({
          where: { id: existingAssignment.id },
          data: { status: 'active' }
        });
      }
      return res.status(200).json({ message: 'Assignment already exists and is now active' });
    }

    // Create new assignment
    const assignment = await prisma.clientAssignment.create({
      data: {
        outletId: parseInt(outletId),
        salesRepId: parseInt(salesRepId),
        status: 'active'
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error assigning outlet:', error);
    res.status(500).json({ error: 'Failed to assign outlet' });
  }
};

// Remove outlet assignment from sales rep
const removeOutletAssignment = async (req, res) => {
  try {
    const { outletId, salesRepId } = req.params;

    const assignment = await prisma.clientAssignment.findUnique({
      where: {
        outletId_salesRepId: {
          outletId: parseInt(outletId),
          salesRepId: parseInt(salesRepId)
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Soft delete by setting status to inactive
    await prisma.clientAssignment.update({
      where: { id: assignment.id },
      data: { status: 'inactive' }
    });

    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
};

// Get assignments for an outlet
const getOutletAssignments = async (req, res) => {
  try {
    const { outletId } = req.params;

    const assignments = await prisma.clientAssignment.findMany({
      where: {
        outletId: parseInt(outletId),
        status: 'active'
      },
      include: {
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching outlet assignments:', error);
    res.status(500).json({ error: 'Failed to fetch outlet assignments' });
  }
};

// Get assignments for a sales rep
const getSalesRepAssignments = async (req, res) => {
  try {
    const { salesRepId } = req.params;

    const assignments = await prisma.clientAssignment.findMany({
      where: {
        salesRepId: parseInt(salesRepId),
        status: 'active'
      },
      include: {
        outlet: {
          select: {
            id: true,
            name: true,
            address: true,
            balance: true
          }
        }
      }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching sales rep assignments:', error);
    res.status(500).json({ error: 'Failed to fetch sales rep assignments' });
  }
};

module.exports = {
  getOutlets,
  createOutlet,
  updateOutlet,
  getOutletProducts,
  getOutletLocation,
  addClientPayment,
  getClientPayments,
  updateOutletLocation,
  updateClientDiscount,
  getClientDiscount,
  assignOutletToSalesRep,
  removeOutletAssignment,
  getOutletAssignments,
  getSalesRepAssignments,
};