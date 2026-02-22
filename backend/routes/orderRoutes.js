import express from 'express';
import { 
    placeOrder, 
    getMyOrders, 
    updateOrder, 
    deleteOrder 
} from '../controllers/orderController.js';

const router = express.Router();

// Create order
router.post('/', placeOrder);

// Get orders by distributor
router.get('/my-orders', getMyOrders);

// Update order
router.put('/:id', updateOrder);

// Delete order
router.delete('/:id', deleteOrder);

export default router;