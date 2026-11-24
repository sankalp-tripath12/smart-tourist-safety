import { Router } from "express";
import {
  verifyToken,
  generateToken,
  revokeVerificationToken,
} from "../controllers/verification.controller.js";
import { requireAdminAuth } from "../middleware/adminAuth.middleware.js";

const router = Router();

// Public QR verification endpoint (scanned by authority or venue scanner)
router.get("/:token", verifyToken);

// Token generation endpoint (used by mobile app to fetch or generate QR token)
router.post("/tokens", generateToken);

// Protected token revocation (authorities only)
router.patch("/tokens/:id/revoke", requireAdminAuth, revokeVerificationToken);

export default router;
