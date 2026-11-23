import { Router } from "express";
import {
  runAnomalyDetection,
  simulateAnomaly,
  fetchAllAlerts,
  fetchTouristAlerts,
  patchAlertStatus,
} from "../controllers/anomaly.controller.js";

const router = Router();

router.post("/detect", runAnomalyDetection);
router.post("/simulate", simulateAnomaly);
router.get("/", fetchAllAlerts);
router.get("/tourist/:touristId", fetchTouristAlerts);
router.patch("/:id/status", patchAlertStatus);

export default router;
