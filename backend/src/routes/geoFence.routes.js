import { Router } from "express";
import {
  fetchAllZones,
  fetchZoneById,
  addSafetyZone,
  evaluateLocation,
} from "../controllers/geoFence.controller.js";

const router = Router();

router.get("/zones", fetchAllZones);
router.get("/zones/:id", fetchZoneById);
router.post("/zones", addSafetyZone);
router.post("/evaluate", evaluateLocation);

export default router;
