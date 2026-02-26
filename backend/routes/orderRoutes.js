import express from "express";
import {
  placeOrder,
  getMyOrders,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import { protect,authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // All routes require authentication

// Only Distributors can place or view their orders
router.post('/', authorizeRoles('Distributor'), placeOrder);

router.get('/my-orders', authorizeRoles('Distributor'), getMyOrders);

// Update order
router.put("/:id", authorizeRoles('Distributor'), updateOrder);

// Delete order
router.delete("/:id", authorizeRoles('Distributor'), deleteOrder);

export default router;
