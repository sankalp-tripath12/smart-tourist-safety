import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import touristRoutes from "./routes/tourist.routes.js";
import geoFenceRoutes from "./routes/geoFence.routes.js";
import incidentRoutes from "./routes/incident.routes.js";
import anomalyRoutes from "./routes/anomaly.routes.js";
import safetyScoreRoutes from "./routes/safetyScore.routes.js";
import auditLedgerRoutes from "./routes/auditLedger.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminStaticPath = path.resolve(__dirname, "../../admin");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static Authority Admin Dashboard
app.use("/admin", express.static(adminStaticPath));

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api/tourists", touristRoutes);
app.use("/api/geofence", geoFenceRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/anomalies", anomalyRoutes);
app.use("/api/safety-score", safetyScoreRoutes);
app.use("/api/audit-ledger", auditLedgerRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/admin", adminRoutes);

export default app;
