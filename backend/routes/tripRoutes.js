import express from 'express';
import {
  getAvailableOrders,
  createTrip,
  getMyTrips,
  getTripById,
  updateTripStatus,
  changeVehicle,
  cancelTrip,
  getTripStats,
  requestTrip,
  getOrderForTrip                    // ← Added
} from '../controllers/tripController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and Transporter role
router.use(protect);
router.use(authorizeRoles('Transporter', 'Admin'));

// NEW: Get order details for trip creation
router.get('/order/:orderId', getOrderForTrip);

// Get available orders for transport
router.get('/available-orders', getAvailableOrders);

// Get my trips
router.get('/my-trips', getMyTrips);

// Get trip statistics
router.get('/stats', getTripStats);

// Create new trip
router.post('/', createTrip);

// Get single trip
router.get('/:id', getTripById);

// Update trip status
router.patch('/:id/status', updateTripStatus);

// Change vehicle for trip
router.patch('/:id/vehicle', changeVehicle);

// Cancel trip
router.delete('/:id', cancelTrip);

// Distributor route for requesting transport - Allow Distributors
router.post('/request', authorizeRoles('Distributor'), requestTrip);

export default router;