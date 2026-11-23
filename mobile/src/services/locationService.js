import * as Location from "expo-location";

/**
 * Predefined demo location simulation presets in the Jaipur tourism corridor.
 * Allows safe verification of geo-fences and anomalies without traveling.
 */
export const LOCATION_PRESETS = [
  {
    id: "amer-fort",
    name: "Amer Fort (Safe Zone)",
    latitude: 26.9855,
    longitude: 75.8513,
    description: "Verified Safe Tourist Monument Area with Active Police",
    riskLevel: "SAFE",
  },
  {
    id: "hawa-mahal",
    name: "Hawa Mahal (Safe Zone)",
    latitude: 26.9239,
    longitude: 75.8267,
    description: "Pedestrian Cultural Plaza with Information Kiosks",
    riskLevel: "SAFE",
  },
  {
    id: "old-bazaar",
    name: "Old Bazaar (Caution Zone)",
    latitude: 26.9280,
    longitude: 75.8320,
    description: "Crowded narrow market lanes; keep personal belongings secure",
    riskLevel: "CAUTION",
  },
  {
    id: "aravalli-ridge",
    name: "Aravalli Ridge (Danger Zone)",
    latitude: 26.9950,
    longitude: 75.8600,
    description: "Unlit steep rocky terrain outside permitted trail hours",
    riskLevel: "DANGER",
  },
  {
    id: "isolated-riverbank",
    name: "Riverbank (Danger Zone)",
    latitude: 26.9400,
    longitude: 75.8800,
    description: "Seasonal floodway and unpatrolled embankment corridor",
    riskLevel: "DANGER",
  },
];

/**
 * Requests foreground GPS location permissions.
 */
export async function requestLocationPermissions() {
  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    return {
      granted: status === "granted",
      status,
      canAskAgain,
    };
  } catch (error) {
    console.error("Error requesting location permissions:", error);
    return {
      granted: false,
      status: "error",
      error: error.message,
    };
  }
}

/**
 * Checks current foreground location permissions without prompting.
 */
export async function checkLocationPermissions() {
  try {
    const { status, granted } = await Location.getForegroundPermissionsAsync();
    return { granted, status };
  } catch (error) {
    console.error("Error checking location permissions:", error);
    return { granted: false, status: "error" };
  }
}

/**
 * Obtains the current device GPS position.
 */
export async function getCurrentCoordinates() {
  const permission = await checkLocationPermissions();
  if (!permission.granted) {
    const requested = await requestLocationPermissions();
    if (!requested.granted) {
      throw new Error(
        "Location permission denied. Please grant foreground location permission in app settings."
      );
    }
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ? Math.round(location.coords.accuracy * 10) / 10 : null,
    altitude: location.coords.altitude,
    heading: location.coords.heading,
    speed: location.coords.speed,
    timestamp: location.timestamp || Date.now(),
    isSimulated: false,
  };
}
