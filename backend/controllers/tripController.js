import Trip from '../models/Trip.js';
import Order from '../models/Order.js';
import Vehicle from '../models/Vehicle.js';
import Transporter from '../models/Transporter.js';
import mongoose from 'mongoose';

// Check vehicle availability
const checkVehicleAvailability = async (vehicleId, scheduledPickup, estimatedDelivery, excludeTripId = null) => {
  const query = {
    vehicle: vehicleId,
    tripStatus: { $in: ['Accepted', 'In Progress'] },
    $or: [
      {
        'schedule.scheduledPickup': { $lte: estimatedDelivery },
        'schedule.estimatedDelivery': { $gte: scheduledPickup }
      }
    ]
  };

  if (excludeTripId) {
    query._id = { $ne: excludeTripId };
  }

  const conflictingTrip = await Trip.findOne(query);
  return !conflictingTrip;
};

// @desc    Get available orders for transporter
// @route   GET /api/trips/available-orders
export const getAvailableOrders = async (req, res) => {
  try {
    const { district, page = 1, limit = 10 } = req.query;

    const filter = {
      status: 'Confirmed',
      deliveryStatus: 'Requested',
      transporter: null
    };

    const orders = await Order.find(filter)
      .populate({
        path: 'product',
        populate: { path: 'farmer', select: 'fullName phone location' }
      })
      .populate('distributor', 'fullName phone')
      .sort({ createdAt: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    const enhancedOrders = orders.map(order => ({
      ...order.toObject(),
      pickupLocation: order.product?.pickupLocation || null,
      farmer: order.product?.farmer || null
    }));

    res.status(200).json({
      success: true,
      count: enhancedOrders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      orders: enhancedOrders
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new trip
// @route   POST /api/trips
export const createTrip = async (req, res) => {
  try {
    const {
      orderId,
      vehicleId,
      scheduledPickup,
      estimatedDelivery,
      baseFare,
      distanceCharge,
      additionalCharges
    } = req.body;

    const transporterId = req.user._id;

    // Validation
    if (!orderId || !vehicleId || !scheduledPickup || !estimatedDelivery || !baseFare) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Check transporter
    const transporter = await Transporter.findById(transporterId);
    if (!transporter) {
      return res.status(404).json({ success: false, message: 'Transporter not found' });
    }

    // Check order
    const order = await Order.findById(orderId)
      .populate({
        path: 'product',
        populate: { path: 'farmer', select: 'fullName phone location' }
      })
      .populate('distributor', 'fullName phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'Confirmed' || order.deliveryStatus !== 'Requested') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order is not available for transport' 
      });
    }

    if (order.transporter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order already assigned to a transporter' 
      });
    }

    // Check vehicle
    const vehicle = await Vehicle.findOne({ _id: vehicleId, transporter: transporterId });
    if (!vehicle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vehicle not found or does not belong to you' 
      });
    }

    if (vehicle.status !== 'Available') {
      return res.status(400).json({ 
        success: false, 
        message: `Vehicle is not available (status: ${vehicle.status})` 
      });
    }

    // Check availability
    const pickupDate = new Date(scheduledPickup);
    const deliveryDate = new Date(estimatedDelivery);

    if (pickupDate < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pickup time cannot be in the past' 
      });
    }

    if (deliveryDate <= pickupDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Delivery must be after pickup' 
      });
    }

    const isAvailable = await checkVehicleAvailability(vehicleId, pickupDate, deliveryDate);
    if (!isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vehicle is already assigned for this time slot' 
      });
    }

    // Get locations
    const pickupLocation = order.product?.pickupLocation;
    const dropoffLocation = order.deliveryAddress;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pickup or dropoff location not found' 
      });
    }

    // Create trip
    const tripData = {
      order: orderId,
      transporter: transporterId,
      vehicle: vehicleId,
      pickupLocation: {
        address: pickupLocation.address,
        city: pickupLocation.city || order.product?.farmer?.location?.city,
        district: pickupLocation.district || order.product?.farmer?.location?.district,
        coordinates: pickupLocation.coordinates
      },
      dropoffLocation: {
        address: dropoffLocation.addressLine,
        city: dropoffLocation.city,
        coordinates: dropoffLocation.coordinates
      },
      schedule: {
        scheduledPickup: pickupDate,
        estimatedDelivery: deliveryDate
      },
      costs: {
        baseFare: Number(baseFare),
        distanceCharge: Number(distanceCharge) || 0,
        additionalCharges: additionalCharges || [],
        totalCost: Number(baseFare) + (Number(distanceCharge) || 0)
      },
      createdBy: transporterId
    };

    const trip = new Trip(tripData);
    trip.addTimelineEvent('Created', 'Trip created', transporterId);
    await trip.save();

    // Update order and vehicle
    order.transporter = transporterId;
    order.deliveryStatus = 'In Transit';
    await order.save();

    vehicle.status = 'On Delivery';
    await vehicle.save();

    await trip.populate([
      { path: 'order', populate: { path: 'product' } },
      { path: 'transporter', select: 'businessName phone' },
      { path: 'vehicle', select: 'vehicleId category registrationNumber' }
    ]);

    res.status(201).json({ success: true, trip });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my trips
// @route   GET /api/trips/my-trips
export const getMyTrips = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { transporter: req.user._id };
    if (status) filter.tripStatus = status;

    const trips = await Trip.find(filter)
      .populate({
        path: 'order',
        populate: [
          { path: 'product', select: 'productName category' },
          { path: 'distributor', select: 'fullName' }
        ]
      })
      .populate('vehicle', 'vehicleId category')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: trips.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      trips
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trip by ID
// @route   GET /api/trips/:id
export const getTripById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid trip ID' });
    }

    const trip = await Trip.findById(req.params.id)
      .populate({
        path: 'order',
        populate: [
          { path: 'product', populate: { path: 'farmer' } },
          { path: 'distributor' }
        ]
      })
      .populate('transporter')
      .populate('vehicle')
      .populate('createdBy', 'fullName');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check access
    if (trip.transporter._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'Admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.status(200).json({ success: true, trip });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update trip status
// @route   PATCH /api/trips/:id/status
export const updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Accepted', 'In Progress', 'Completed', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check ownership
    if (trip.transporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Status transition validation
    const oldStatus = trip.tripStatus;
    
    if (oldStatus === 'Completed' || oldStatus === 'Cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot update ${oldStatus} trip` 
      });
    }

    if (status === 'Cancelled' && !['Pending', 'Accepted'].includes(oldStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only cancel pending or accepted trips' 
      });
    }

    // Update trip
    trip.tripStatus = status;
    trip.addTimelineEvent(status, `Status updated to ${status}`, req.user._id);

    // Update actual times
    if (status === 'In Progress') {
      trip.schedule.actualPickup = new Date();
    } else if (status === 'Completed') {
      trip.schedule.actualDelivery = new Date();
      
      // Update vehicle status
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });
      
      // Update order
      await Order.findByIdAndUpdate(trip.order, { deliveryStatus: 'Delivered' });
      
    } else if (status === 'Cancelled') {
      trip.cancellationReason = req.body.reason || 'No reason provided';
      trip.cancelledAt = new Date();
      
      // Make vehicle available again
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });
      
      // Free up the order
      await Order.findByIdAndUpdate(trip.order, { 
        transporter: null,
        deliveryStatus: 'Requested' 
      });
    }

    await trip.save();

    res.status(200).json({ 
      success: true, 
      message: `Trip ${status} successfully`,
      trip 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change vehicle for trip
// @route   PATCH /api/trips/:id/vehicle
export const changeVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vehicle ID required' 
      });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check ownership
    if (trip.transporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Can only change vehicle for pending/accepted trips
    if (!['Pending', 'Accepted'].includes(trip.tripStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot change vehicle for ongoing or completed trips' 
      });
    }

    // Check new vehicle
    const newVehicle = await Vehicle.findOne({ 
      _id: vehicleId, 
      transporter: req.user._id 
    });

    if (!newVehicle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vehicle not found' 
      });
    }

    if (newVehicle.status !== 'Available') {
      return res.status(400).json({ 
        success: false, 
        message: 'New vehicle is not available' 
      });
    }

    // Check availability for the time slot
    const isAvailable = await checkVehicleAvailability(
      vehicleId,
      trip.schedule.scheduledPickup,
      trip.schedule.estimatedDelivery,
      trip._id
    );

    if (!isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: 'New vehicle is not available for this time slot' 
      });
    }

    // Free up old vehicle
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });

    // Assign new vehicle
    trip.vehicle = vehicleId;
    newVehicle.status = 'On Delivery';
    await newVehicle.save();

    trip.addTimelineEvent('Vehicle Changed', `Vehicle changed to ${newVehicle.vehicleId}`, req.user._id);
    await trip.save();

    res.status(200).json({ 
      success: true, 
      message: 'Vehicle changed successfully',
      trip 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel trip
// @route   DELETE /api/trips/:id
export const cancelTrip = async (req, res) => {
  try {
    const { reason } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check ownership
    if (trip.transporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Can only cancel pending/accepted trips
    if (!['Pending', 'Accepted'].includes(trip.tripStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel ongoing or completed trips' 
      });
    }

    // Update trip
    trip.tripStatus = 'Cancelled';
    trip.cancellationReason = reason || 'Cancelled by transporter';
    trip.cancelledAt = new Date();
    trip.addTimelineEvent('Cancelled', reason || 'Trip cancelled', req.user._id);
    await trip.save();

    // Free up vehicle
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });

    // Free up order
    await Order.findByIdAndUpdate(trip.order, { 
      transporter: null,
      deliveryStatus: 'Requested' 
    });

    res.status(200).json({ 
      success: true, 
      message: 'Trip cancelled successfully' 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trip statistics
// @route   GET /api/trips/stats
export const getTripStats = async (req, res) => {
  try {
    const stats = await Trip.aggregate([
      { $match: { transporter: req.user._id } },
      {
        $group: {
          _id: '$tripStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$costs.totalCost' }
        }
      }
    ]);

    const totalTrips = await Trip.countDocuments({ transporter: req.user._id });
    const completedTrips = await Trip.countDocuments({ 
      transporter: req.user._id,
      tripStatus: 'Completed' 
    });
    const cancelledTrips = await Trip.countDocuments({ 
      transporter: req.user._id,
      tripStatus: 'Cancelled' 
    });

    res.status(200).json({
      success: true,
      stats: {
        byStatus: stats,
        totalTrips,
        completedTrips,
        cancelledTrips,
        completionRate: totalTrips ? ((completedTrips / totalTrips) * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};