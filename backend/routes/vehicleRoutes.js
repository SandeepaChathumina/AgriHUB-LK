import express from 'express';
import {
  createVehicle,
  getAllVehicles,
  getVehiclesByTransporter,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus
} from '../controllers/vehicleController.js';

const router = express.Router();

router.post('/', createVehicle);
router.get('/', getAllVehicles);
router.get('/transporter/:transporterId', getVehiclesByTransporter);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);
router.patch('/:id/status', updateVehicleStatus);

export default router;