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
  getProductStats,
  uploadProductImages  // Make sure this is imported
} from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/nearby/search', findProductsNearby);
router.get('/location/:district', getProductsByDistrict);
router.get('/:id', getProductById);

// Farmer specific routes
router.get('/farmer/my-products', protect, authorizeRoles('Farmer'), getMyProducts);
router.get('/farmer/:farmerId', getProductsByFarmer);

// Image upload route - THIS MUST BE PRESENT
router.post('/upload-images', protect, authorizeRoles('Farmer'), upload.array('images', 5), uploadProductImages);

// Protected routes - Farmers only
router.post('/', protect, authorizeRoles('Farmer'), createProduct);
router.put('/:id', protect, authorizeRoles('Farmer'), updateProduct);
router.patch('/:id/availability', protect, authorizeRoles('Farmer'), toggleAvailability);

// Protected routes - Owner or Admin
router.delete('/:id', protect, deleteProduct);

// Stats route
router.get('/stats/overview', protect, authorizeRoles('Admin', 'SuperAdmin'), getProductStats);

export default router;