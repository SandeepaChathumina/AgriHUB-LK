// controllers/tripController.js
import Trip from "../models/Trip.js";
import Order from "../models/Order.js";
import Vehicle from "../models/Vehicle.js";
import Transporter from "../models/Transporter.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Check vehicle availability
const checkVehicleAvailability = async (
  vehicleId,
  scheduledPickup,
  estimatedDelivery,
  excludeTripId = null,
) => {
  const query = {
    vehicle: vehicleId,
    tripStatus: { $in: ["Accepted", "In Progress"] },
    $or: [
      {
        "schedule.scheduledPickup": { $lte: estimatedDelivery },
        "schedule.estimatedDelivery": { $gte: scheduledPickup },
      },
    ],
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
      status: "Confirmed",
      deliveryStatus: "Requested",
      transporter: null,
    };

    const orders = await Order.find(filter)
      .populate({
        path: "product",
        select:
          "productName category quantity unit price images pickupLocation",
        populate: { path: "farmer", select: "fullName phone location" },
      })
      .populate("distributor", "fullName phone")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    const enhancedOrders = orders.map((order) => ({
      ...order.toObject(),
      pickupLocation: order.product?.pickupLocation || null,
      farmer: order.product?.farmer || null,
    }));

    res.status(200).json({
      success: true,
      count: enhancedOrders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      orders: enhancedOrders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new trip (Transporter directly creates trip for order)
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
      additionalCharges,
    } = req.body;

    const transporterId = req.user._id;

    // Validation
    if (
      !orderId ||
      !vehicleId ||
      !scheduledPickup ||
      !estimatedDelivery ||
      !baseFare
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check transporter
    const transporter = await Transporter.findById(transporterId);
    if (!transporter) {
      return res
        .status(404)
        .json({ success: false, message: "Transporter not found" });
    }

    // Check order
    const order = await Order.findById(orderId)
      .populate({
        path: "product",
        populate: { path: "farmer", select: "fullName phone location" },
      })
      .populate("distributor", "fullName phone");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "Confirmed" || order.deliveryStatus !== "Requested") {
      return res.status(400).json({
        success: false,
        message: "Order is not available for transport",
      });
    }

    if (order.transporter) {
      return res.status(400).json({
        success: false,
        message: "Order already assigned to a transporter",
      });
    }

    // Check if an active trip request already exists for this order
    const existingTrip = await Trip.findOne({
      order: orderId,
      requestStatus: { $in: ["pending", "accepted"] },
    });

    if (existingTrip) {
      return res.status(400).json({
        success: false,
        message: "An active transport request already exists for this order",
      });
    }

    // Check vehicle
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      transporter: transporterId,
    });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or does not belong to you",
      });
    }

    if (vehicle.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: `Vehicle is not available (status: ${vehicle.status})`,
      });
    }

    // Check availability
    const pickupDate = new Date(scheduledPickup);
    const deliveryDate = new Date(estimatedDelivery);

    if (pickupDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Pickup time cannot be in the past",
      });
    }

    if (deliveryDate <= pickupDate) {
      return res.status(400).json({
        success: false,
        message: "Delivery must be after pickup",
      });
    }

    const isAvailable = await checkVehicleAvailability(
      vehicleId,
      pickupDate,
      deliveryDate,
    );
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Vehicle is already assigned for this time slot",
      });
    }

    // Get locations
    const pickupLocation = order.product?.pickupLocation;
    const dropoffLocation = order.deliveryAddress;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: "Pickup or dropoff location not found",
      });
    }

    // Create trip
    const tripData = {
      order: orderId,
      transporter: transporterId,
      vehicle: vehicleId,
      requestType: "transporter-initiated",
      requestStatus: "accepted",
      proposedBy: transporterId,
      tripStatus: "Pending",
      pickupLocation: {
        address: pickupLocation.address,
        city: pickupLocation.city || order.product?.farmer?.location?.city,
        district:
          pickupLocation.district || order.product?.farmer?.location?.district,
        coordinates: pickupLocation.coordinates,
      },
      dropoffLocation: {
        address: dropoffLocation.addressLine,
        city: dropoffLocation.city,
        coordinates: dropoffLocation.coordinates,
      },
      schedule: {
        scheduledPickup: pickupDate,
        estimatedDelivery: deliveryDate,
      },
      costs: {
        baseFare: Number(baseFare),
        distanceCharge: Number(distanceCharge) || 0,
        additionalCharges: additionalCharges || [],
        totalCost: Number(baseFare) + (Number(distanceCharge) || 0),
      },
      createdBy: transporterId,
    };

    const trip = new Trip(tripData);
    trip.addTimelineEvent(
      "Created",
      "Trip created by transporter",
      transporterId,
    );
    trip.addTimelineEvent(
      "Accepted",
      "Request auto-accepted by transporter",
      transporterId,
    );
    await trip.save();

    // Update order and vehicle
    order.transporter = transporterId;
    order.deliveryStatus = "Accepted";
    await order.save();

    vehicle.status = "On Delivery";
    await vehicle.save();

    await trip.populate([
      { path: "order", populate: { path: "product" } },
      { path: "transporter", select: "businessName phone" },
      { path: "vehicle", select: "vehicleId category registrationNumber" },
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
    const { status, page = 1, limit = 10, search = "", sort = "desc" } =
      req.query;

    const filter = { transporter: req.user._id };
    if (status) filter.tripStatus = status;

    const searchTrim = typeof search === "string" ? search.trim() : "";
    if (searchTrim) {
      const regex = new RegExp(escapeRegex(searchTrim), "i");
      const productIds = await Product.find({ productName: regex }).distinct(
        "_id",
      );
      const orderIdsFromProduct = await Order.find({
        product: { $in: productIds },
      }).distinct("_id");
      const distributorIds = await User.find({
        $or: [{ fullName: regex }, { businessName: regex }],
      }).distinct("_id");
      const orderIdsFromDistributor = await Order.find({
        distributor: { $in: distributorIds },
      }).distinct("_id");
      const vehicleIds = await Vehicle.find({
        transporter: req.user._id,
        $or: [
          { registrationNumber: regex },
          { brand: regex },
          { model: regex },
          { vehicleId: regex },
        ],
      }).distinct("_id");

      const orClauses = [
        { tripId: regex },
        { "pickupLocation.address": regex },
        { "dropoffLocation.address": regex },
        { "dropoffLocation.city": regex },
      ];
      if (orderIdsFromProduct.length)
        orClauses.push({ order: { $in: orderIdsFromProduct } });
      if (orderIdsFromDistributor.length)
        orClauses.push({ order: { $in: orderIdsFromDistributor } });
      if (vehicleIds.length) orClauses.push({ vehicle: { $in: vehicleIds } });

      filter.$or = orClauses;
    }

    const sortDirection = sort === "asc" ? 1 : -1;

    const trips = await Trip.find(filter)
      .populate({
        path: "order",
        populate: [
          {
            path: "product",
            select: "productName category images unit pickupLocation",
          },
          { path: "distributor", select: "fullName" },
        ],
      })
      .populate("vehicle", "vehicleId category brand model registrationNumber")
      .sort({ createdAt: sortDirection })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: trips.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      trips,
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid trip ID" });
    }

    const trip = await Trip.findById(req.params.id)
      .populate({
        path: "order",
        populate: [
          {
            path: "product",
            select: "productName category images unit pickupLocation quantity",
            populate: { path: "farmer" },
          },
          { path: "distributor" },
        ],
      })
      .populate("transporter")
      .populate("vehicle")
      .populate("createdBy", "fullName");

    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    // Safe access check
    if (
      (!trip.transporter ||
        trip.transporter._id.toString() !== req.user._id.toString()) &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update trip status - FIXED to set order as Delivered
// @route   PATCH /api/trips/:id/status
export const updateTripStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ["Confirmed", "In Progress", "Completed", "Cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const trip = await Trip.findById(req.params.id).populate("transporter").populate("vehicle");
    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    // Check ownership - transporter must be set and must match current user
    if (
      !trip.transporter ||
      trip.transporter._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this trip",
      });
    }

    // Status transition validation
    const oldStatus = trip.tripStatus;

    if (oldStatus === "Completed" || oldStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${oldStatus} trip`,
      });
    }

    if (
      status === "Cancelled" &&
      !["Pending", "Accepted"].includes(oldStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Can only cancel pending or accepted trips",
      });
    }

    // Update trip
    trip.tripStatus = status;
    trip.addTimelineEvent(status, `Status updated to ${status}`, req.user._id);

    // Update actual times and sync order delivery status
    if (status === "Confirmed") {
      // Trip confirmed - ready for pickup
      // No order update needed for this status
    } else if (status === "In Progress") {
      // Trip in progress - started delivery, vehicle is on delivery
      trip.schedule.actualPickup = new Date();
      
      // Update vehicle status to "On Delivery"
      await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: "On Delivery" });
      
      // Update order delivery status
      await Order.findByIdAndUpdate(trip.order, {
        deliveryStatus: "In Transit",
      });
    } else if (status === "Completed") {
      trip.schedule.actualDelivery = new Date();

      // Update vehicle status to "Available"
      await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: "Available" });

      // IMPORTANT: Update order to DELIVERED so reviews can be written
      const updatedOrder = await Order.findByIdAndUpdate(
        trip.order,
        {
          deliveryStatus: "Delivered",
          status: "Delivered",
        },
        { new: true },
      );

      console.log(
        `✅ Order ${trip.order} marked as DELIVERED - Reviews can now be written`,
      );
    } else if (status === "Cancelled") {
      trip.cancellationReason = reason || "No reason provided";
      trip.cancelledAt = new Date();

      // Make vehicle available again
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "Available" });

      // Free up the order
      await Order.findByIdAndUpdate(trip.order, {
        transporter: null,
        deliveryStatus: "Cancelled",
      });
    }

    await trip.save();

    res.status(200).json({
      success: true,
      message: `Trip ${status} successfully`,
      trip,
    });
  } catch (error) {
    console.error("Update trip status error:", error);
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
        message: "Vehicle ID required",
      });
    }

    const trip = await Trip.findById(req.params.id).populate("transporter");
    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    // Check ownership
    if (
      (!trip.transporter ||
        trip.transporter._id.toString() !== req.user._id.toString()) &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Can only change vehicle for pending/accepted trips
    if (!["Pending", "Accepted"].includes(trip.tripStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot change vehicle for ongoing or completed trips",
      });
    }

    // Check new vehicle
    const newVehicle = await Vehicle.findOne({
      _id: vehicleId,
      transporter: req.user._id,
    });

    if (!newVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (newVehicle.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "New vehicle is not available",
      });
    }

    // Check availability for the time slot
    const isAvailable = await checkVehicleAvailability(
      vehicleId,
      trip.schedule.scheduledPickup,
      trip.schedule.estimatedDelivery,
      trip._id,
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "New vehicle is not available for this time slot",
      });
    }

    // Free up old vehicle
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "Available" });

    // Assign new vehicle
    trip.vehicle = vehicleId;
    newVehicle.status = "On Delivery";
    await newVehicle.save();

    trip.addTimelineEvent(
      "Vehicle Changed",
      `Vehicle changed to ${newVehicle.vehicleId}`,
      req.user._id,
    );
    await trip.save();

    res.status(200).json({
      success: true,
      message: "Vehicle changed successfully",
      trip,
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

    const trip = await Trip.findById(req.params.id).populate("transporter");
    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    // Check ownership
    if (
      !trip.transporter ||
      trip.transporter._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Can only cancel pending/accepted trips
    if (!["Pending", "Accepted"].includes(trip.tripStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel ongoing or completed trips",
      });
    }

    // Update trip
    trip.tripStatus = "Cancelled";
    trip.cancellationReason = reason || "Cancelled by transporter";
    trip.cancelledAt = new Date();
    trip.addTimelineEvent(
      "Cancelled",
      reason || "Trip cancelled",
      req.user._id,
    );
    await trip.save();

    // Free up vehicle
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "Available" });

    // Free up order
    await Order.findByIdAndUpdate(trip.order, {
      transporter: null,
      deliveryStatus: "Requested",
    });

    res.status(200).json({
      success: true,
      message: "Trip cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trip statistics
// @route   GET /api/trips/stats
export const getTripStats = async (req, res) => {
  try {
    const transporterId = req.user._id;

    const stats = await Trip.aggregate([
      { $match: { transporter: transporterId } },
      {
        $group: {
          _id: "$tripStatus",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$costs.totalCost" },
        },
      },
    ]);

    const totalTrips = await Trip.countDocuments({ transporter: transporterId });
    const completedTrips = await Trip.countDocuments({
      transporter: transporterId,
      tripStatus: "Completed",
    });
    const cancelledTrips = await Trip.countDocuments({
      transporter: transporterId,
      tripStatus: "Cancelled",
    });
    const activeTrips = await Trip.countDocuments({
      transporter: transporterId,
      tripStatus: {
        $in: ["Pending", "Accepted", "Confirmed", "In Progress"],
      },
    });

    const onTimeAgg = await Trip.aggregate([
      {
        $match: {
          transporter: transporterId,
          tripStatus: "Completed",
          "schedule.actualDelivery": { $exists: true, $ne: null },
          "schedule.estimatedDelivery": { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          onTime: {
            $lte: ["$schedule.actualDelivery", "$schedule.estimatedDelivery"],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          onTimeCount: { $sum: { $cond: ["$onTime", 1, 0] } },
        },
      },
    ]);

    const onTimeRow = onTimeAgg[0];
    const onTimeSampleSize = onTimeRow?.total || 0;
    const onTimeDeliveryRate =
      onTimeSampleSize > 0
        ? ((onTimeRow.onTimeCount / onTimeSampleSize) * 100).toFixed(1)
        : null;

    const revenueAgg = await Trip.aggregate([
      {
        $match: {
          transporter: transporterId,
          tripStatus: "Completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$costs.totalCost" },
        },
      },
    ]);
    const revenueCompleted = revenueAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      stats: {
        byStatus: stats,
        totalTrips,
        completedTrips,
        cancelledTrips,
        activeTrips,
        completionRate: totalTrips
          ? ((completedTrips / totalTrips) * 100).toFixed(1)
          : "0",
        onTimeDeliveryRate,
        onTimeSampleSize,
        revenueCompleted,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request a trip by distributor
// @route   POST /api/trips/request
export const requestTrip = async (req, res) => {
  try {
    const {
      orderId,
      vehicleId,
      scheduledPickup,
      estimatedDelivery,
      expectedDeliveryFee,
    } = req.body;

    const distributorId = req.user._id;

    // Validation
    if (
      !orderId ||
      !vehicleId ||
      !scheduledPickup ||
      !estimatedDelivery ||
      !expectedDeliveryFee
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check order
    const order = await Order.findById(orderId)
      .populate({
        path: "product",
        populate: { path: "farmer", select: "fullName phone location" },
      })
      .populate("distributor", "fullName phone");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check if distributor owns the order
    if (order.distributor._id.toString() !== distributorId.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized - You do not own this order",
        });
    }

    // Check if order is eligible for transport
    if (order.status !== "Confirmed" || order.deliveryStatus !== "Requested") {
      return res.status(400).json({
        success: false,
        message: `Order is not available for transport request. Status: ${order.status}, Delivery: ${order.deliveryStatus}`,
      });
    }

    // Check if an active trip request already exists for this order
    const existingTrip = await Trip.findOne({
      order: orderId,
      requestStatus: { $in: ["pending", "accepted"] },
    });

    if (existingTrip) {
      return res.status(400).json({
        success: false,
        message: "An active transport request already exists for this order",
      });
    }

    // Check vehicle
    const vehicle = await Vehicle.findById(vehicleId).populate("transporter");
    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    if (!vehicle.transporter) {
      return res.status(400).json({
        success: false,
        message: "Vehicle does not have an assigned transporter",
      });
    }

    if (vehicle.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: `Vehicle is not available (status: ${vehicle.status})`,
      });
    }

    // Check vehicle availability for the time slot
    const pickupDate = new Date(scheduledPickup);
    const deliveryDate = new Date(estimatedDelivery);

    if (pickupDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Pickup time cannot be in the past",
      });
    }

    if (deliveryDate <= pickupDate) {
      return res.status(400).json({
        success: false,
        message: "Delivery must be after pickup",
      });
    }

    // Get locations
    const pickupLocation = order.product?.pickupLocation;
    const dropoffLocation = order.deliveryAddress;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: "Pickup or dropoff location not found",
      });
    }

    // Create trip request (status = Pending, waiting for transporter acceptance)
    const tripData = {
      order: orderId,
      transporter: vehicle.transporter,
      vehicle: vehicleId,
      requestType: "distributor-initiated",
      requestStatus: "pending",
      proposedBy: distributorId,
      tripStatus: "Pending",
      pickupLocation: {
        address: pickupLocation.address,
        city: pickupLocation.city || order.product?.farmer?.location?.city,
        district:
          pickupLocation.district || order.product?.farmer?.location?.district,
        coordinates: pickupLocation.coordinates,
      },
      dropoffLocation: {
        address: dropoffLocation.addressLine,
        city: dropoffLocation.city,
        coordinates: dropoffLocation.coordinates,
      },
      schedule: {
        scheduledPickup: pickupDate,
        estimatedDelivery: deliveryDate,
      },
      costs: {
        baseFare: Number(expectedDeliveryFee),
        distanceCharge: 0,
        additionalCharges: [],
        totalCost: Number(expectedDeliveryFee),
      },
      createdBy: distributorId,
    };

    const trip = new Trip(tripData);
    trip.addTimelineEvent(
      "Created",
      `Transport request created by distributor with expected fee: LKR ${expectedDeliveryFee}`,
      distributorId,
    );
    await trip.save();

    // Update order to show transport requested
    order.deliveryStatus = "Transport Requested";
    await order.save();

    await trip.populate([
      { path: "order", populate: { path: "product" } },
      {
        path: "vehicle",
        select: "vehicleId category registrationNumber brand model",
      },
      { path: "transporter", select: "businessName phone" },
      { path: "createdBy", select: "fullName" },
    ]);

    res.status(201).json({
      success: true,
      message:
        "Transport request sent successfully. Waiting for transporter acceptance.",
      trip,
    });
  } catch (error) {
    console.error("Error requesting trip:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to request transport",
    });
  }
};

// @desc    Get order details for trip creation (for transporters)
// @route   GET /api/trips/order/:orderId
export const getOrderForTrip = async (req, res) => {
  try {
    const { orderId } = req.params;
    const transporterId = req.user._id;

    const order = await Order.findById(orderId)
      .populate({
        path: "product",
        populate: { path: "farmer", select: "fullName phone location" },
      })
      .populate("distributor", "fullName phone email");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check if order is available for transport
    if (order.status !== "Confirmed" || order.deliveryStatus !== "Requested") {
      return res.status(400).json({
        success: false,
        message: "Order is not available for transport",
      });
    }

    // Check if already assigned to another transporter
    if (
      order.transporter &&
      order.transporter.toString() !== transporterId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Order already assigned to another transporter",
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get order for trip error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request order delivery (Transporter bids on available order)
// @route   POST /api/trips/request-order
export const requestOrderDelivery = async (req, res) => {
  try {
    const {
      orderId,
      vehicleId,
      proposedFare,
      scheduledPickup,
      estimatedDelivery,
    } = req.body;

    const transporterId = req.user._id;

    // Validation
    if (
      !orderId ||
      !vehicleId ||
      !proposedFare ||
      !scheduledPickup ||
      !estimatedDelivery
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check transporter
    const transporter = await Transporter.findById(transporterId);
    if (!transporter) {
      return res
        .status(404)
        .json({ success: false, message: "Transporter not found" });
    }

    // Check order
    const order = await Order.findById(orderId)
      .populate({
        path: "product",
        populate: { path: "farmer", select: "fullName phone location" },
      })
      .populate("distributor", "fullName phone");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "Confirmed" || order.deliveryStatus !== "Requested") {
      return res.status(400).json({
        success: false,
        message: "Order is not available for transport",
      });
    }

    // Check if an active trip request already exists for this order
    const existingTrip = await Trip.findOne({
      order: orderId,
      requestStatus: { $in: ["pending", "accepted"] },
    });

    if (existingTrip) {
      return res.status(400).json({
        success: false,
        message: "An active transport request already exists for this order",
      });
    }

    // Check vehicle
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      transporter: transporterId,
    });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or does not belong to you",
      });
    }

    if (vehicle.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: `Vehicle is not available (status: ${vehicle.status})`,
      });
    }

    // Check availability
    const pickupDate = new Date(scheduledPickup);
    const deliveryDate = new Date(estimatedDelivery);

    if (pickupDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Pickup time cannot be in the past",
      });
    }

    if (deliveryDate <= pickupDate) {
      return res.status(400).json({
        success: false,
        message: "Delivery must be after pickup",
      });
    }

    const isAvailable = await checkVehicleAvailability(
      vehicleId,
      pickupDate,
      deliveryDate,
    );
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Vehicle is already assigned for this time slot",
      });
    }

    // Get locations
    const pickupLocation = order.product?.pickupLocation;
    const dropoffLocation = order.deliveryAddress;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: "Pickup or dropoff location not found",
      });
    }

    // Create trip request (waiting for distributor acceptance)
    const tripData = {
      order: orderId,
      transporter: transporterId,
      vehicle: vehicleId,
      requestType: "transporter-initiated-request",
      requestStatus: "pending",
      proposedBy: transporterId,
      tripStatus: "Pending",
      pickupLocation: {
        address: pickupLocation.address,
        city: pickupLocation.city || order.product?.farmer?.location?.city,
        district:
          pickupLocation.district || order.product?.farmer?.location?.district,
        coordinates: pickupLocation.coordinates,
      },
      dropoffLocation: {
        address: dropoffLocation.addressLine,
        city: dropoffLocation.city,
        coordinates: dropoffLocation.coordinates,
      },
      schedule: {
        scheduledPickup: pickupDate,
        estimatedDelivery: deliveryDate,
      },
      costs: {
        baseFare: Number(proposedFare),
        distanceCharge: 0,
        additionalCharges: [],
        totalCost: Number(proposedFare),
      },
      createdBy: transporterId,
    };

    const trip = new Trip(tripData);
    trip.addTimelineEvent(
      "Created",
      `Delivery request from transporter with proposed fare: LKR ${proposedFare}`,
      transporterId,
    );
    await trip.save();

    await trip.populate([
      { path: "order", populate: { path: "product" } },
      {
        path: "vehicle",
        select: "vehicleId category registrationNumber brand model",
      },
      { path: "transporter", select: "businessName phone" },
      { path: "proposedBy", select: "fullName" },
    ]);

    res.status(201).json({
      success: true,
      message:
        "Delivery request submitted. Waiting for distributor acceptance.",
      trip,
    });
  } catch (error) {
    console.error("Error requesting order delivery:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to request delivery",
    });
  }
};

// @desc    Get incoming trip requests (both distributor and transporter requests)
// @route   GET /api/trips/incoming-requests
export const getIncomingRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, status = "pending" } = req.query;

    let filter = {};

    if (userRole === "Transporter") {
      // Transporter receives distributor-initiated requests
      filter = {
        transporter: userId,
        requestType: "distributor-initiated",
        requestStatus: status,
      };
    } else if (userRole === "Distributor") {
      // Distributor receives transporter-initiated requests for their orders
      // Find all orders belonging to this distributor, then find trips for those orders
      const orders = await Order.find({ distributor: userId }).select('_id');
      const orderIds = orders.map(o => o._id);
      
      filter = {
        order: { $in: orderIds },
        requestType: "transporter-initiated-request",
        requestStatus: status,
      };
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Not authorized - Only Transporters and Distributors can view requests",
      });
    }

    const requests = await Trip.find(filter)
      .populate({
        path: "order",
        populate: { path: "product", populate: { path: "farmer" } },
      })
      .populate("transporter", "businessName phone email")
      .populate("vehicle", "vehicleId category vehicleType status")
      .populate("proposedBy", "fullName phone email businessName")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      requests,
    });
  } catch (error) {
    console.error("Get incoming requests error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch incoming requests",
    });
  }
};

// @desc    Accept trip request
// @route   PATCH /api/trips/requests/:id/accept
export const acceptRequest = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;

    const trip = await Trip.findById(tripId)
      .populate("order")
      .populate("transporter")
      .populate("vehicle")
      .populate("proposedBy");

    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip request not found" });
    }

    // Check authorization and request type
    if (userRole === "Transporter") {
      // Transporter must be the one assigned to this request AND be accepting a distributor request
      if (
        !trip.transporter ||
        trip.transporter._id.toString() !== userId.toString()
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Not authorized - This is not your request",
          });
      }
      if (trip.requestType !== "distributor-initiated") {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid request type for transporter",
          });
      }
    }

    if (userRole === "Distributor") {
      // Distributor must own the order that this trip is for AND be accepting a transporter request
      const order = await Order.findById(trip.order);
      if (!order || order.distributor.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Not authorized - This order does not belong to you",
          });
      }
      if (trip.requestType !== "transporter-initiated-request") {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid request type for distributor",
          });
      }
    }

    if (trip.requestStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${trip.requestStatus}`,
      });
    }

    // Check order and vehicle still available
    const order = await Order.findById(trip.order);
    if (
      !order ||
      (order.deliveryStatus !== "Requested" &&
        order.deliveryStatus !== "Transport Requested")
    ) {
      return res.status(400).json({
        success: false,
        message: "Order is no longer available",
      });
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    if (!vehicle || vehicle.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "Vehicle is no longer available",
      });
    }

    // Update trip
    trip.requestStatus = "accepted";
    trip.tripStatus = "Accepted";
    trip.addTimelineEvent(
      "Accepted",
      `Request accepted by ${userRole}`,
      userId,
    );
    await trip.save();

    // Update order
    order.transporter = trip.transporter._id;
    order.deliveryStatus = "Accepted";
    await order.save();

    // Update vehicle
    vehicle.status = "On Delivery";
    await vehicle.save();

    await trip.populate([
      { path: "order", populate: { path: "product" } },
      { path: "transporter", select: "businessName phone" },
      { path: "vehicle", select: "vehicleId category" },
    ]);

    res.status(200).json({
      success: true,
      message: "Request accepted successfully",
      trip,
    });
  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to accept request",
    });
  }
};

// @desc    Reject trip request
// @route   PATCH /api/trips/requests/:id/reject
export const rejectRequest = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user._id;
    const userRole = req.user.role;
    const { rejectionReason } = req.body;

    const trip = await Trip.findById(tripId)
      .populate("order")
      .populate("transporter")
      .populate("proposedBy");

    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip request not found" });
    }

    // Check authorization
    if (
      userRole === "Transporter" &&
      trip.transporter._id.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (userRole === "Distributor") {
      // Distributor must own the order that this trip is for
      const order = await Order.findById(trip.order);
      if (!order || order.distributor.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized - Order does not belong to you" });
      }
    }

    if (trip.requestStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${trip.requestStatus}`,
      });
    }

    // Update trip
    trip.requestStatus = "rejected";
    trip.rejectionReason = rejectionReason || "No reason provided";
    trip.rejectedAt = new Date();
    trip.rejectedBy = userId;
    trip.addTimelineEvent(
      "Rejected",
      `Request rejected by ${userRole}: ${trip.rejectionReason}`,
      userId,
    );
    await trip.save();

    // Revert order status - back to Requested for other transporters to see
    await Order.findByIdAndUpdate(trip.order, {
      transporter: null,
      deliveryStatus: "Requested",
    });

    // Make vehicle available again
    await Vehicle.findByIdAndUpdate(trip.vehicle, { status: "Available" });

    res.status(200).json({
      success: true,
      message: "Request rejected successfully",
      trip,
    });
  } catch (error) {
    console.error("Reject request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reject request",
    });
  }
};
