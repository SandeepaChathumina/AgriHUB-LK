import express from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehiclesByTransporter,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  uploadVehicleImages,
  getAvailableVehicles    // <-- ADD THIS IMPORT
} from '../controllers/vehicleController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Image upload route - Only transporters
router.post('/upload-images', authorizeRoles('Transporter'), upload.array('images', 5), uploadVehicleImages);

// Vehicle CRUD routes - Transporters only for write operations
router.post('/', authorizeRoles('Transporter'), createVehicle);
router.put('/:id', authorizeRoles('Transporter'), updateVehicle);
router.delete('/:id', authorizeRoles('Transporter'), deleteVehicle);
router.patch('/:id/status', authorizeRoles('Transporter'), updateVehicleStatus);

// READ routes
// Available vehicles endpoint 
router.get('/available', authorizeRoles('Distributor', 'Transporter', 'Admin'), getAvailableVehicles);

// General vehicles endpoint
router.get('/', authorizeRoles('Transporter', 'Distributor', 'Admin'), getAllVehicles);
router.get('/transporter/:transporterId', authorizeRoles('Transporter', 'Distributor', 'Admin'), getVehiclesByTransporter);
router.get('/:id', authorizeRoles('Transporter', 'Distributor', 'Admin'), getVehicleById);

export default router;