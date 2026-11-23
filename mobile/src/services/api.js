// Platform-aware API configuration
// In Expo Go or development, allow fallback to localhost or LAN IP
const DEFAULT_URL = "http://10.7.21.185:5050/api";
const LOCAL_URL = "http://localhost:5050/api";

export let API_BASE_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
  DEFAULT_URL;

export function setApiBaseUrl(newUrl) {
  if (newUrl) {
    API_BASE_URL = newUrl.trim();
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // If LAN IP fails in local web/node or simulator, attempt localhost fallback once
    if (API_BASE_URL !== LOCAL_URL && error.message?.includes("Network request failed")) {
      try {
        const fallbackUrl = `${LOCAL_URL}${endpoint}`;
        const fbResponse = await fetch(fallbackUrl, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });
        const fbData = await fbResponse.json();
        if (fbResponse.ok) {
          API_BASE_URL = LOCAL_URL;
          return fbData;
        }
      } catch {
        // Fallback also failed, bubble original error
      }
    }
    throw error;
  }
}

// Health & System
export function getHealth() {
  return request("/health");
}

// Tourist APIs
export function registerTourist(touristData) {
  return request("/tourists", {
    method: "POST",
    body: JSON.stringify(touristData),
  });
}

export function getTourists() {
  return request("/tourists");
}

export function getTouristById(id) {
  return request(`/tourists/${id}`);
}

// Geo-Fence & Safety Zones
export function getSafetyZones() {
  return request("/geofence/zones");
}

export function getSafetyZoneById(id) {
  return request(`/geofence/zones/${id}`);
}

export function evaluateLocationZones(latitude, longitude) {
  return request("/geofence/evaluate", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
  });
}

// Safety Score
export function getSafetyScore(touristId, latitude, longitude) {
  let endpoint = `/safety-score/${touristId}`;
  if (latitude !== undefined && longitude !== undefined) {
    endpoint += `?latitude=${latitude}&longitude=${longitude}`;
  }
  return request(endpoint);
}

// Incident & SOS
export function triggerSos(sosData) {
  return request("/incidents/sos", {
    method: "POST",
    body: JSON.stringify(sosData),
  });
}

export function getAllIncidents(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/incidents${query ? `?${query}` : ""}`);
}

export function getTouristIncidents(touristId) {
  return request(`/incidents/tourist/${touristId}`);
}

export function updateIncidentStatus(id, status) {
  return request(`/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Anomaly Detection
export function detectAnomalies(data) {
  return request("/anomalies/detect", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function simulateAnomaly(data) {
  return request("/anomalies/simulate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAllAnomalies(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/anomalies${query ? `?${query}` : ""}`);
}

export function getTouristAnomalies(touristId) {
  return request(`/anomalies/tourist/${touristId}`);
}

export function updateAnomalyStatus(id, status) {
  return request(`/anomalies/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
