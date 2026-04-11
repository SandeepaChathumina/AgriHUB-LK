import Vehicle from '../models/Vehicle.js';
import Transporter from '../models/Transporter.js';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Helper function for Sri Lankan number plate validation
const validateSLPlate = (plate) => {
  if (!plate) return false;
  
  const normalizedPlate = plate.trim().replace(/\s+/g, ' ').toUpperCase();
  const oldFormat = /^[0-9]{1,3}\s+[A-Za-z]{2,4}\s+[0-9]{4}$/;
  const newFormatWithDistrictHyphen = /^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{4}$/;
  const newFormatWithDistrictSpace = /^[A-Z]{2,3}\s+[A-Z]{2,3}\s+[0-9]{4}$/;
  const newFormatWithoutDistrictHyphen = /^[A-Z]{2,3}-[0-9]{4}$/;
  const newFormatWithoutDistrictSpace = /^[A-Z]{2,3}\s+[0-9]{4}$/;
  
  return oldFormat.test(normalizedPlate) || 
         newFormatWithDistrictHyphen.test(normalizedPlate) ||
         newFormatWithDistrictSpace.test(normalizedPlate) ||
         newFormatWithoutDistrictHyphen.test(normalizedPlate) ||
         newFormatWithoutDistrictSpace.test(normalizedPlate);
};

// Upload vehicle images to Cloudinary
export const uploadVehicleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedImages = [];
    
    for (const file of req.files) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'agrihub/vehicles',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ]
        });
        
        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id
        });
        
        // Delete local file after upload
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw uploadError;
      }
    }

    res.status(200).json({
      success: true,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

// @desc    Create a new vehicle
// @route   POST /api/vehicles
export const createVehicle = async (req, res) => {
  try {
    const { transporterId, ...vehicleData } = req.body;
    
    // Basic validation
    if (!transporterId) {
      return res.status(400).json({ 
        success: false,
        message: 'transporterId is required' 
      });
    }

    // Validate transporterId format
    if (!mongoose.Types.ObjectId.isValid(transporterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transporter ID format'
      });
    }

    // Check if transporter exists
    const transporter = await Transporter.findById(transporterId);
    if (!transporter) {
      return res.status(404).json({ 
        success: false,
        message: 'Transporter not found' 
      });
    }

    // Validate registration number
    if (!vehicleData.registrationNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Registration number is required' 
      });
    }

    // Convert to uppercase for validation
    vehicleData.registrationNumber = vehicleData.registrationNumber.toUpperCase();

    // Validate Sri Lankan plate format
    if (!validateSLPlate(vehicleData.registrationNumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid Sri Lankan vehicle registration number format' 
      });
    }

    // Check if registration number already exists
    const existingVehicle = await Vehicle.findOne({ 
      registrationNumber: vehicleData.registrationNumber 
    });
    
    if (existingVehicle) {
      return res.status(400).json({ 
        success: false,
        message: 'Vehicle with this registration number already exists' 
      });
    }

    // Validate category
    const validCategories = ['Truck', 'Lorry', 'Pickup', 'Van'];
    if (!validCategories.includes(vehicleData.category)) {
      return res.status(400).json({ 
        success: false,
        message: 'Category must be Truck, Lorry, Pickup, or Van' 
      });
    }

    // Validate vehicle type
    const validVehicleTypes = ['Open body', 'Covered body', 'Refrigerated', 'Container'];
    if (!validVehicleTypes.includes(vehicleData.vehicleType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Vehicle type must be Open body, Covered body, Refrigerated, or Container' 
      });
    }

    // Validate fuel type
    const validFuelTypes = ['Diesel', 'Petrol', 'Electric', 'Hybrid'];
    if (!validFuelTypes.includes(vehicleData.fuelType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Fuel type must be Diesel, Petrol, Electric, or Hybrid' 
      });
    }

    // Validate manufacturing year
    const currentYear = new Date().getFullYear();
    if (vehicleData.manufacturingYear) {
      const year = parseInt(vehicleData.manufacturingYear);
      if (year < 1950 || year > currentYear) {
        return res.status(400).json({ 
          success: false,
          message: `Manufacturing year must be between 1950 and ${currentYear}` 
        });
      }
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (vehicleData.nextMaintenanceDue && new Date(vehicleData.nextMaintenanceDue) <= today) {
      return res.status(400).json({ 
        success: false,
        message: 'Next maintenance due must be a future date' 
      });
    }

    if (vehicleData.lastMaintenanceDate && new Date(vehicleData.lastMaintenanceDate) > today) {
      return res.status(400).json({ 
        success: false,
        message: 'Last maintenance date cannot be a future date' 
      });
    }

    // Validate weight capacity
    if (!vehicleData.loadCapacity?.weight?.value || vehicleData.loadCapacity.weight.value < 500) {
      return res.status(400).json({ 
        success: false,
        message: 'Weight capacity must be at least 500kg' 
      });
    }

    // Check if any documents are expired to set initial status
    let initialStatus = 'Available';
    if (vehicleData.insuranceExpiry && new Date(vehicleData.insuranceExpiry) < today) {
      initialStatus = 'Offline';
    }
    if (vehicleData.registrationExpiry && new Date(vehicleData.registrationExpiry) < today) {
      initialStatus = 'Offline';
    }

    // Create new vehicle
    const vehicle = new Vehicle({
      ...vehicleData,
      transporter: transporterId,
      status: initialStatus,
      images: vehicleData.images || []
    });

    // Save vehicle
    await vehicle.save();

    // Update transporter fleet size
    transporter.fleetSize = (transporter.fleetSize || 0) + 1;
    await transporter.save();

    // Populate transporter info for response
    await vehicle.populate('transporter', 'businessName phone email');

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: {
        vehicle,
        fleetSize: transporter.fleetSize
      }
    });

  } catch (error) {
    console.error('Error creating vehicle:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `Vehicle with this ${field} already exists`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: messages 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error creating vehicle',
      error: error.message 
    });
  }
};

// @desc    Get all vehicles with filters
// @route   GET /api/vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const { status, category, vehicleType, transporterId, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (transporterId) {
      if (!mongoose.Types.ObjectId.isValid(transporterId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transporter ID format'
        });
      }
      filter.transporter = transporterId;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const vehicles = await Vehicle.find(filter)
      .populate('transporter', 'businessName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vehicle.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      vehicles
    });

  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching vehicles',
      error: error.message 
    });
  }
};

// @desc    Get vehicles by transporter
// @route   GET /api/vehicles/transporter/:transporterId
export const getVehiclesByTransporter = async (req, res) => {
  try {
    const { transporterId } = req.params;
    
    // Validate transporterId
    if (!mongoose.Types.ObjectId.isValid(transporterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transporter ID format'
      });
    }

    const vehicles = await Vehicle.find({ transporter: transporterId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });

  } catch (error) {
    console.error('Error fetching transporter vehicles:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching vehicles',
      error: error.message 
    });
  }
};

// @desc    Get current user's (transporter's) vehicles
// @route   GET /api/vehicles/my-vehicles
export const getMyVehicles = async (req, res) => {
  try {
    const transporterId = req.user._id;

    const vehicles = await Vehicle.find({ transporter: transporterId })
      .select('_id category vehicleType registrationNumber status loadCapacity images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });

  } catch (error) {
    console.error('Error fetching my vehicles:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching vehicles',
      error: error.message 
    });
  }
};

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
export const getVehicleById = async (req, res) => {
  try {
    // Validate vehicle ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format'
      });
    }

    const vehicle = await Vehicle.findById(req.params.id)
      .populate('transporter', 'businessName phone email companyName');

    if (!vehicle) {
      return res.status(404).json({ 
        success: false,
        message: 'Vehicle not found' 
      });
    }

    res.status(200).json({
      success: true,
      vehicle
    });

  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching vehicle',
      error: error.message 
    });
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
export const updateVehicle = async (req, res) => {
  try {
    const { transporterId, ...updateData } = req.body;

    if (!transporterId) {
      return res.status(400).json({ 
        success: false,
        message: 'transporterId is required' 
      });
    }

    // Validate vehicle ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format'
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ 
        success: false,
        message: 'Vehicle not found' 
      });
    }

    // Check ownership
    if (vehicle.transporter.toString() !== transporterId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized - this vehicle does not belong to you' 
      });
    }

    // If updating registration number, check uniqueness
    if (updateData.registrationNumber && 
        updateData.registrationNumber !== vehicle.registrationNumber) {
      
      updateData.registrationNumber = updateData.registrationNumber.toUpperCase();
      
      if (!validateSLPlate(updateData.registrationNumber)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid registration number format' 
        });
      }
      
      const existing = await Vehicle.findOne({ 
        registrationNumber: updateData.registrationNumber 
      });
      
      if (existing) {
        return res.status(400).json({ 
          success: false,
          message: 'Registration number already exists' 
        });
      }
    }

    // Validate manufacturing year
    const currentYear = new Date().getFullYear();
    if (updateData.manufacturingYear) {
      const year = parseInt(updateData.manufacturingYear);
      if (year < 1950 || year > currentYear) {
        return res.status(400).json({ 
          success: false,
          message: `Manufacturing year must be between 1950 and ${currentYear}` 
        });
      }
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (updateData.nextMaintenanceDue && new Date(updateData.nextMaintenanceDue) <= today) {
      return res.status(400).json({ 
        success: false,
        message: 'Next maintenance due must be a future date' 
      });
    }

    if (updateData.lastMaintenanceDate && new Date(updateData.lastMaintenanceDate) > today) {
      return res.status(400).json({ 
        success: false,
        message: 'Last maintenance date cannot be a future date' 
      });
    }

    // Validate weight capacity
    if (updateData.loadCapacity?.weight?.value && updateData.loadCapacity.weight.value < 500) {
      return res.status(400).json({ 
        success: false,
        message: 'Weight capacity must be at least 500kg' 
      });
    }

    // Check if documents expired to update status
    let newStatus = updateData.status || vehicle.status;
    if (updateData.insuranceExpiry && new Date(updateData.insuranceExpiry) < today) {
      newStatus = 'Offline';
    }
    if (updateData.registrationExpiry && new Date(updateData.registrationExpiry) < today) {
      newStatus = 'Offline';
    }

    // Update vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { 
        $set: {
          ...updateData,
          status: newStatus
        } 
      },
      { new: true, runValidators: true }
    ).populate('transporter', 'businessName phone');

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating vehicle',
      error: error.message 
    });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
export const deleteVehicle = async (req, res) => {
  try {
    const { transporterId } = req.body;

    if (!transporterId) {
      return res.status(400).json({ 
        success: false,
        message: 'transporterId is required' 
      });
    }

    // Validate vehicle ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format'
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ 
        success: false,
        message: 'Vehicle not found' 
      });
    }

    // Check ownership
    if (vehicle.transporter.toString() !== transporterId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized - this vehicle does not belong to you' 
      });
    }

    // Check if vehicle is on delivery
    if (vehicle.status === 'On Delivery') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete vehicle that is on delivery' 
      });
    }

    // Delete images from Cloudinary
    if (vehicle.images && vehicle.images.length > 0) {
      for (const image of vehicle.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (cloudinaryError) {
            console.error('Failed to delete image from Cloudinary:', cloudinaryError);
          }
        }
      }
    }

    // Delete vehicle
    await vehicle.deleteOne();

    // Update transporter fleet size
    await Transporter.findByIdAndUpdate(
      transporterId,
      { $inc: { fleetSize: -1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting vehicle',
      error: error.message 
    });
  }
};

// @desc    Update vehicle status
// @route   PATCH /api/vehicles/:id/status
export const updateVehicleStatus = async (req, res) => {
  try {
    const { transporterId, status } = req.body;

    if (!transporterId || !status) {
      return res.status(400).json({ 
        success: false,
        message: 'transporterId and status are required' 
      });
    }

    // Validate status
    const validStatuses = ['Available', 'On Delivery', 'Maintenance', 'Offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status value' 
      });
    }

    // Validate vehicle ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format'
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ 
        success: false,
        message: 'Vehicle not found' 
      });
    }

    // Check ownership
    if (vehicle.transporter.toString() !== transporterId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized - this vehicle does not belong to you' 
      });
    }

    // Check if trying to set as Available but documents expired
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (status === 'Available') {
      if (vehicle.insuranceExpiry && new Date(vehicle.insuranceExpiry) < today) {
        return res.status(400).json({ 
          success: false,
          message: 'Cannot set as Available - Insurance is expired. Please renew insurance first.' 
        });
      }
      if (vehicle.registrationExpiry && new Date(vehicle.registrationExpiry) < today) {
        return res.status(400).json({ 
          success: false,
          message: 'Cannot set as Available - Registration is expired. Please renew registration first.' 
        });
      }
    }

    // Update status
    vehicle.status = status;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: `Vehicle status updated to ${status}`,
      vehicle
    });

  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating vehicle status',
      error: error.message 
    });
  }
};

// @desc    Get vehicle statistics for dashboard
// @route   GET /api/vehicles/stats
export const getVehicleStats = async (req, res) => {
  try {
    const { transporterId } = req.query;

    if (!transporterId) {
      return res.status(400).json({
        success: false,
        message: 'transporterId is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(transporterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transporter ID format'
      });
    }

    const stats = await Vehicle.aggregate([
      { $match: { transporter: mongoose.Types.ObjectId.createFromHexString(transporterId) } },
      {
        $group: {
          _id: null,
          totalVehicles: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] }
          },
          onDelivery: {
            $sum: { $cond: [{ $eq: ['$status', 'On Delivery'] }, 1, 0] }
          },
          maintenance: {
            $sum: { $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] }
          },
          offline: {
            $sum: { $cond: [{ $eq: ['$status', 'Offline'] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Vehicle.aggregate([
      { $match: { transporter: mongoose.Types.ObjectId.createFromHexString(transporterId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalVehicles: 0,
        available: 0,
        onDelivery: 0,
        maintenance: 0,
        offline: 0
      },
      categoryStats
    });

  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle statistics',
      error: error.message
    });
  }
};

// @desc    Bulk update vehicle status (for maintenance scheduling)
// @route   POST /api/vehicles/bulk-status
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { transporterId, vehicleIds, status } = req.body;

    if (!transporterId || !vehicleIds || !status) {
      return res.status(400).json({
        success: false,
        message: 'transporterId, vehicleIds, and status are required'
      });
    }

    if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'vehicleIds must be a non-empty array'
      });
    }

    const validStatuses = ['Available', 'Maintenance', 'Offline'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for bulk update'
      });
    }

    const result = await Vehicle.updateMany(
      {
        _id: { $in: vehicleIds },
        transporter: transporterId
      },
      { $set: { status } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} vehicles updated to ${status}`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error in bulk status update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicles',
      error: error.message
    });
  }
};

// @desc    Get available vehicles for transport (for distributors)
// @route   GET /api/vehicles/available
export const getAvailableVehicles = async (req, res) => {
  try {
    const { category, vehicleType, minCapacity, district, page = 1, limit = 50 } = req.query;
    
    // Build filter for available vehicles only
    const filter = { status: 'Available' };
    
    // Apply filters
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (vehicleType && vehicleType !== 'All') {
      filter.vehicleType = vehicleType;
    }
    
    // Add capacity filter if needed
    if (minCapacity) {
      filter['loadCapacity.weight.value'] = { $gte: parseInt(minCapacity) };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch vehicles with transporter details
    let vehicles = await Vehicle.find(filter)
      .populate('transporter', 'businessName companyName phone email location logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Filter by district if specified (based on transporter's location)
    if (district && district !== 'All') {
      vehicles = vehicles.filter(vehicle => 
        vehicle.transporter?.location?.district === district
      );
    }
    
    // Get total count for pagination (without district filter for accurate count)
    const total = await Vehicle.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      vehicles
    });
    
  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching available vehicles',
      error: error.message 
    });
  }
};