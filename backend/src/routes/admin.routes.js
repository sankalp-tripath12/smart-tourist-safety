import { Router } from "express";
import {
  loginAdmin,
  getAdminProfile,
  logoutAdmin,
  fetchDashboardOverview,
  fetchTouristsAdmin,
  fetchIncidentsAdmin,
  patchIncidentStatusAdmin,
  fetchAnomaliesAdmin,
  patchAnomalyStatusAdmin,
  fetchClustersMap,
  fetchZonesAdmin,
} from "../controllers/admin.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";

const router = Router();

// Public auth route
router.post("/login", loginAdmin);

// Protected routes
router.use(requireAdminAuth);

router.get("/me", getAdminProfile);
router.post("/logout", logoutAdmin);
router.get("/dashboard", fetchDashboardOverview);
router.get("/tourists", fetchTouristsAdmin);
router.get("/incidents", fetchIncidentsAdmin);
router.patch("/incidents/:id/status", patchIncidentStatusAdmin);
router.get("/anomalies", fetchAnomaliesAdmin);
router.patch("/anomalies/:id/status", patchAnomalyStatusAdmin);
router.get("/clusters", fetchClustersMap);
router.get("/zones", fetchZonesAdmin);

export default router;
