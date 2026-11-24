import app from "./src/app.js";
import { prisma } from "./src/config/prisma.js";
import { seedDefaultSafetyZones } from "./src/services/seed.service.js";
import { seedDefaultAdminUser } from "./src/services/adminAuth.service.js";
import { verifyAuditChain, appendAuditEvent, calculateRecordHash } from "./src/services/auditLedger.service.js";

async function runTests() {
  console.log("=== STARTING DAY 3 COMPREHENSIVE BACKEND API TEST SUITE ===");
  await seedDefaultSafetyZones();
  await seedDefaultAdminUser();

  const server = app.listen(5098);
  const BASE = "http://localhost:5098/api";

  let testTouristId = null;
  let adminToken = null;
  let validQrToken = null;
  let testIncidentId = null;

  try {
    // 1. Health check
    console.log("\n[1] Testing Health Endpoint...");
    const healthRes = await fetch(`${BASE}/health`);
    const healthData = await healthRes.json();
    console.log("Health:", healthRes.status, healthData.message);
    if (healthRes.status !== 200 || !healthData.success) throw new Error("Health check failed");

    // 2. Fetch or create tourist
    console.log("\n[2] Testing Tourist Registration & Auto-Audit Logging...");
    const regRes = await fetch(`${BASE}/tourists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test Tourist Day3",
        phone: "9876599999",
        email: "tourist.day3@example.com",
        emergencyContactName: "Emergency Contact",
        emergencyContactPhone: "9876511111",
        itinerary: "Jaipur - Delhi",
        visitExpiry: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
      }),
    });
    const regData = await regRes.json();
    console.log("Registered Tourist:", regRes.status, regData.data.touristCode);
    testTouristId = regData.data.id;
    if (!testTouristId) throw new Error("Tourist registration failed");

    // 3. Admin Authentication
    console.log("\n[3] Testing Authority Admin Authentication...");
    // 3a. Invalid credentials
    const badLoginRes = await fetch(`${BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@safetravel.gov.in", password: "WrongPassword!" }),
    });
    console.log("Bad login status (expected 401):", badLoginRes.status);
    if (badLoginRes.status !== 401) throw new Error("Expected 401 for bad password");

    // 3b. Valid credentials
    const loginRes = await fetch(`${BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@safetravel.gov.in", password: "Admin@Safety2026!" }),
    });
    const loginData = await loginRes.json();
    console.log("Valid login status:", loginRes.status, "Admin:", loginData.data?.user?.email);
    adminToken = loginData.data?.token;
    if (!adminToken) throw new Error("Missing admin token");

    // 4. Protected Admin Endpoints
    console.log("\n[4] Testing Protected Admin Dashboard Endpoints...");
    // 4a. Unauthenticated request to /admin/dashboard
    const unauthRes = await fetch(`${BASE}/admin/dashboard`);
    console.log("Unauthenticated access (expected 401):", unauthRes.status);
    if (unauthRes.status !== 401) throw new Error("Expected 401 without auth token");

    // 4b. Authenticated request to /admin/dashboard
    const dashRes = await fetch(`${BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await dashRes.json();
    console.log("Admin Dashboard Stats:", dashData.data.statistics);
    if (!dashData.data.statistics.totalTourists) throw new Error("Missing dashboard stats");

    // 4c. Authenticated request to /admin/tourists
    const adminTouristsRes = await fetch(`${BASE}/admin/tourists`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminTouristsData = await adminTouristsRes.json();
    console.log(`Fetched ${adminTouristsData.count} monitored tourists via admin API.`);

    // 4d. Authenticated request to /admin/clusters
    const clustersRes = await fetch(`${BASE}/admin/clusters`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const clustersData = await clustersRes.json();
    console.log(`Map clusters: ${clustersData.data.safetyZones.length} zones, ${clustersData.data.tourists.length} tourists.`);

    // 5. QR Verification Token Flow
    console.log("\n[5] Testing QR Verification Token Generation & Verification...");
    const genTokenRes = await fetch(`${BASE}/verification/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ touristId: testTouristId, validHours: 24 }),
    });
    const genTokenData = await genTokenRes.json();
    validQrToken = genTokenData.data?.rawToken;
    console.log("Generated raw QR token:", validQrToken?.slice(0, 18) + "...");
    if (!validQrToken) throw new Error("Failed to generate raw QR token");

    // 5b. Verify with valid token
    const verifyRes = await fetch(`${BASE}/verification/${validQrToken}`);
    const verifyData = await verifyRes.json();
    console.log("QR Verification Result:", verifyRes.status, verifyData.data?.status, "Tourist:", verifyData.data?.fullName);
    if (!verifyData.success || verifyData.data?.status !== "VALID") throw new Error("Expected VALID verification");
    // Confirm no private emergency contacts are leaked
    if (verifyData.data.phone || verifyData.data.emergencyContactPhone) {
      throw new Error("Privacy leak: sensitive personal phone exposed in QR verification payload!");
    }

    // 5c. Verify with invalid token
    const invalidVerifyRes = await fetch(`${BASE}/verification/st_tok_invalid_fake_token_123456789`);
    const invalidVerifyData = await invalidVerifyRes.json();
    console.log("Invalid token result (expected 400):", invalidVerifyRes.status, invalidVerifyData.data?.status);
    if (invalidVerifyRes.status !== 400 || invalidVerifyData.data?.status !== "INVALID") {
      throw new Error("Expected INVALID token response");
    }

    // 6. SOS Incident Flow & Status Update
    console.log("\n[6] Testing SOS Incident & Admin Status Patch...");
    const sosRes = await fetch(`${BASE}/incidents/sos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        touristId: testTouristId,
        latitude: 26.9855,
        longitude: 75.8513,
        description: "Day 3 Emergency SOS test call.",
      }),
    });
    const sosData = await sosRes.json();
    testIncidentId = sosData.data.id;
    console.log("SOS Incident Created:", sosData.data.referenceCode, "Status:", sosData.data.status);

    // Patch status as Admin (OPEN -> ACKNOWLEDGED)
    const patchRes = await fetch(`${BASE}/admin/incidents/${testIncidentId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "ACKNOWLEDGED" }),
    });
    const patchData = await patchRes.json();
    console.log("Incident Status Patched:", patchData.data.status, "Ref:", patchData.data.referenceCode);
    if (patchData.data.status !== "ACKNOWLEDGED") throw new Error("Failed to patch status to ACKNOWLEDGED");

    // 7. Audit Ledger Cryptographic Verification
    console.log("\n[7] Testing Tamper-Evident Hash-Chained Audit Ledger...");
    const verifyChainRes = await fetch(`${BASE}/audit-ledger/verify`);
    const verifyChainData = await verifyChainRes.json();
    console.log("Audit Chain Integrity:", verifyChainData.data.valid ? "CHAIN VALID ✓" : "CORRUPTED ✗", `(${verifyChainData.data.verifiedRecords}/${verifyChainData.data.totalRecords} records verified)`);
    if (!verifyChainData.data.valid) throw new Error("Audit chain verification failed");

    // 8. Tamper Detection Test
    console.log("\n[8] Testing Audit Ledger Tamper-Detection Logic...");
    // Create a temporary corrupted record directly to verify detection
    const testTamper = await prisma.auditLedger.create({
      data: {
        id: "tamper_test_123",
        eventType: "TEST_EVENT",
        entityType: "Test",
        entityId: "123",
        payload: '{"original":true}',
        timestamp: new Date(),
        previousHash: "bad_corrupted_previous_hash_value",
        currentHash: "invalid_hash_value",
      },
    });

    const tamperCheckResult = await verifyAuditChain();
    console.log("Tamper detection test result:", tamperCheckResult.valid ? "FAILED (Did not detect tampering)" : "PASSED (Tampering successfully detected!)");
    console.log("Detection detail:", tamperCheckResult.firstInvalidRecord?.reason);
    if (tamperCheckResult.valid) throw new Error("Audit ledger failed to detect artificial tampering!");

    // Cleanup tamper test record
    await prisma.auditLedger.delete({ where: { id: "tamper_test_123" } });

    // Confirm chain is valid again
    const postCleanupVerification = await verifyAuditChain();
    console.log("Post-cleanup chain integrity:", postCleanupVerification.valid ? "CHAIN RESTORED VALID ✓" : "FAIL");
    if (!postCleanupVerification.valid) throw new Error("Audit chain failed to restore");

    console.log("\n>>> ALL DAY 3 BACKEND & SECURITY TESTS PASSED PERFECTLY! <<<");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("DAY 3 TEST SUITE FAILED:", err);
  process.exit(1);
});
