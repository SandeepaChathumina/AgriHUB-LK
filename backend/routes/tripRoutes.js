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
  getOrderForTrip,
  requestOrderDelivery,
  getIncomingRequests,
  acceptRequest,
  rejectRequest
} from '../controllers/tripController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// TRANSPORTER ROUTES
router.get('/available-orders', authorizeRoles('Transporter', 'Admin'), getAvailableOrders);
router.get('/order/:orderId', authorizeRoles('Transporter', 'Admin'), getOrderForTrip);
router.post('/', authorizeRoles('Transporter', 'Admin'), createTrip);
router.post('/request-order', authorizeRoles('Transporter', 'Admin'), requestOrderDelivery);
router.get('/my-trips', authorizeRoles('Transporter', 'Admin'), getMyTrips);
router.get('/stats', authorizeRoles('Transporter', 'Admin'), getTripStats);

// DISTRIBUTOR ROUTES
router.post('/request', authorizeRoles('Distributor', 'Admin'), requestTrip);

// SHARED ROUTES (Both Transporter and Distributor)
router.get('/incoming-requests', authorizeRoles('Transporter', 'Distributor', 'Admin'), getIncomingRequests);
router.patch('/requests/:id/accept', authorizeRoles('Transporter', 'Distributor', 'Admin'), acceptRequest);
router.patch('/requests/:id/reject', authorizeRoles('Transporter', 'Distributor', 'Admin'), rejectRequest);

// GENERAL TRIP ROUTES (Both roles)
router.get('/:id', authorizeRoles('Transporter', 'Distributor', 'Admin'), getTripById);
router.patch('/:id/status', authorizeRoles('Transporter', 'Admin'), updateTripStatus);
router.patch('/:id/vehicle', authorizeRoles('Transporter', 'Admin'), changeVehicle);
router.delete('/:id', authorizeRoles('Transporter', 'Admin'), cancelTrip);

export default router;