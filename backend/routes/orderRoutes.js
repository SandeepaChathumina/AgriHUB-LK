import express from "express";
import {
  placeOrder,
  getMyOrders,
  updateOrder,
  deleteOrder,
  verifyPayment,
  cancelPayment,
  getOrderById,
  retryPayment,
} from "../controllers/orderController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/success", verifyPayment);
router.get("/cancel", cancelPayment);

// Protected routes
router.use(protect);

router.get("/my-orders", authorizeRoles("Distributor"), getMyOrders);
router.post("/", authorizeRoles("Distributor"), placeOrder);
router.get("/:id", authorizeRoles("Distributor", "Admin"), getOrderById);
router.put("/:id", authorizeRoles("Distributor"), updateOrder);
router.delete("/:id", authorizeRoles("Distributor"), deleteOrder);
router.post("/:id/retry-payment", authorizeRoles("Distributor"), retryPayment);

export default router;