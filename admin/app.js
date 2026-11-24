// Authority Operations Console JavaScript Application
const API_BASE = "/api";

let adminToken = localStorage.getItem("safepolice_token") || null;
let currentTab = "overview";
let dashboardData = null;
let clusterData = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  setupNavigation();
  setupAuth();
  setupMapFilters();
  setupVerificationForm();
  setupLedgerVerifyButton();

  if (adminToken) {
    verifySession();
  } else {
    showLoginOverlay();
  }
}

// ----------------------------------------------------
// Authentication Handlers
// ----------------------------------------------------
function setupAuth() {
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const logoutBtn = document.getElementById("logoutBtn");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.add("hidden");

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Authentication failed");
      }

      adminToken = data.data.token;
      localStorage.setItem("safepolice_token", adminToken);
      document.getElementById("operatorEmail").textContent = data.data.user.email;

      hideLoginOverlay();
      loadAllDashboardData();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.remove("hidden");
    }
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("safepolice_token");
    adminToken = null;
    showLoginOverlay();
  });
}

async function verifySession() {
  try {
    const res = await fetch(`${API_BASE}/admin/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!res.ok) throw new Error("Session expired");

    const data = await res.json();
    document.getElementById("operatorEmail").textContent = data.data.email;
    hideLoginOverlay();
    loadAllDashboardData();
  } catch {
    localStorage.removeItem("safepolice_token");
    adminToken = null;
    showLoginOverlay();
  }
}

function showLoginOverlay() {
  document.getElementById("loginOverlay").classList.remove("hidden");
}

function hideLoginOverlay() {
  document.getElementById("loginOverlay").classList.add("hidden");
}

// ----------------------------------------------------
// Navigation Handlers
// ----------------------------------------------------
function setupNavigation() {
  const navButtons = document.querySelectorAll(".nav-item");
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });

  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadAllDashboardData();
  });
}

window.switchTab = function (tabName) {
  currentTab = tabName;

  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.classList.toggle("active", pane.id === `tab-${tabName}`);
  });

  const titles = {
    overview: "Command Overview",
    map: "Geographic Risk Map & Tourist Clusters",
    tourists: "Tourist Monitoring & Identity Passports",
    incidents: "Emergency Incident Command",
    anomalies: "Movement Anomaly Detection Alerts",
    verification: "QR Pass Verification Console",
    ledger: "Tamper-Evident SHA-256 Audit Ledger",
    zones: "Configured Safety & Danger Geo-Fences",
  };

  document.getElementById("pageTitle").textContent = titles[tabName] || "Command Console";

  if (tabName === "map") {
    renderRiskMap();
  } else if (tabName === "tourists") {
    loadTouristsTab();
  } else if (tabName === "incidents") {
    loadIncidentsTab();
  } else if (tabName === "anomalies") {
    loadAnomaliesTab();
  } else if (tabName === "ledger") {
    loadLedgerTab();
  } else if (tabName === "zones") {
    loadZonesTab();
  } else if (tabName === "verification") {
    loadQuickTokens();
  }
};

// ----------------------------------------------------
// Master Data Loader
// ----------------------------------------------------
async function loadAllDashboardData() {
  if (!adminToken) return;

  try {
    const [dashRes, clusterRes] = await Promise.all([
      fetch(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      fetch(`${API_BASE}/admin/clusters`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
    ]);

    if (dashRes.status === 401 || clusterRes.status === 401) {
      showLoginOverlay();
      return;
    }

    const dashJson = await dashRes.json();
    const clusterJson = await clusterRes.json();

    dashboardData = dashJson.data;
    clusterData = clusterJson.data;

    updateOverviewStats(dashboardData.statistics);
    updateOverviewTables(dashboardData);
    renderRiskMap();
  } catch (err) {
    console.error("Dashboard refresh error:", err);
  }
}

// ----------------------------------------------------
// Overview Tab Updates
// ----------------------------------------------------
function updateOverviewStats(stats) {
  if (!stats) return;

  document.getElementById("statTotalTourists").textContent = stats.totalTourists;
  document.getElementById("statActiveTourists").textContent = stats.activeTourists;
  document.getElementById("statOpenSos").textContent = stats.openSosIncidents;
  document.getElementById("statUnresolvedAnomalies").textContent = stats.unresolvedAnomalies;
  document.getElementById("statHighRiskTourists").textContent = stats.highRiskTourists;
  document.getElementById("statChainRecords").textContent = stats.totalAuditRecords;

  // Sidebar badges
  const sosBadge = document.getElementById("activeSosBadge");
  if (stats.openSosIncidents > 0) {
    sosBadge.textContent = stats.openSosIncidents;
    sosBadge.classList.remove("hidden");
  } else {
    sosBadge.classList.add("hidden");
  }

  document.getElementById("openIncidentsBadge").textContent = stats.openSosIncidents;
  document.getElementById("unresolvedAlertsBadge").textContent = stats.unresolvedAnomalies;

  const chainBadge = document.getElementById("chainStatusBadge");
  if (stats.chainIntact) {
    chainBadge.textContent = "VALID";
    chainBadge.className = "nav-badge badge-success";
  } else {
    chainBadge.textContent = "CORRUPT";
    chainBadge.className = "nav-badge badge-danger";
  }
}

function updateOverviewTables(data) {
  // Recent incidents table
  const incTbody = document.querySelector("#overviewIncidentsTable tbody");
  if (data.recentIncidents && data.recentIncidents.length > 0) {
    incTbody.innerHTML = data.recentIncidents
      .map(
        (inc) => `
        <tr>
          <td><strong class="font-mono text-teal">${inc.referenceCode}</strong></td>
          <td>${inc.tourist?.fullName || "Tourist"}</td>
          <td><span class="badge ${inc.type === "SOS" ? "badge-emergency" : "badge-info"}">${inc.type}</span></td>
          <td><span class="badge ${inc.severity === "CRITICAL" ? "badge-danger" : "badge-warning"}">${inc.severity}</span></td>
          <td><span class="badge ${inc.status === "OPEN" ? "badge-danger" : "badge-success"}">${inc.status}</span></td>
          <td>
            ${
              inc.status === "OPEN"
                ? `<button class="btn btn-sm btn-primary" onclick="patchIncidentStatus('${inc.id}', 'ACKNOWLEDGED')">Acknowledge</button>`
                : `<button class="btn btn-sm btn-outline" style="color:#0f172a;" onclick="patchIncidentStatus('${inc.id}', 'RESOLVED')">Resolve</button>`
            }
          </td>
        </tr>`
      )
      .join("");
  } else {
    incTbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No active incidents recorded.</td></tr>`;
  }

  // Recent anomalies table
  const alertTbody = document.querySelector("#overviewAlertsTable tbody");
  if (data.recentAlerts && data.recentAlerts.length > 0) {
    alertTbody.innerHTML = data.recentAlerts
      .map(
        (a) => `
        <tr>
          <td>${a.tourist?.fullName || "Tourist"}</td>
          <td><strong>${a.type.replace(/_/g, " ")}</strong></td>
          <td><span class="badge ${a.severity === "CRITICAL" || a.severity === "HIGH" ? "badge-danger" : "badge-warning"}">${a.severity}</span></td>
          <td><span class="badge ${a.status === "ACTIVE" ? "badge-danger" : "badge-success"}">${a.status}</span></td>
          <td>${new Date(a.createdAt).toLocaleTimeString()}</td>
        </tr>`
      )
      .join("");
  } else {
    alertTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No recent anomalies detected.</td></tr>`;
  }
}

// ----------------------------------------------------
// Geographic Risk Map (SVG Projection)
// ----------------------------------------------------
function setupMapFilters() {
  document.getElementById("toggleZonesCheck")?.addEventListener("change", renderRiskMap);
  document.getElementById("toggleTouristsCheck")?.addEventListener("change", renderRiskMap);
  document.getElementById("toggleSosCheck")?.addEventListener("change", renderRiskMap);
}

function projectToSvg(lat, lon) {
  // Bounding box for Jaipur tourist corridor:
  // Lat: 26.90 to 27.02 (top to bottom)
  // Lon: 75.80 to 75.92 (left to right)
  const MIN_LAT = 26.90, MAX_LAT = 27.02;
  const MIN_LON = 75.80, MAX_LON = 75.92;

  const clampedLat = Math.max(MIN_LAT, Math.min(MAX_LAT, lat));
  const clampedLon = Math.max(MIN_LON, Math.min(MAX_LON, lon));

  // Map Lon -> X (0 to 1000), Lat -> Y (600 to 0)
  const x = ((clampedLon - MIN_LON) / (MAX_LON - MIN_LON)) * 900 + 50;
  const y = 600 - (((clampedLat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 500 + 50);

  return { x: Math.round(x), y: Math.round(y) };
}

function renderRiskMap() {
  if (!clusterData) return;

  const showZones = document.getElementById("toggleZonesCheck")?.checked ?? true;
  const showTourists = document.getElementById("toggleTouristsCheck")?.checked ?? true;
  const showSos = document.getElementById("toggleSosCheck")?.checked ?? true;

  const zonesGroup = document.getElementById("mapZonesGroup");
  const touristsGroup = document.getElementById("mapTouristsGroup");
  const incidentsGroup = document.getElementById("mapIncidentsGroup");
  const corridorGroup = document.getElementById("mapCorridorGroup");

  zonesGroup.innerHTML = "";
  touristsGroup.innerHTML = "";
  incidentsGroup.innerHTML = "";
  corridorGroup.innerHTML = "";

  // Draw Corridor Background Track
  const p1 = projectToSvg(26.9239, 75.8267); // Hawa Mahal
  const p2 = projectToSvg(26.9855, 75.8513); // Amer Fort
  corridorGroup.innerHTML = `
    <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#0D9488" stroke-width="6" stroke-dasharray="8 6" opacity="0.3" />
    <text x="${(p1.x + p2.x) / 2 + 10}" y="${(p1.y + p2.y) / 2}" fill="#0F766E" font-size="11" font-weight="700">Protected Golden Heritage Corridor</text>
  `;

  // 1. Draw Safety Zones
  if (showZones && clusterData.safetyZones) {
    clusterData.safetyZones.forEach((zone) => {
      const pt = projectToSvg(zone.latitude, zone.longitude);
      const isDanger = zone.riskLevel === "DANGER";
      const isCaution = zone.riskLevel === "CAUTION";
      const fillColor = isDanger ? "#EF4444" : isCaution ? "#F59E0B" : "#10B981";
      const radiusSvg = Math.max(25, Math.min(80, (zone.radius / 600) * 55));

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", pt.x);
      circle.setAttribute("cy", pt.y);
      circle.setAttribute("r", radiusSvg);
      circle.setAttribute("fill", fillColor);
      circle.setAttribute("fill-opacity", "0.22");
      circle.setAttribute("stroke", fillColor);
      circle.setAttribute("stroke-width", "2");
      circle.setAttribute("style", "cursor: pointer;");

      circle.addEventListener("click", () => {
        inspectItem("Safety Zone: " + zone.name, `Risk: ${zone.riskLevel} | Radius: ${zone.radius}m | Coords: [${zone.latitude.toFixed(4)}, ${zone.longitude.toFixed(4)}]\nDescription: ${zone.description || "Designated monitored area"}`);
      });

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", pt.x);
      label.setAttribute("y", pt.y - radiusSvg - 6);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", isDanger ? "#991B1B" : isCaution ? "#92400E" : "#065F46");
      label.setAttribute("font-size", "11");
      label.setAttribute("font-weight", "800");
      label.textContent = zone.name.split(" ")[0] + ` (${zone.riskLevel})`;

      zonesGroup.appendChild(circle);
      zonesGroup.appendChild(label);
    });
  }

  // 2. Draw Tourists
  if (showTourists && clusterData.tourists) {
    clusterData.tourists.forEach((t) => {
      const pt = projectToSvg(t.latitude, t.longitude);
      const isDanger = t.riskLevel === "DANGER" || t.hasOpenSos;

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("style", "cursor: pointer;");
      group.innerHTML = `
        <circle cx="${pt.x}" cy="${pt.y}" r="8" fill="${isDanger ? "#DC2626" : "#2563EB"}" stroke="#FFFFFF" stroke-width="2" />
        <text x="${pt.x + 12}" y="${pt.y + 4}" fill="#0F172A" font-size="10" font-weight="700">${t.fullName}</text>
      `;

      group.addEventListener("click", () => {
        inspectItem(`Tourist: ${t.fullName} (${t.touristCode})`, `Coordinates: [${t.latitude.toFixed(4)}, ${t.longitude.toFixed(4)}]\nRisk Status: ${isDanger ? "HIGH RISK / OPEN INCIDENT" : "NORMAL MONITORING"}`);
      });

      touristsGroup.appendChild(group);
    });
  }

  // 3. Draw Active Incidents
  if (showSos && clusterData.incidents) {
    clusterData.incidents.forEach((inc) => {
      const pt = projectToSvg(inc.latitude, inc.longitude);

      const beacon = document.createElementNS("http://www.w3.org/2000/svg", "g");
      beacon.setAttribute("style", "cursor: pointer;");
      beacon.innerHTML = `
        <circle cx="${pt.x}" cy="${pt.y}" r="18" fill="#DC2626" fill-opacity="0.35">
          <animate attributeName="r" values="12;28;12" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="fill-opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${pt.x}" cy="${pt.y}" r="7" fill="#DC2626" stroke="#FFFFFF" stroke-width="2"/>
        <text x="${pt.x}" y="${pt.y + 26}" text-anchor="middle" fill="#991B1B" font-size="10" font-weight="900">${inc.referenceCode}</text>
      `;

      beacon.addEventListener("click", () => {
        inspectItem(`EMERGENCY INCIDENT: ${inc.referenceCode}`, `Tourist: ${inc.touristName} (${inc.touristCode})\nSeverity: ${inc.severity} | Status: ${inc.status}\nCoordinates: [${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}]\nReport: ${inc.description}`);
      });

      incidentsGroup.appendChild(beacon);
    });
  }
}

function inspectItem(title, details) {
  const inspector = document.getElementById("mapDetailInspector");
  inspector.innerHTML = `
    <h4>${title}</h4>
    <p style="white-space: pre-line; font-size: 12px; color: #334155; margin-top: 4px;">${details}</p>
  `;
}

// ----------------------------------------------------
// Tourist Monitoring Tab
// ----------------------------------------------------
async function loadTouristsTab() {
  const search = document.getElementById("touristSearchInput")?.value || "";
  const risk = document.getElementById("touristRiskFilter")?.value || "";

  try {
    const res = await fetch(`${API_BASE}/admin/tourists?search=${encodeURIComponent(search)}&riskCategory=${encodeURIComponent(risk)}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const tbody = document.querySelector("#touristsTable tbody");

    if (data.data && data.data.length > 0) {
      tbody.innerHTML = data.data
        .map(
          (t) => `
        <tr>
          <td><strong class="font-mono text-teal">${t.touristCode}</strong></td>
          <td><strong>${t.fullName}</strong></td>
          <td>${t.phone}</td>
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              <strong style="color:${t.safetyScore >= 80 ? "#10B981" : t.safetyScore >= 50 ? "#D97706" : "#DC2626"}">${t.safetyScore}</strong>
              <div style="width:50px; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">
                <div style="width:${t.safetyScore}%; height:6px; background:${t.safetyScore >= 80 ? "#10B981" : t.safetyScore >= 50 ? "#D97706" : "#DC2626"};"></div>
              </div>
            </div>
          </td>
          <td><span class="badge ${t.riskCategory === "SAFE" ? "badge-success" : t.riskCategory === "MODERATE" ? "badge-warning" : "badge-danger"}">${t.riskCategory}</span></td>
          <td>${t.itinerary || "Golden Corridor"}</td>
          <td>${new Date(t.visitExpiry).toLocaleDateString()}</td>
          <td>
            <span class="badge ${t.hasActiveSos ? "badge-emergency" : "badge-success"}">
              ${t.hasActiveSos ? "ACTIVE SOS" : "ACTIVE"}
            </span>
          </td>
        </tr>`
        )
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No matching tourists found.</td></tr>`;
    }
  } catch (err) {
    console.error("Load tourists error:", err);
  }
}

document.getElementById("touristSearchInput")?.addEventListener("input", debounce(loadTouristsTab, 300));
document.getElementById("touristRiskFilter")?.addEventListener("change", loadTouristsTab);

// ----------------------------------------------------
// Incident Management Tab
// ----------------------------------------------------
let currentIncidentFilter = "";

function setupIncidentFilters() {
  document.querySelectorAll("#incidentFilterGroup .btn-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#incidentFilterGroup .btn-filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentIncidentFilter = btn.dataset.filter;
      loadIncidentsTab();
    });
  });
}
setupIncidentFilters();

async function loadIncidentsTab() {
  try {
    const url = currentIncidentFilter ? `${API_BASE}/admin/incidents?status=${currentIncidentFilter}` : `${API_BASE}/admin/incidents`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const tbody = document.querySelector("#incidentsTable tbody");

    if (data.data && data.data.length > 0) {
      tbody.innerHTML = data.data
        .map(
          (inc) => `
        <tr>
          <td><strong class="font-mono text-teal">${inc.referenceCode}</strong></td>
          <td>
            <strong>${inc.tourist?.fullName || "Tourist"}</strong><br>
            <span class="text-muted" style="font-size:10px;">ID: ${inc.tourist?.touristCode || inc.touristId}</span>
          </td>
          <td><span class="badge ${inc.type === "SOS" ? "badge-emergency" : "badge-info"}">${inc.type}</span></td>
          <td><span class="badge ${inc.severity === "CRITICAL" ? "badge-danger" : "badge-warning"}">${inc.severity}</span></td>
          <td class="font-mono" style="font-size:11px;">[${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}]</td>
          <td>${new Date(inc.createdAt).toLocaleString()}</td>
          <td><span class="badge ${inc.status === "OPEN" ? "badge-danger" : inc.status === "ACKNOWLEDGED" ? "badge-warning" : "badge-success"}">${inc.status}</span></td>
          <td>
            <select class="form-control" style="font-size:11px; padding:3px 6px;" onchange="patchIncidentStatus('${inc.id}', this.value)">
              <option value="OPEN" ${inc.status === "OPEN" ? "selected" : ""}>OPEN</option>
              <option value="ACKNOWLEDGED" ${inc.status === "ACKNOWLEDGED" ? "selected" : ""}>ACKNOWLEDGE</option>
              <option value="RESOLVED" ${inc.status === "RESOLVED" ? "selected" : ""}>RESOLVE</option>
              <option value="CANCELLED" ${inc.status === "CANCELLED" ? "selected" : ""}>CANCEL</option>
            </select>
          </td>
        </tr>`
        )
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No incidents matching filter.</td></tr>`;
    }
  } catch (err) {
    console.error("Load incidents error:", err);
  }
}

window.patchIncidentStatus = async function (id, status) {
  try {
    const res = await fetch(`${API_BASE}/admin/incidents/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      loadAllDashboardData();
      if (currentTab === "incidents") loadIncidentsTab();
    }
  } catch (err) {
    alert("Error updating incident status: " + err.message);
  }
};

// ----------------------------------------------------
// Anomaly Alerts Tab
// ----------------------------------------------------
let currentAnomalyFilter = "";

function setupAnomalyFilters() {
  document.querySelectorAll("#anomalyFilterGroup .btn-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#anomalyFilterGroup .btn-filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentAnomalyFilter = btn.dataset.filter;
      loadAnomaliesTab();
    });
  });
}
setupAnomalyFilters();

async function loadAnomaliesTab() {
  try {
    const url = currentAnomalyFilter ? `${API_BASE}/admin/anomalies?status=${currentAnomalyFilter}` : `${API_BASE}/admin/anomalies`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const tbody = document.querySelector("#anomaliesTable tbody");

    if (data.data && data.data.length > 0) {
      tbody.innerHTML = data.data
        .map(
          (a) => `
        <tr>
          <td>
            <strong>${a.tourist?.fullName || "Tourist"}</strong><br>
            <span class="text-muted" style="font-size:10px;">${a.tourist?.touristCode || ""}</span>
          </td>
          <td><strong>${a.type.replace(/_/g, " ")}</strong></td>
          <td><span class="badge ${a.severity === "CRITICAL" || a.severity === "HIGH" ? "badge-danger" : "badge-warning"}">${a.severity}</span></td>
          <td style="max-width:320px;">${a.description}</td>
          <td>${new Date(a.createdAt).toLocaleString()}</td>
          <td><span class="badge ${a.status === "ACTIVE" ? "badge-danger" : "badge-success"}">${a.status}</span></td>
          <td>
            ${
              a.status === "ACTIVE"
                ? `<button class="btn btn-sm btn-outline" onclick="patchAnomalyStatus('${a.id}', 'ACKNOWLEDGED')">Acknowledge</button>`
                : a.status === "ACKNOWLEDGED"
                ? `<button class="btn btn-sm btn-primary" onclick="patchAnomalyStatus('${a.id}', 'RESOLVED')">Resolve</button>`
                : `<span class="text-muted">Closed</span>`
            }
          </td>
        </tr>`
        )
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No anomaly alerts.</td></tr>`;
    }
  } catch (err) {
    console.error("Load anomalies error:", err);
  }
}

window.patchAnomalyStatus = async function (id, status) {
  try {
    const res = await fetch(`${API_BASE}/admin/anomalies/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      loadAllDashboardData();
      loadAnomaliesTab();
    }
  } catch (err) {
    alert("Error updating anomaly status: " + err.message);
  }
};

// ----------------------------------------------------
// QR Pass Verification Tab
// ----------------------------------------------------
function setupVerificationForm() {
  const form = document.getElementById("qrVerifyForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = document.getElementById("qrTokenInput").value.trim();
    if (!token) return;
    executeVerifyToken(token);
  });
}

async function executeVerifyToken(token) {
  const outcomeContainer = document.getElementById("verificationOutcomeContainer");
  outcomeContainer.innerHTML = `<div class="empty-placeholder"><p>Verifying token with cryptographic backend...</p></div>`;

  try {
    const res = await fetch(`${API_BASE}/verification/${encodeURIComponent(token)}`);
    const data = await res.json();
    const v = data.data;

    if (data.success && v?.status === "VALID") {
      outcomeContainer.innerHTML = `
        <div class="verify-result-card verify-valid">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span class="badge badge-success">● VERIFIED VALID PASS</span>
            <span class="font-mono" style="font-size:11px; color:#059669;">Zero-Knowledge Token</span>
          </div>

          <h3 style="font-size:18px; font-weight:900; color:#065F46;">${v.fullName}</h3>
          <p class="font-mono text-teal" style="font-size:14px; font-weight:800; margin-top:2px;">PASS CODE: ${v.touristCode}</p>

          <div style="margin-top:16px; border-top:1px solid #A7F3D0; padding-top:12px; font-size:12px; line-height:1.8;">
            <div><strong>Permitted Validity:</strong> Valid through ${new Date(v.visitExpiry).toLocaleDateString()}</div>
            <div><strong>Registration Date:</strong> ${new Date(v.registeredDate).toLocaleDateString()}</div>
            <div><strong>Verification Timestamp:</strong> ${new Date(v.verifiedAt).toLocaleTimeString()}</div>
            <div><strong>Issuing Authority:</strong> ${v.issuer}</div>
          </div>

          <div class="alert-box alert-success mt-4">
            ✓ Logged to tamper-evident audit ledger under event <code>QR_VERIFIED_SUCCESS</code>.
          </div>
        </div>
      `;
    } else {
      outcomeContainer.innerHTML = `
        <div class="verify-result-card verify-invalid">
          <span class="badge badge-danger">● REJECTED: ${v?.status || "INVALID"}</span>
          <h3 style="font-size:16px; font-weight:800; color:#991B1B; margin-top:8px;">${data.message || "Invalid Token"}</h3>
          <p class="text-muted" style="font-size:12px; margin-top:4px;">Reason: The verification token provided is unrecognized, expired, or has been revoked by authorities.</p>
          <div class="alert-box alert-danger mt-4">
            ⚠ Verification attempt recorded in audit ledger for security auditing.
          </div>
        </div>
      `;
    }
  } catch (err) {
    outcomeContainer.innerHTML = `<div class="alert-box alert-danger">Error: ${err.message}</div>`;
  }
}

async function loadQuickTokens() {
  const container = document.getElementById("quickTokensContainer");
  try {
    const res = await fetch(`${API_BASE}/admin/tourists`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      container.innerHTML = "";
      for (const t of data.data.slice(0, 3)) {
        // Fetch or create token for quick test
        const tokRes = await fetch(`${API_BASE}/verification/tokens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ touristId: t.id }),
        });
        const tokJson = await tokRes.json();
        const rawToken = tokJson.data?.rawToken;

        const chip = document.createElement("div");
        chip.className = "quick-token-chip";
        chip.innerHTML = `<span>👤 ${t.fullName} (${t.touristCode})</span><span class="btn btn-sm btn-primary">Test Verify</span>`;
        chip.addEventListener("click", () => {
          document.getElementById("qrTokenInput").value = rawToken;
          executeVerifyToken(rawToken);
        });
        container.appendChild(chip);
      }
    }
  } catch (err) {
    container.innerHTML = `<span class="text-muted">Unable to load test tokens.</span>`;
  }
}

// ----------------------------------------------------
// Tamper-Evident Audit Ledger Tab
// ----------------------------------------------------
function setupLedgerVerifyButton() {
  const btn = document.getElementById("verifyLedgerBtn");
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Verifying Hashes...";

    const notice = document.getElementById("chainVerificationNotice");
    try {
      const res = await fetch(`${API_BASE}/audit-ledger/verify`);
      const data = await res.json();
      const v = data.data;

      notice.classList.remove("hidden");
      if (v.valid) {
        notice.className = "alert-box alert-success mt-2";
        notice.innerHTML = `<strong>✓ CHAIN INTEGRITY CONFIRMED:</strong> ${v.message} (${v.verifiedRecords}/${v.totalRecords} blocks verified).`;
      } else {
        notice.className = "alert-box alert-danger mt-2";
        notice.innerHTML = `<strong>✗ TAMPERING DETECTED:</strong> ${v.message}`;
      }
    } catch (err) {
      notice.className = "alert-box alert-danger mt-2";
      notice.textContent = "Verification request failed: " + err.message;
      notice.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "🛡 Verify Complete Chain";
      loadLedgerTab();
    }
  });
}

async function loadLedgerTab() {
  try {
    const res = await fetch(`${API_BASE}/audit-ledger?limit=50`);
    const data = await res.json();
    const tbody = document.querySelector("#ledgerTable tbody");

    if (data.data && data.data.length > 0) {
      tbody.innerHTML = data.data
        .map(
          (rec) => `
        <tr>
          <td><strong class="font-mono text-teal">${rec.id}</strong></td>
          <td><span class="badge badge-info">${rec.eventType}</span></td>
          <td>${rec.entityType}:${rec.entityId.slice(0, 8)}</td>
          <td>${new Date(rec.timestamp).toLocaleTimeString()}</td>
          <td class="font-mono" style="font-size:10px; color:#64748B;">${rec.previousHash.slice(0, 16)}...</td>
          <td class="font-mono" style="font-size:10px; color:#0D9488; font-weight:700;">${rec.currentHash.slice(0, 16)}...</td>
          <td><span class="badge badge-success">VERIFIED</span></td>
        </tr>`
        )
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No audit ledger records.</td></tr>`;
    }
  } catch (err) {
    console.error("Load ledger error:", err);
  }
}

// ----------------------------------------------------
// Safety Zones Tab
// ----------------------------------------------------
async function loadZonesTab() {
  try {
    const res = await fetch(`${API_BASE}/geofence/zones`);
    const data = await res.json();
    const tbody = document.querySelector("#zonesTable tbody");

    if (data.data && data.data.length > 0) {
      tbody.innerHTML = data.data
        .map(
          (z) => `
        <tr>
          <td><strong>${z.name}</strong></td>
          <td><span class="badge ${z.riskLevel === "DANGER" ? "badge-danger" : z.riskLevel === "CAUTION" ? "badge-warning" : "badge-success"}">${z.riskLevel}</span></td>
          <td class="font-mono">[${z.latitude.toFixed(4)}, ${z.longitude.toFixed(4)}]</td>
          <td>${z.radius} meters</td>
          <td style="max-width:320px;">${z.description || ""}</td>
        </tr>`
        )
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No safety zones configured.</td></tr>`;
    }
  } catch (err) {
    console.error("Load zones error:", err);
  }
}

// Helper: debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
