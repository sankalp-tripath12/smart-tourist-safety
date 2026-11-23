import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import touristRoutes from "./routes/tourist.routes.js";
import geoFenceRoutes from "./routes/geoFence.routes.js";
import incidentRoutes from "./routes/incident.routes.js";
import anomalyRoutes from "./routes/anomaly.routes.js";
import safetyScoreRoutes from "./routes/safetyScore.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/health", healthRoutes);
app.use("/api/tourists", touristRoutes);
app.use("/api/geofence", geoFenceRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/anomalies", anomalyRoutes);
app.use("/api/safety-score", safetyScoreRoutes);

export default app;
