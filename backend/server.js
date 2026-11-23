import "dotenv/config";

import app from "./src/app.js";
import { seedDefaultSafetyZones } from "./src/services/seed.service.js";

const PORT = process.env.PORT || 5050;

// Seed demo safety zones if empty
seedDefaultSafetyZones()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Smart Tourist Safety API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to seed demo data on server start:", err);
    app.listen(PORT, () => {
      console.log(`Smart Tourist Safety API running on port ${PORT}`);
    });
  });
