import express from 'express';
import {
  createProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleAvailability,
  getProductsByDistrict,
  findProductsNearby,
  getProductsByFarmer,
  getProductStats
} from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/nearby/search', findProductsNearby);
router.get('/location/:district', getProductsByDistrict);
router.get('/farmer/:farmerId', getProductsByFarmer);
router.get('/:id', getProductById);

// Protected routes - Admin only
router.get('/stats/overview', protect, authorizeRoles('Admin', 'SuperAdmin'), getProductStats);

// Protected routes - Farmers only
router.post('/', protect, authorizeRoles('Farmer'), createProduct);
router.get('/farmer/my-products', protect, authorizeRoles('Farmer'), getMyProducts);
router.put('/:id', protect, authorizeRoles('Farmer'), updateProduct);
router.patch('/:id/availability', protect, authorizeRoles('Farmer'), toggleAvailability);

// Protected routes - Owner or Admin
router.delete('/:id', protect, deleteProduct);

export default router;