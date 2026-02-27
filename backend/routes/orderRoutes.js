import express from 'express';

import { 
  placeOrder, 
  getMyOrders, 
  updateOrder, 
  deleteOrder,
  verifyPayment

} from '../controllers/orderController.js'; 

import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Public Route (No 'protect' middleware)
router.get('/success', verifyPayment);

// 2. Protected Routes
router.use(protect);

router.post('/', authorizeRoles('Distributor'), placeOrder);
router.get('/my-orders', authorizeRoles('Distributor'), getMyOrders);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;