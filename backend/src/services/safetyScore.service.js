import { prisma } from "../config/prisma.js";
import { evaluateLocationAgainstZones } from "./geoFence.service.js";

/**
 * Calculates a deterministic, explainable safety score for a tourist.
 * Score range: 0 - 100. Higher is safer.
 */
export async function calculateTouristSafetyScore({ touristId, latitude, longitude }) {
  const tourist = await prisma.tourist.findUnique({
    where: { id: touristId },
    include: {
      incidents: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
          },
        },
        orderBy: { createdAt: "desc" },
      },
      anomalyAlerts: {
        where: {
          status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tourist) {
    throw new Error(`Tourist with ID ${touristId} not found`);
  }

  let score = 100;
  const factors = [];

  // Factor 1: Location availability
  const hasCoordinates =
    latitude !== undefined &&
    longitude !== undefined &&
    latitude !== null &&
    longitude !== null &&
    !Number.isNaN(parseFloat(latitude)) &&
    !Number.isNaN(parseFloat(longitude));

  if (!hasCoordinates) {
    score -= 10;
    factors.push({
      factor: "LOCATION_UNAVAILABLE",
      impact: -10,
      detail: "No active GPS coordinates provided for real-time safety monitoring.",
    });
  } else {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Factor 2: Geo-fence proximity and danger zone presence
    try {
      const geoResult = await evaluateLocationAgainstZones(lat, lon);
      const dangerZones = geoResult.activeZones.filter((z) => z.riskLevel === "DANGER");
      const cautionZones = geoResult.activeZones.filter((z) => z.riskLevel === "CAUTION");

      if (dangerZones.length > 0) {
        score -= 40;
        factors.push({
          factor: "INSIDE_DANGER_ZONE",
          impact: -40,
          detail: `Located inside danger zone: "${dangerZones[0].name}". Immediate caution advised.`,
        });
      } else if (cautionZones.length > 0) {
        score -= 15;
        factors.push({
          factor: "INSIDE_CAUTION_ZONE",
          impact: -15,
          detail: `Located inside caution zone: "${cautionZones[0].name}". Stay alert in crowded/narrow area.`,
        });
      } else {
        factors.push({
          factor: "ZONE_SAFETY",
          impact: 0,
          detail: geoResult.activeZones.some((z) => z.riskLevel === "SAFE")
            ? `Located inside verified safe zone: "${geoResult.activeZones[0].name}".`
            : "Outside designated high-risk zones.",
        });
      }
    } catch {
      // Ignore evaluation failure
    }
  }

  // Factor 3: Recent SOS incidents in last 24h
  const openIncidents = tourist.incidents.filter((inc) => inc.status === "OPEN");
  if (openIncidents.length > 0) {
    const deduction = Math.min(60, openIncidents.length * 50);
    score -= deduction;
    factors.push({
      factor: "OPEN_SOS_INCIDENT",
      impact: -deduction,
      detail: `${openIncidents.length} active emergency SOS incident(s) currently open.`,
    });
  }

  // Factor 4: Recent Anomaly Alerts in last 24h
  let anomalyDeduction = 0;
  for (const alert of tourist.anomalyAlerts) {
    if (alert.severity === "CRITICAL") anomalyDeduction += 25;
    else if (alert.severity === "HIGH") anomalyDeduction += 15;
    else if (alert.severity === "MEDIUM") anomalyDeduction += 8;
    else if (alert.severity === "LOW") anomalyDeduction += 3;
  }

  if (anomalyDeduction > 0) {
    const cappedAnomalyDeduction = Math.min(50, anomalyDeduction);
    score -= cappedAnomalyDeduction;
    factors.push({
      factor: "ACTIVE_ANOMALY_ALERTS",
      impact: -cappedAnomalyDeduction,
      detail: `${tourist.anomalyAlerts.length} recent safety anomaly alert(s) logged in the last 24 hours.`,
    });
  }

  // Clamp score strictly between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine Category
  let category = "SAFE";
  let explanation = "Tourist is currently in a safe environment with regular monitoring.";

  if (score < 50) {
    category = "HIGH RISK";
    explanation = "Critical safety risks detected. Active SOS, danger zone entry, or severe anomalies present.";
  } else if (score < 80) {
    category = "MODERATE";
    explanation = "Caution advised. Moderate risk factors or advisory alerts detected in proximity.";
  }

  return {
    touristId: tourist.id,
    touristCode: tourist.touristCode,
    fullName: tourist.fullName,
    safetyScore: score,
    category,
    explanation,
    factors,
    lastCalculatedAt: new Date().toISOString(),
  };
}
