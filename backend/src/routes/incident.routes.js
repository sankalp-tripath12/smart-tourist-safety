import { Router } from "express";
import {
  triggerSos,
  fetchAllIncidents,
  fetchIncidentById,
  fetchTouristIncidents,
  patchIncidentStatus,
} from "../controllers/incident.controller.js";

const router = Router();

router.post("/sos", triggerSos);
router.get("/", fetchAllIncidents);
router.get("/:id", fetchIncidentById);
router.get("/tourist/:touristId", fetchTouristIncidents);
router.patch("/:id/status", patchIncidentStatus);

export default router;
