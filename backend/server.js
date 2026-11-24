import "dotenv/config";

import app from "./src/app.js";
import { seedDefaultSafetyZones } from "./src/services/seed.service.js";
import { seedDefaultAdminUser } from "./src/services/adminAuth.service.js";

const PORT = process.env.PORT || 5050;

async function bootstrap() {
  try {
    await seedDefaultSafetyZones();
    await seedDefaultAdminUser();
    console.log("Database initialized with demo safety zones and authority admin.");
  } catch (err) {
    console.error("Bootstrap warning:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Smart Tourist Safety API running on port ${PORT}`);
    console.log(`Authority Dashboard accessible at: http://localhost:${PORT}/admin`);
  });
}

bootstrap();
