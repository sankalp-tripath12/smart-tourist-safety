import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import touristRoutes from "./routes/tourist.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/tourists", touristRoutes);

export default app;
