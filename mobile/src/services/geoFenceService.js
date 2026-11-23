/**
 * Calculates distance between two points on Earth using Haversine formula in meters.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS = 6371000; // in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Evaluates coordinates against local safety zones.
 * Computes distances, identifies inside/outside status, and sorts by proximity.
 */
export function evaluateLocalGeoFences(latitude, longitude, zones = []) {
  if (
    latitude === undefined ||
    longitude === undefined ||
    latitude === null ||
    longitude === null
  ) {
    return {
      insideZones: [],
      nearestZone: null,
      evaluatedZones: [],
      currentRiskLevel: "UNKNOWN",
    };
  }

  const evaluatedZones = zones.map((zone) => {
    const distanceMeters = calculateHaversineDistance(
      latitude,
      longitude,
      zone.latitude,
      zone.longitude
    );
    const isInside = distanceMeters <= zone.radius;

    return {
      ...zone,
      distanceMeters: Math.round(distanceMeters),
      isInside,
    };
  });

  evaluatedZones.sort((a, b) => a.distanceMeters - b.distanceMeters);

  const insideZones = evaluatedZones.filter((z) => z.isInside);
  const dangerZones = insideZones.filter((z) => z.riskLevel === "DANGER");
  const cautionZones = insideZones.filter((z) => z.riskLevel === "CAUTION");

  let currentRiskLevel = "SAFE";
  if (dangerZones.length > 0) {
    currentRiskLevel = "DANGER";
  } else if (cautionZones.length > 0) {
    currentRiskLevel = "CAUTION";
  }

  return {
    insideZones,
    nearestZone: evaluatedZones[0] || null,
    evaluatedZones,
    currentRiskLevel,
  };
}

/**
 * Compares previous and current active zone IDs to detect zone entry/exit events.
 * Crucial to prevent alert spam on every GPS poll!
 */
export function detectZoneTransitions(previousInsideZoneIds = [], currentInsideZones = []) {
  const currentInsideIds = currentInsideZones.map((z) => z.id);

  const entered = currentInsideZones.filter(
    (z) => !previousInsideZoneIds.includes(z.id)
  );

  const exitedIds = previousInsideZoneIds.filter(
    (id) => !currentInsideIds.includes(id)
  );

  return {
    entered,
    exitedIds,
    hasChanged: entered.length > 0 || exitedIds.length > 0,
    currentInsideIds,
  };
}
