import express from 'express';
import {
  createProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleAvailability,
  getProductsByDistrict
} from '../controllers/productController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/location/:district', getProductsByDistrict);
router.get('/:id', getProductById);

// Protected routes - Farmers only
router.post('/', protect, authorizeRoles('Farmer'), createProduct);
router.get('/farmer/my-products', protect, authorizeRoles('Farmer'), getMyProducts);
router.put('/:id', protect, authorizeRoles('Farmer'), updateProduct);
router.patch('/:id/availability', protect, authorizeRoles('Farmer'), toggleAvailability);
router.delete('/:id', protect, deleteProduct); // Delete can be by owner or admin

export default router;