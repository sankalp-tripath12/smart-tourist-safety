import { prisma } from "../config/prisma.js";

/**
 * Calculates the great-circle distance between two geographic points using the Haversine formula.
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_METERS = 6371000;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export async function getAllSafetyZones() {
  return prisma.safetyZone.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function getSafetyZoneById(id) {
  return prisma.safetyZone.findUnique({
    where: { id },
  });
}

export async function createSafetyZone(data) {
  return prisma.safetyZone.create({
    data: {
      name: data.name.trim(),
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      radius: parseFloat(data.radius),
      riskLevel: data.riskLevel.toUpperCase().trim(),
      description: data.description ? data.description.trim() : null,
    },
  });
}

/**
 * Evaluates a given GPS coordinate against all safety zones.
 * Computes distances, identifies whether inside or outside, and returns zone proximity.
 */
export async function evaluateLocationAgainstZones(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error("Invalid geographic coordinates provided");
  }

  const allZones = await getAllSafetyZones();

  const evaluatedZones = allZones.map((zone) => {
    const distanceMeters = calculateHaversineDistance(lat, lon, zone.latitude, zone.longitude);
    const isInside = distanceMeters <= zone.radius;

    return {
      id: zone.id,
      name: zone.name,
      riskLevel: zone.riskLevel,
      radius: zone.radius,
      center: { latitude: zone.latitude, longitude: zone.longitude },
      distanceMeters: Math.round(distanceMeters * 10) / 10,
      isInside,
      description: zone.description,
    };
  });

  // Sort by distance from closest to farthest
  evaluatedZones.sort((a, b) => a.distanceMeters - b.distanceMeters);

  const insideZones = evaluatedZones.filter((z) => z.isInside);
  const dangerZonesInside = insideZones.filter((z) => z.riskLevel === "DANGER");
  const cautionZonesInside = insideZones.filter((z) => z.riskLevel === "CAUTION");
  const safeZonesInside = insideZones.filter((z) => z.riskLevel === "SAFE");

  let currentRiskLevel = "SAFE";
  if (dangerZonesInside.length > 0) {
    currentRiskLevel = "DANGER";
  } else if (cautionZonesInside.length > 0) {
    currentRiskLevel = "CAUTION";
  }

  return {
    coordinates: { latitude: lat, longitude: lon },
    currentRiskLevel,
    insideCount: insideZones.length,
    activeZones: insideZones,
    nearestZone: evaluatedZones.length > 0 ? evaluatedZones[0] : null,
    allZones: evaluatedZones,
  };
}
