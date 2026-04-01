import express from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehiclesByTransporter,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  uploadVehicleImages
} from '../controllers/vehicleController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(authorizeRoles('Transporter', 'Admin'));

// Image upload route
router.post('/upload-images', upload.array('images', 5), uploadVehicleImages);

// Vehicle CRUD routes
router.post('/', createVehicle);
router.get('/', getAllVehicles);
router.get('/transporter/:transporterId', getVehiclesByTransporter);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.patch('/:id/status', updateVehicleStatus);

export default router;