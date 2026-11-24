// Platform-aware API configuration
// Detect runtime environment: browser window, EXPO_PUBLIC_API_URL, or LAN IP for mobile
function resolveDefaultApiUrl() {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // When running in a web browser, use relative path or current origin
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  // Fallback for native devices
  return "http://localhost:5050/api";
}

export let API_BASE_URL = resolveDefaultApiUrl();

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
    // If running on localhost and request fails, return error cleanly
    throw error;
  }
}

export async function getHealth() {
  return request("/health");
}

export async function registerTourist(touristData) {
  return request("/tourists", {
    method: "POST",
    body: JSON.stringify(touristData),
  });
}

export async function getTourists() {
  return request("/tourists");
}

export async function getTouristById(id) {
  return request(`/tourists/${id}`);
}

export async function getSafetyZones() {
  return request("/geofence/zones");
}

export async function evaluateGeofence(latitude, longitude) {
  return request("/geofence/evaluate", {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
  });
}

export async function getSafetyScore(touristId, latitude, longitude) {
  let endpoint = `/safety-score/${touristId}`;
  if (latitude !== undefined && longitude !== undefined) {
    endpoint += `?latitude=${latitude}&longitude=${longitude}`;
  }
  return request(endpoint);
}

export async function calculateSafetyScore(payload) {
  return request("/safety-score/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function triggerSos(incidentData) {
  return request("/incidents/sos", {
    method: "POST",
    body: JSON.stringify(incidentData),
  });
}

export async function getIncidents(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/incidents${query ? `?${query}` : ""}`);
}

export async function getIncidentById(id) {
  return request(`/incidents/${id}`);
}

export async function getTouristIncidents(touristId) {
  return request(`/incidents/tourist/${touristId}`);
}

export async function updateIncidentStatus(id, status, notes = "") {
  return request(`/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, notes }),
  });
}

export async function detectAnomalies(touristId, currentCoordinates) {
  return request("/anomalies/detect", {
    method: "POST",
    body: JSON.stringify({ touristId, currentCoordinates }),
  });
}

export async function simulateAnomaly(touristId, scenarioType) {
  return request("/anomalies/simulate", {
    method: "POST",
    body: JSON.stringify({ touristId, scenarioType }),
  });
}

export async function getAnomalies(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/anomalies${query ? `?${query}` : ""}`);
}

export async function getTouristAnomalies(touristId) {
  return request(`/anomalies/tourist/${touristId}`);
}

export async function updateAnomalyStatus(id, status) {
  return request(`/anomalies/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getVerificationToken(touristId) {
  return request(`/verification/token/${touristId}`);
}

export async function verifyQrToken(token) {
  return request("/verification/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function verifyAuditLedger() {
  return request("/audit-ledger/verify");
}
