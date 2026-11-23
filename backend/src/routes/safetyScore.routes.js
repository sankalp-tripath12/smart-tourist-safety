import { Router } from "express";
import {
  getTouristSafetyScore,
  computeSafetyScorePost,
} from "../controllers/safetyScore.controller.js";

const router = Router();

router.get("/:touristId", getTouristSafetyScore);
router.post("/calculate", computeSafetyScorePost);

export default router;
