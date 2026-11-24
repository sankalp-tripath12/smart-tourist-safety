import {
  authenticateAdmin,
} from "../services/adminAuth.service.js";
import {
  getDashboardOverview,
  getMonitoredTourists,
  updateIncidentByAdmin,
  updateAnomalyByAdmin,
  getGeographicClusters,
} from "../services/adminDashboard.service.js";
import { getAllIncidents } from "../services/incident.service.js";
import { getAllAnomalyAlerts } from "../services/anomalyDetection.service.js";
import { getAllSafetyZones } from "../services/geoFence.service.js";

export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    const result = await authenticateAdmin(email, password);

    return res.status(200).json({
      success: true,
      message: "Authority authentication successful",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
}

export async function getAdminProfile(req, res) {
  return res.status(200).json({
    success: true,
    data: req.admin,
  });
}

export async function logoutAdmin(req, res) {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function fetchDashboardOverview(req, res) {
  try {
    const data = await getDashboardOverview();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve dashboard statistics",
    });
  }
}

export async function fetchTouristsAdmin(req, res) {
  try {
    const { search, riskCategory } = req.query;
    const tourists = await getMonitoredTourists({ search, riskCategory });
    return res.status(200).json({
      success: true,
      count: tourists.length,
      data: tourists,
    });
  } catch (error) {
    console.error("Fetch tourists admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve tourist records",
    });
  }
}

export async function fetchIncidentsAdmin(req, res) {
  try {
    const { status, type, severity, touristId } = req.query;
    const incidents = await getAllIncidents({ status, type, severity, touristId });
    return res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    console.error("Fetch incidents admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve incident records",
    });
  }
}

export async function patchIncidentStatusAdmin(req, res) {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const updated = await updateIncidentByAdmin(req.params.id, status, req.admin);
    return res.status(200).json({
      success: true,
      message: `Incident status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    console.error("Update incident status error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update incident status",
    });
  }
}

export async function fetchAnomaliesAdmin(req, res) {
  try {
    const { touristId, severity, status, type } = req.query;
    const anomalies = await getAllAnomalyAlerts({ touristId, severity, status, type });
    return res.status(200).json({
      success: true,
      count: anomalies.length,
      data: anomalies,
    });
  } catch (error) {
    console.error("Fetch anomalies admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve anomaly alerts",
    });
  }
}

export async function patchAnomalyStatusAdmin(req, res) {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const updated = await updateAnomalyByAdmin(req.params.id, status, req.admin);
    return res.status(200).json({
      success: true,
      message: `Anomaly alert status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    console.error("Update anomaly status error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update anomaly alert status",
    });
  }
}

export async function fetchClustersMap(req, res) {
  try {
    const clusters = await getGeographicClusters();
    return res.status(200).json({
      success: true,
      data: clusters,
    });
  } catch (error) {
    console.error("Fetch map clusters error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve map cluster points",
    });
  }
}

export async function fetchZonesAdmin(req, res) {
  try {
    const zones = await getAllSafetyZones();
    return res.status(200).json({
      success: true,
      count: zones.length,
      data: zones,
    });
  } catch (error) {
    console.error("Fetch zones admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve safety zones",
    });
  }
}
