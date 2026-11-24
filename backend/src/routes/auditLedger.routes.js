import { Router } from "express";
import {
  fetchAuditRecords,
  runChainVerification,
  fetchAuditRecordById,
} from "../controllers/auditLedger.controller.js";

const router = Router();

router.get("/", fetchAuditRecords);
router.get("/verify", runChainVerification);
router.get("/:id", fetchAuditRecordById);

export default router;
