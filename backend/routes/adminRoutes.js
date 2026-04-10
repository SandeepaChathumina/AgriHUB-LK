import { getImpactStats } from "../controllers/adminController.js";

router.get("/impact-stats", authorizeRoles("Admin"), getImpactStats);