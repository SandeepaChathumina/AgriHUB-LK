import express from "express";
import { getImpactStats } from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/impact-stats", protect, authorizeRoles("Admin"), getImpactStats);

export default router;