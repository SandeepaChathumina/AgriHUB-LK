import Vehicle from '../models/Vehicle.js';
import Transporter from '../models/Transporter.js';
import mongoose from 'mongoose';

// Helper function for Sri Lankan number plate validation
const validateSLPlate = (plate) => {
  if (!plate) return false;
  
  // Normalize input
  const normalizedPlate = plate.trim().replace(/\s+/g, ' ');
  
  // Old format - "40 Sri 1234"
  const oldFormat = /^[0-9]{1,3}\s+[A-Za-z]{2,4}\s+[0-9]{4}$/;
  
  // New format WITH district codes (hyphen) - "WP-LB-4321"
  const newFormatWithDistrictHyphen = /^[A-Z]{2,3}-[A-Z]{2,3}-[0-9]{4}$/;
  
  // New format WITH district codes (space) - "WP LB 4321"
  const newFormatWithDistrictSpace = /^[A-Z]{2,3}\s+[A-Z]{2,3}\s+[0-9]{4}$/;
  
  // New format WITHOUT district codes (hyphen) - "ABC-1234"
  const newFormatWithoutDistrictHyphen = /^[A-Z]{2,3}-[0-9]{4}$/;
  
  // New format WITHOUT district codes (space) - "ABC 1234"
  const newFormatWithoutDistrictSpace = /^[A-Z]{2,3}\s+[0-9]{4}$/;
  
  // Convert to uppercase for new formats
  const upperCasePlate = normalizedPlate.toUpperCase();
  
  return oldFormat.test(normalizedPlate) || 
         newFormatWithDistrictHyphen.test(upperCasePlate) ||
         newFormatWithDistrictSpace.test(upperCasePlate) ||
         newFormatWithoutDistrictHyphen.test(upperCasePlate) ||
         newFormatWithoutDistrictSpace.test(upperCasePlate);
};


// @desc    Create a new vehicle
// @route   POST /api/vehicles
export const createVehicle = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    
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

    // Create new vehicle
    const vehicle = new Vehicle({
      ...vehicleData,
      transporter: transporterId
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

// @desc    Get all vehicles
// @route   GET /api/vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const { status, category, vehicleType, transporterId, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (vehicleType) filter.vehicleType = vehicleType;
    if (transporterId) filter.transporter = transporterId;

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
      .populate('transporter', 'businessName phone');

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

    // Update vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
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