const prisma = require('../lib/prisma');
const multer = require('multer');
const path = require('path');
const { uploadFile } = require('../lib/uploadService');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG and PNG files are allowed.'));
    }
  }
}).single('image');

// Ensure salesRepId is not null
const getSalesRepId = (req) => {
  // Check if authentication failed but request should still proceed
  if (req.authFailed) {
    console.log('⚠️ Authentication failed but allowing request to proceed');
    // Return a default or null value to indicate no authenticated user
    return null;
  }
  
  if (!req.user || !req.user.id) {
    throw new Error('SalesRep authentication required');
  }
  return req.user.id;
};

// Create a new journey plan
const createJourneyPlan = async (req, res) => {
  try {
    // Check if authentication failed
    if (req.authFailed) {
      console.log('⚠️ Authentication failed for create journey plan request');
      return res.status(401).json({ 
        error: 'Authentication required for creating journey plans',
        authError: req.authError || 'Authentication failed',
        requiresReauth: true
      });
    }

    const { clientId, date, notes, showUpdateLocation, routeId } = req.body;
    const salesRepId = req.user.id;

    console.log('Creating journey plan with:', { clientId, date, salesRepId, notes, showUpdateLocation, routeId });

    // Input validation
    if (!clientId) {
      return res.status(400).json({ error: 'Missing required field: clientId' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Missing required field: date' });
    }

    // Check if the client exists
    const client = await prisma.clients.findUnique({
      where: { id: parseInt(clientId) },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // If routeId is provided, validate and update client's route
    if (routeId) {
      const route = await prisma.routes.findUnique({
        where: { id: parseInt(routeId) },
      });

      if (!route) {
        return res.status(404).json({ error: 'Route not found' });
      }

      // Update client's route
      await prisma.clients.update({
        where: { id: parseInt(clientId) },
        data: {
          route_id_update: parseInt(routeId),
          route_name_update: route.name,
        },
      });
      await prisma.salesRep.update({
        where: { id: salesRepId },
        data: {
          route_id_update: parseInt(routeId),
          route_name_update: route.name,
        },
      });
    }

    // Parse the date from ISO string
    let journeyDate;
    try {
      journeyDate = new Date(date);
      if (isNaN(journeyDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
    } catch (error) {
      console.error('Date parsing error:', error);
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Validate that the date is not in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (journeyDate < now) {
      return res.status(400).json({ error: 'Journey date cannot be in the past' });
    }

    // Extract time from the date in HH:MM format
    const time = journeyDate.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create the journey plan
    const journeyPlan = await prisma.journeyPlan.create({
      data: {
        date: journeyDate,
        time: time,
        userId: salesRepId,
        clientId: parseInt(clientId),
        status: 0,
        notes: notes,
        showUpdateLocation: showUpdateLocation ?? true,
        routeId: routeId ? parseInt(routeId) : null,
      },
      include: {
        client: true,
        route: true,
      },
    });

    console.log('Journey plan created successfully:', journeyPlan);
    res.status(201).json(journeyPlan);
  } catch (error) {
    console.error('Error creating journey plan:', error);
    res.status(500).json({ 
      error: 'Failed to create journey plan',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all journey plans for the authenticated sales rep with client details
// This function only fetches journey plans for the current day
const getJourneyPlans = async (req, res) => {
  try {
    // Check if authentication failed
    if (req.authFailed) {
      console.log('⚠️ Authentication failed for journey plans request, returning empty result');
      return res.status(200).json({ 
        success: true, 
        data: [],
        authWarning: req.authError || 'Authentication failed but request allowed',
        requiresReauth: true
      });
    }

    const salesRepId = getSalesRepId(req);

    // If no salesRepId (authentication failed), return empty result
    if (!salesRepId) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        authWarning: 'No authenticated user found',
        requiresReauth: true
      });
    }

    // Get timezone from query params or use Nairobi as default
    const timezone = req.query.timezone || 'Africa/Nairobi';
    
    // Get the current date in the specified timezone
    const now = new Date();
    const today = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`Fetching journey plans for sales rep ${salesRepId} on ${today.toISOString().split('T')[0]} in timezone ${timezone}`);
    console.log(`Date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);

    const journeyPlans = await prisma.journeyPlan.findMany({
      where: {
        userId: salesRepId,
        date: {
          gte: today,
          lt: tomorrow,
        },
        clientId: { gt: 0 },
      },
      include: {
        client: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    console.log(`Found ${journeyPlans.length} journey plans for today`);
    
    // Log the dates of found journey plans for debugging
    if (journeyPlans.length > 0) {
      console.log('Journey plan dates:', journeyPlans.map(jp => jp.date.toISOString().split('T')[0]));
    }
    
    res.status(200).json({ success: true, data: journeyPlans });
  } catch (error) {
    console.error('Error fetching journey plans:', error);
    
    if (error.message === 'SalesRep authentication required') {
      // Instead of returning 401, return empty result with auth warning
      return res.status(200).json({ 
        success: true, 
        data: [],
        authWarning: 'Authentication required but request allowed',
        requiresReauth: true
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch journey plans',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a journey plan
const updateJourneyPlan = async (req, res) => {
  // Handle both multipart form data and regular JSON
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Check if authentication failed
    if (req.authFailed) {
      console.log('⚠️ Authentication failed for update journey plan request');
      return res.status(401).json({ 
        error: 'Authentication required for updating journey plans',
        authError: req.authError || 'Authentication failed',
        requiresReauth: true
      });
    }

    const { journeyId } = req.params;
    const { 
      clientId, 
      status, 
      checkInTime, 
      latitude, 
      longitude, 
      imageUrl: providedImageUrl, 
      notes,
      checkoutTime,
      checkoutLatitude,
      checkoutLongitude,
      showUpdateLocation 
    } = req.body;

    // Log request details for debugging
    console.log('[CHECKOUT LOG] Updating journey plan:', { 
      journeyId, clientId, status, checkInTime, 
      latitude, longitude, notes,
      checkoutTime, checkoutLatitude, checkoutLongitude,
      showUpdateLocation,
      hasFile: !!req.file,
      providedImageUrl
    });

    try {
      // Validate required params
      if (!journeyId) {
        return res.status(400).json({ error: 'Missing required field: journeyId' });
      }

      // Get the authenticated sales rep
      const salesRepId = req.user.id;

      // Status mapping
      const STATUS_MAP = {
        'pending': 0,
        'checked_in': 1,
        'in_progress': 2,
        'completed': 3,
        'cancelled': 4
      };

      const REVERSE_STATUS_MAP = {
        0: 'pending',
        1: 'checked_in',
        2: 'in_progress',
        3: 'completed',
        4: 'cancelled'
      };

      // Check if the journey plan exists and belongs to the sales rep
      const existingJourneyPlan = await prisma.journeyPlan.findUnique({
        where: { id: parseInt(journeyId) },
      });

      if (!existingJourneyPlan) {
        return res.status(404).json({ error: 'Journey plan not found' });
      }

      if (existingJourneyPlan.userId !== salesRepId) {
        return res.status(403).json({ error: 'Unauthorized to update this journey plan' });
      }

      // Add validation for status transitions if needed
      const currentStatus = REVERSE_STATUS_MAP[existingJourneyPlan.status];
      
      // Log status change if applicable
      if (status !== undefined && status !== existingJourneyPlan.status) {
        console.log(`Status change: ${currentStatus} -> ${REVERSE_STATUS_MAP[status]}`);
      }

      // Handle image upload if present
      let finalImageUrl = undefined;
      if (req.file) {
        try {
          console.log('Processing checkin image:', req.file.originalname, req.file.mimetype, req.file.size);
          const result = await uploadFile(req.file, {
            folder: 'whoosh/checkins',
            type: 'image',
            generateThumbnail: true
          });
          finalImageUrl = result.main.url;
          console.log('Checkin image uploaded successfully:', finalImageUrl);
        } catch (uploadError) {
          console.error('Error uploading checkin image:', uploadError);
          return res.status(500).json({ error: 'Failed to upload checkin image' });
        }
      } else if (providedImageUrl) {
        // If no file but imageUrl provided, use that
        finalImageUrl = providedImageUrl;
      }

      // Update the journey plan
      const updatedJourneyPlan = await prisma.journeyPlan.update({
        where: { id: parseInt(journeyId) },
        data: {
          status: status !== undefined ? STATUS_MAP[status] : existingJourneyPlan.status,
          checkInTime: checkInTime ? new Date(checkInTime) : undefined,
          latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
          longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
          imageUrl: finalImageUrl,
          notes: notes,
          checkoutTime: checkoutTime ? new Date(checkoutTime) : undefined,
          checkoutLatitude: checkoutLatitude !== undefined ? parseFloat(checkoutLatitude) : undefined,
          checkoutLongitude: checkoutLongitude !== undefined ? parseFloat(checkoutLongitude) : undefined,
          showUpdateLocation: showUpdateLocation !== undefined ? Boolean(showUpdateLocation) : undefined,
          client: clientId ? {
            connect: { id: parseInt(clientId) }
          } : undefined
        },
        include: {
          client: true,
        },
      });

      console.log('Journey plan updated successfully:', {
        id: updatedJourneyPlan.id,
        status: REVERSE_STATUS_MAP[updatedJourneyPlan.status],
        imageUrl: updatedJourneyPlan.imageUrl
      });

      res.status(200).json(updatedJourneyPlan);
    } catch (error) {
      console.error('Error updating journey plan:', error);
      res.status(500).json({ 
        error: 'Failed to update journey plan',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

// Delete a journey plan with status 0
const deleteJourneyPlan = async (req, res) => {
  try {
    // Check if authentication failed
    if (req.authFailed) {
      console.log('⚠️ Authentication failed for delete journey plan request');
      return res.status(401).json({ 
        error: 'Authentication required for deleting journey plans',
        authError: req.authError || 'Authentication failed',
        requiresReauth: true
      });
    }

    const { journeyId } = req.params;

    // Check if the journey plan exists and has status 0
    const journeyPlan = await prisma.journeyPlan.findUnique({
      where: { id: parseInt(journeyId) },
    });

    if (!journeyPlan) {
      return res.status(404).json({ error: 'Journey plan not found' });
    }

    if (journeyPlan.status !== 0) {
      return res.status(400).json({ error: 'Only pending journey plans (status 0) can be deleted' });
    }

    // Delete the journey plan
    await prisma.journeyPlan.delete({
      where: { id: parseInt(journeyId) },
    });

    res.status(200).json({ message: 'Journey plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting journey plan:', error);
    res.status(500).json({ 
      error: 'Failed to delete journey plan',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { createJourneyPlan, getJourneyPlans, updateJourneyPlan, deleteJourneyPlan };