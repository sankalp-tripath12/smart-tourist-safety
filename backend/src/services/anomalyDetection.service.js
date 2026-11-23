import { prisma } from "../config/prisma.js";
import { calculateHaversineDistance, evaluateLocationAgainstZones } from "./geoFence.service.js";

/**
 * Creates and persists an anomaly alert in the database.
 */
export async function createAnomalyAlert({
  touristId,
  type,
  severity,
  description,
  latitude = null,
  longitude = null,
}) {
  const tourist = await prisma.tourist.findUnique({
    where: { id: touristId },
  });

  if (!tourist) {
    throw new Error(`Tourist with ID ${touristId} not found`);
  }

  const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const alertSeverity = validSeverities.includes(severity?.toUpperCase())
    ? severity.toUpperCase()
    : "MEDIUM";

  return prisma.anomalyAlert.create({
    data: {
      touristId,
      type: type.toUpperCase().trim(),
      severity: alertSeverity,
      description: description.trim(),
      latitude: latitude !== null && latitude !== undefined ? parseFloat(latitude) : null,
      longitude: longitude !== null && longitude !== undefined ? parseFloat(longitude) : null,
      status: "ACTIVE",
    },
  });
}

/**
 * Rule-based evaluation of tourist location updates to detect anomalies.
 * Explains each triggered rule deterministically.
 */
export async function detectAnomalies({
  touristId,
  currentLatitude,
  currentLongitude,
  previousLatitude,
  previousLongitude,
  timeElapsedMinutes = 5,
  itineraryCoordinates = null, // e.g. { latitude, longitude }
}) {
  const detectedAnomalies = [];
  const curLat = parseFloat(currentLatitude);
  const curLon = parseFloat(currentLongitude);

  // Rule 4: Danger Zone Entry Check
  if (!Number.isNaN(curLat) && !Number.isNaN(curLon)) {
    const geoEvaluation = await evaluateLocationAgainstZones(curLat, curLon);
    const dangerZones = geoEvaluation.activeZones.filter((z) => z.riskLevel === "DANGER");

    for (const dangerZone of dangerZones) {
      detectedAnomalies.push({
        type: "DANGER_ZONE_ENTRY",
        severity: "HIGH",
        description: `Tourist entered restricted/high-risk zone: "${dangerZone.name}". Radius: ${dangerZone.radius}m.`,
        latitude: curLat,
        longitude: curLon,
      });
    }
  }

  // Rule 3: Sudden Location Change (Implausible speed / teleportation)
  if (
    !Number.isNaN(curLat) &&
    !Number.isNaN(curLon) &&
    previousLatitude !== undefined &&
    previousLongitude !== undefined &&
    previousLatitude !== null &&
    previousLongitude !== null
  ) {
    const prevLat = parseFloat(previousLatitude);
    const prevLon = parseFloat(previousLongitude);

    if (!Number.isNaN(prevLat) && !Number.isNaN(prevLon)) {
      const distanceMeters = calculateHaversineDistance(prevLat, prevLon, curLat, curLon);
      const elapsedHours = (timeElapsedMinutes || 1) / 60;
      const speedKmPerHour = distanceMeters / 1000 / elapsedHours;

      // Realistic speed limit: > 250 km/h or > 50 km jump in 10 minutes
      if (speedKmPerHour > 250 || (distanceMeters > 50000 && timeElapsedMinutes <= 15)) {
        detectedAnomalies.push({
          type: "SUDDEN_LOCATION_CHANGE",
          severity: "CRITICAL",
          description: `Implausibly rapid location displacement detected: ${Math.round(distanceMeters / 1000)} km in ${timeElapsedMinutes} min (~${Math.round(speedKmPerHour)} km/h). Potential GPS spoofing or sudden transit.`,
          latitude: curLat,
          longitude: curLon,
        });
      }
    }
  }

  // Rule 2: Route Deviation from registered itinerary corridor
  if (
    !Number.isNaN(curLat) &&
    !Number.isNaN(curLon) &&
    itineraryCoordinates &&
    itineraryCoordinates.latitude !== undefined &&
    itineraryCoordinates.longitude !== undefined
  ) {
    const routeLat = parseFloat(itineraryCoordinates.latitude);
    const routeLon = parseFloat(itineraryCoordinates.longitude);

    if (!Number.isNaN(routeLat) && !Number.isNaN(routeLon)) {
      const distanceToRoute = calculateHaversineDistance(curLat, curLon, routeLat, routeLon);
      const ROUTE_DEVIATION_THRESHOLD = 3000; // 3km away from scheduled corridor

      if (distanceToRoute > ROUTE_DEVIATION_THRESHOLD) {
        detectedAnomalies.push({
          type: "ROUTE_DEVIATION",
          severity: "HIGH",
          description: `Tourist location deviates by ${Math.round(distanceToRoute)}m from the expected itinerary corridor.`,
          latitude: curLat,
          longitude: curLon,
        });
      }
    }
  }

  // Rule 1: Location Inactivity check
  if (timeElapsedMinutes >= 180) {
    // 3+ hours without ping
    detectedAnomalies.push({
      type: "LOCATION_INACTIVITY",
      severity: "MEDIUM",
      description: `Prolonged GPS silence detected: No location updates recorded for ${timeElapsedMinutes} minutes.`,
      latitude: !Number.isNaN(curLat) ? curLat : null,
      longitude: !Number.isNaN(curLon) ? curLon : null,
    });
  }

  // Rule 5: Repeated Suspicious Events check
  // Check recent alerts in database for this tourist in last 60 minutes
  const recentAlerts = await prisma.anomalyAlert.findMany({
    where: {
      touristId,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // last 60 mins
      },
    },
  });

  if (recentAlerts.length >= 2 || (recentAlerts.length >= 1 && detectedAnomalies.length >= 1)) {
    detectedAnomalies.push({
      type: "REPEATED_SUSPICIOUS_EVENTS",
      severity: "CRITICAL",
      description: `Multiple anomaly indicators (${recentAlerts.length + detectedAnomalies.length} risk signals) triggered within the past 60 minutes. Heightened safety monitoring recommended.`,
      latitude: !Number.isNaN(curLat) ? curLat : null,
      longitude: !Number.isNaN(curLon) ? curLon : null,
    });
  }

  // Persist all newly detected anomalies
  const savedAlerts = [];
  for (const anomaly of detectedAnomalies) {
    const saved = await createAnomalyAlert({
      touristId,
      type: anomaly.type,
      severity: anomaly.severity,
      description: anomaly.description,
      latitude: anomaly.latitude,
      longitude: anomaly.longitude,
    });
    savedAlerts.push(saved);
  }

  return {
    evaluatedAt: new Date().toISOString(),
    anomaliesCount: savedAlerts.length,
    alerts: savedAlerts,
  };
}

/**
 * Safe simulation interface for testing anomaly rules without waiting or travelling.
 */
export async function simulateAnomalyScenario({ touristId, scenario, latitude, longitude }) {
  const tourist = await prisma.tourist.findUnique({ where: { id: touristId } });
  if (!tourist) {
    throw new Error(`Tourist with ID ${touristId} not found`);
  }

  const defaultCoords = {
    latitude: latitude || 26.9855,
    longitude: longitude || 75.8513,
  };

  switch (scenario.toUpperCase()) {
    case "DANGER_ZONE_ENTRY":
      return createAnomalyAlert({
        touristId,
        type: "DANGER_ZONE_ENTRY",
        severity: "HIGH",
        description: "Simulated Danger-Zone Entry: Tourist coordinates entered Aravalli Ridge Restricted Cliffs (Demo Danger Zone).",
        latitude: 26.9950,
        longitude: 75.8600,
      });

    case "SUDDEN_LOCATION_CHANGE":
      return createAnomalyAlert({
        touristId,
        type: "SUDDEN_LOCATION_CHANGE",
        severity: "CRITICAL",
        description: "Simulated Sudden Jump: Detected 85 km displacement in under 3 minutes (~1,700 km/h). Implausible physical travel rate.",
        latitude: defaultCoords.latitude + 0.75,
        longitude: defaultCoords.longitude + 0.65,
      });

    case "ROUTE_DEVIATION":
      return createAnomalyAlert({
        touristId,
        type: "ROUTE_DEVIATION",
        severity: "HIGH",
        description: "Simulated Route Deviation: Tourist coordinates deviated 4.8 km away from the scheduled itinerary corridor.",
        latitude: defaultCoords.latitude + 0.045,
        longitude: defaultCoords.longitude + 0.045,
      });

    case "INACTIVITY":
      return createAnomalyAlert({
        touristId,
        type: "LOCATION_INACTIVITY",
        severity: "MEDIUM",
        description: "Simulated Inactivity: No location updates received from tourist device for 210 minutes (exceeds 180 min threshold).",
        latitude: defaultCoords.latitude,
        longitude: defaultCoords.longitude,
      });

    case "REPEATED_SUSPICIOUS_EVENTS":
      return createAnomalyAlert({
        touristId,
        type: "REPEATED_SUSPICIOUS_EVENTS",
        severity: "CRITICAL",
        description: "Simulated Cluster: 3 compounding risk alerts detected in 45 minutes. Escalated to high-priority safety response.",
        latitude: defaultCoords.latitude,
        longitude: defaultCoords.longitude,
      });

    default:
      throw new Error(
        `Unknown simulation scenario: "${scenario}". Allowed scenarios: DANGER_ZONE_ENTRY, SUDDEN_LOCATION_CHANGE, ROUTE_DEVIATION, INACTIVITY, REPEATED_SUSPICIOUS_EVENTS`
      );
  }
}

export async function getAllAnomalyAlerts(filters = {}) {
  const where = {};
  if (filters.touristId) where.touristId = filters.touristId;
  if (filters.severity) where.severity = filters.severity.toUpperCase();
  if (filters.status) where.status = filters.status.toUpperCase();
  if (filters.type) where.type = filters.type.toUpperCase();

  return prisma.anomalyAlert.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tourist: {
        select: {
          id: true,
          touristCode: true,
          fullName: true,
        },
      },
    },
  });
}

export async function getAlertsByTouristId(touristId) {
  return getAllAnomalyAlerts({ touristId });
}

export async function updateAlertStatus(id, status) {
  const validStatuses = ["ACTIVE", "ACKNOWLEDGED", "RESOLVED"];
  const upperStatus = status.toUpperCase().trim();

  if (!validStatuses.includes(upperStatus)) {
    throw new Error(`Invalid alert status. Must be one of: ${validStatuses.join(", ")}`);
  }

  return prisma.anomalyAlert.update({
    where: { id },
    data: { status: upperStatus },
  });
}
