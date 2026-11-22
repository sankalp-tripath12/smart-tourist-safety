import { Router } from "express";

import {
  createTourist,
  fetchAllTourists,
  fetchTouristById,
} from "../controllers/tourist.controller.js";

const router = Router();

router.post("/", createTourist);
router.get("/", fetchAllTourists);
router.get("/:id", fetchTouristById);

export default router;
