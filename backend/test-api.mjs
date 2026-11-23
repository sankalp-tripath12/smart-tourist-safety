import app from "./src/app.js";
import { prisma } from "./src/config/prisma.js";
import { seedDefaultSafetyZones } from "./src/services/seed.service.js";

async function runTests() {
  console.log("=== STARTING DAY 2 BACKEND API TEST SUITE ===");
  await seedDefaultSafetyZones();

  const server = app.listen(5099);
  const BASE = "http://localhost:5099/api";

  let testTouristId = null;

  try {
    // 1. Health test
    console.log("\n[1] Testing Health Endpoint...");
    const healthRes = await fetch(`${BASE}/health`);
    const healthData = await healthRes.json();
    console.log("Health:", healthRes.status, healthData.message);
    if (healthRes.status !== 200 || !healthData.success) throw new Error("Health check failed");

    // 2. Fetch or create tourist
    console.log("\n[2] Testing Tourist Fetch & Registration...");
    const touristsRes = await fetch(`${BASE}/tourists`);
    const touristsData = await touristsRes.json();
    console.log("Tourists count:", touristsData.count);

    if (touristsData.count > 0) {
      testTouristId = touristsData.data[0].id;
      console.log("Found existing tourist ID:", testTouristId);
    } else {
      const regRes = await fetch(`${BASE}/tourists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Priya Patel",
          phone: "9123456789",
          email: "priya.demo@example.com",
          emergencyContactName: "Ramesh Patel",
          emergencyContactPhone: "9123450000",
          itinerary: "Delhi to Jaipur to Udaipur",
          visitExpiry: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        }),
      });
      const regData = await regRes.json();
      console.log("Created tourist:", regRes.status, regData.data.touristCode);
      testTouristId = regData.data.id;
    }

    // 3. Safety zones list
    console.log("\n[3] Testing Safety Zones Fetch...");
    const zonesRes = await fetch(`${BASE}/geofence/zones`);
    const zonesData = await zonesRes.json();
    console.log(`Fetched ${zonesData.count} safety zones.`);
    if (zonesData.count < 3) throw new Error("Expected seeded safety zones");

    // 4. Geofence evaluation (inside Amer Fort - Safe Zone)
    console.log("\n[4] Testing Geofence Evaluation at Amer Fort (26.9855, 75.8513)...");
    const evalRes1 = await fetch(`${BASE}/geofence/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: 26.9855, longitude: 75.8513 }),
    });
    const evalData1 = await evalRes1.json();
    console.log("Geofence Evaluation 1 risk:", evalData1.data.currentRiskLevel, "Active zones:", evalData1.data.activeZones.map(z => z.name));

    // Geofence evaluation (inside Danger Zone - Aravalli Ridge 26.9950, 75.8600)
    console.log("\n[5] Testing Geofence Evaluation at Danger Zone (26.9950, 75.8600)...");
    const evalRes2 = await fetch(`${BASE}/geofence/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: 26.9950, longitude: 75.8600 }),
    });
    const evalData2 = await evalRes2.json();
    console.log("Geofence Evaluation 2 risk:", evalData2.data.currentRiskLevel, "Active zones:", evalData2.data.activeZones.map(z => z.name));
    if (evalData2.data.currentRiskLevel !== "DANGER") throw new Error("Expected DANGER risk level");

    // 6. Safety Score Calculation
    console.log("\n[6] Testing Safety Score Engine...");
    const scoreRes = await fetch(`${BASE}/safety-score/${testTouristId}?latitude=26.9855&longitude=75.8513`);
    const scoreData = await scoreRes.json();
    console.log("Safety Score:", scoreData.data.safetyScore, "Category:", scoreData.data.category, "Explanation:", scoreData.data.explanation);

    // 7. SOS Incident creation
    console.log("\n[7] Testing Emergency SOS Incident Creation...");
    const sosRes = await fetch(`${BASE}/incidents/sos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        touristId: testTouristId,
        latitude: 26.9855,
        longitude: 75.8513,
        description: "Test SOS: Emergency button tapped by tourist.",
      }),
    });
    const sosData = await sosRes.json();
    console.log("SOS Created:", sosRes.status, "Ref:", sosData.data.referenceCode, "Status:", sosData.data.status);
    if (!sosData.data.referenceCode) throw new Error("Missing SOS referenceCode");

    // 8. Fetch Incidents
    console.log("\n[8] Testing Fetch All & Tourist Incidents...");
    const incRes = await fetch(`${BASE}/incidents/tourist/${testTouristId}`);
    const incData = await incRes.json();
    console.log(`Fetched ${incData.count} incidents for tourist.`);
    if (incData.count === 0) throw new Error("Expected at least 1 incident");

    // 9. Anomaly Simulation & Detection
    console.log("\n[9] Testing Anomaly Simulation...");
    const simRes = await fetch(`${BASE}/anomalies/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        touristId: testTouristId,
        scenario: "DANGER_ZONE_ENTRY",
      }),
    });
    const simData = await simRes.json();
    console.log("Simulated Anomaly:", simRes.status, "Type:", simData.data.type, "Severity:", simData.data.severity);

    // 10. Fetch Tourist Alerts
    console.log("\n[10] Testing Fetch Tourist Anomaly Alerts...");
    const alertsRes = await fetch(`${BASE}/anomalies/tourist/${testTouristId}`);
    const alertsData = await alertsRes.json();
    console.log(`Fetched ${alertsData.count} anomaly alerts for tourist.`);

    // 11. Recalculate Safety Score after SOS & Anomaly
    console.log("\n[11] Testing Safety Score Impact after Incidents...");
    const newScoreRes = await fetch(`${BASE}/safety-score/${testTouristId}?latitude=26.9950&longitude=75.8600`);
    const newScoreData = await newScoreRes.json();
    console.log("New Safety Score:", newScoreData.data.safetyScore, "Category:", newScoreData.data.category, "Factors count:", newScoreData.data.factors.length);

    console.log("\n>>> ALL DAY 2 BACKEND TESTS PASSED SUCCESSFULLY! <<<");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
