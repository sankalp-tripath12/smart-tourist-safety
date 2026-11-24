import { prisma } from "../config/prisma.js";
import { verifyAuditChain, appendAuditEvent } from "./auditLedger.service.js";
import { calculateTouristSafetyScore } from "./safetyScore.service.js";

/**
 * Aggregates live system statistics for the authority monitoring dashboard.
 */
export async function getDashboardOverview() {
  const now = new Date();

  const [
    totalTourists,
    activeTourists,
    openSosIncidents,
    totalIncidents,
    unresolvedAnomalies,
    totalSafetyZones,
    recentIncidents,
    recentAlerts,
    safetyZones,
    chainVerification,
  ] = await Promise.all([
    prisma.tourist.count(),
    prisma.tourist.count({ where: { visitExpiry: { gt: now } } }),
    prisma.incident.count({ where: { type: "SOS", status: "OPEN" } }),
    prisma.incident.count(),
    prisma.anomalyAlert.count({ where: { status: { in: ["ACTIVE", "ACKNOWLEDGED"] } } }),
    prisma.safetyZone.count(),
    prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        tourist: {
          select: {
            touristCode: true,
            fullName: true,
            phone: true,
          },
        },
      },
    }),
    prisma.anomalyAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        tourist: {
          select: {
            touristCode: true,
            fullName: true,
          },
        },
      },
    }),
    prisma.safetyZone.findMany(),
    verifyAuditChain(),
  ]);

  // Compute high-risk tourists
  const tourists = await prisma.tourist.findMany({
    take: 50,
    include: {
      incidents: { where: { status: "OPEN" } },
      anomalyAlerts: { where: { status: "ACTIVE" } },
    },
  });

  let highRiskCount = 0;
  for (const t of tourists) {
    if (t.incidents.length > 0 || t.anomalyAlerts.some((a) => a.severity === "CRITICAL" || a.severity === "HIGH")) {
      highRiskCount++;
    }
  }

  return {
    statistics: {
      totalTourists,
      activeTourists,
      openSosIncidents,
      totalIncidents,
      unresolvedAnomalies,
      highRiskTourists: highRiskCount,
      totalSafetyZones,
      chainIntact: chainVerification.valid,
      totalAuditRecords: chainVerification.totalRecords,
    },
    safetyZones,
    recentIncidents: recentIncidents.map((inc) => ({
      ...inc,
      referenceCode: `INC-${inc.id.slice(-6).toUpperCase()}`,
    })),
    recentAlerts,
    chainVerification,
  };
}

/**
 * Retrieves tourist records enriched with live safety scores for the authority view.
 */
export async function getMonitoredTourists({ search = "", riskCategory = null } = {}) {
  const where = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { touristCode: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const tourists = await prisma.tourist.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      incidents: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      anomalyAlerts: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      verificationTokens: {
        where: { revokedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const enriched = await Promise.all(
    tourists.map(async (t) => {
      // Find latest coordinates from recent incidents or alerts
      const latestCoordObj = t.incidents[0] || t.anomalyAlerts.find((a) => a.latitude !== null);
      const lat = latestCoordObj?.latitude ?? 26.9855;
      const lon = latestCoordObj?.longitude ?? 75.8513;

      let scoreResult = { safetyScore: 100, category: "SAFE" };
      try {
        scoreResult = await calculateTouristSafetyScore({
          touristId: t.id,
          latitude: lat,
          longitude: lon,
        });
      } catch {
        // Fallback
      }

      return {
        id: t.id,
        touristCode: t.touristCode,
        fullName: t.fullName,
        phone: t.phone,
        email: t.email,
        emergencyContactName: t.emergencyContactName,
        emergencyContactPhone: t.emergencyContactPhone,
        itinerary: t.itinerary,
        visitExpiry: t.visitExpiry,
        createdAt: t.createdAt,
        safetyScore: scoreResult.safetyScore,
        riskCategory: scoreResult.category,
        explanation: scoreResult.explanation,
        lastKnownLocation: {
          latitude: lat,
          longitude: lon,
          recordedAt: latestCoordObj?.createdAt || t.createdAt,
        },
        hasActiveSos: t.incidents.some((i) => i.status === "OPEN"),
        activeAlertsCount: t.anomalyAlerts.filter((a) => a.status === "ACTIVE").length,
        hasValidQrToken: t.verificationTokens.length > 0 && t.verificationTokens[0].expiresAt > new Date(),
      };
    })
  );

  if (riskCategory) {
    return enriched.filter((t) => t.riskCategory === riskCategory.toUpperCase());
  }

  return enriched;
}

/**
 * Updates incident status and logs the administrative action to the audit ledger.
 */
export async function updateIncidentByAdmin(incidentId, newStatus, adminUser) {
  const validStatuses = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "CANCELLED"];
  const upperStatus = newStatus.toUpperCase().trim();

  if (!validStatuses.includes(upperStatus)) {
    throw new Error(`Invalid status. Allowed: ${validStatuses.join(", ")}`);
  }

  const previous = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { tourist: true },
  });

  if (!previous) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: { status: upperStatus },
  });

  // Log authority status transition to Audit Ledger
  await appendAuditEvent({
    eventType: "INCIDENT_STATUS_CHANGE",
    entityType: "Incident",
    entityId: incidentId,
    payload: {
      incidentRef: `INC-${incidentId.slice(-6).toUpperCase()}`,
      touristCode: previous.tourist?.touristCode,
      fromStatus: previous.status,
      toStatus: upperStatus,
      updatedBy: adminUser.email,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    ...updated,
    referenceCode: `INC-${updated.id.slice(-6).toUpperCase()}`,
  };
}

/**
 * Updates anomaly alert status and records it in the audit ledger.
 */
export async function updateAnomalyByAdmin(alertId, newStatus, adminUser) {
  const validStatuses = ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"];
  const upperStatus = newStatus.toUpperCase().trim();

  if (!validStatuses.includes(upperStatus)) {
    throw new Error(`Invalid status. Allowed: ${validStatuses.join(", ")}`);
  }

  const previous = await prisma.anomalyAlert.findUnique({
    where: { id: alertId },
  });

  if (!previous) {
    throw new Error(`Anomaly alert ${alertId} not found`);
  }

  const updated = await prisma.anomalyAlert.update({
    where: { id: alertId },
    data: { status: upperStatus },
  });

  await appendAuditEvent({
    eventType: "ANOMALY_STATUS_CHANGE",
    entityType: "AnomalyAlert",
    entityId: alertId,
    payload: {
      alertType: previous.type,
      fromStatus: previous.status,
      toStatus: upperStatus,
      updatedBy: adminUser.email,
    },
  });

  return updated;
}

/**
 * Gathers geographic map points for clusters & risk heatmap.
 */
export async function getGeographicClusters() {
  const [zones, incidents, tourists] = await Promise.all([
    prisma.safetyZone.findMany(),
    prisma.incident.findMany({
      where: { status: "OPEN" },
      include: { tourist: { select: { touristCode: true, fullName: true } } },
    }),
    prisma.tourist.findMany({
      include: {
        incidents: { take: 1, orderBy: { createdAt: "desc" } },
        anomalyAlerts: { take: 1, orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  // Construct tourist map markers
  const touristMarkers = tourists.map((t) => {
    const lat = t.incidents[0]?.latitude || t.anomalyAlerts[0]?.latitude || 26.9855;
    const lon = t.incidents[0]?.longitude || t.anomalyAlerts[0]?.longitude || 75.8513;
    const hasOpenSos = t.incidents.some((i) => i.status === "OPEN");

    return {
      id: t.id,
      touristCode: t.touristCode,
      fullName: t.fullName,
      latitude: lat,
      longitude: lon,
      type: "TOURIST",
      riskLevel: hasOpenSos ? "DANGER" : "SAFE",
      hasOpenSos,
    };
  });

  // Construct active incident markers
  const incidentMarkers = incidents.map((inc) => ({
    id: inc.id,
    referenceCode: `INC-${inc.id.slice(-6).toUpperCase()}`,
    touristName: inc.tourist?.fullName,
    touristCode: inc.tourist?.touristCode,
    type: "INCIDENT",
    severity: inc.severity,
    latitude: inc.latitude,
    longitude: lonOrDefault(inc.longitude),
    status: inc.status,
    description: inc.description,
  }));

  return {
    safetyZones: zones.map((z) => ({
      id: z.id,
      name: z.name,
      latitude: z.latitude,
      longitude: z.longitude,
      radius: z.radius,
      riskLevel: z.riskLevel,
      description: z.description,
    })),
    tourists: touristMarkers,
    incidents: incidentMarkers,
  };
}

function lonOrDefault(val) {
  return val !== undefined && val !== null ? val : 75.8513;
}
