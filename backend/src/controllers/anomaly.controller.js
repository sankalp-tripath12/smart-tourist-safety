import {
  detectAnomalies,
  simulateAnomalyScenario,
  getAllAnomalyAlerts,
  getAlertsByTouristId,
  updateAlertStatus,
} from "../services/anomalyDetection.service.js";

export async function runAnomalyDetection(req, res) {
  const {
    touristId,
    currentLatitude,
    currentLongitude,
    previousLatitude,
    previousLongitude,
    timeElapsedMinutes,
    itineraryCoordinates,
  } = req.body;

  if (!touristId) {
    return res.status(400).json({
      success: false,
      message: "touristId is required for anomaly detection",
    });
  }

  try {
    const result = await detectAnomalies({
      touristId,
      currentLatitude,
      currentLongitude,
      previousLatitude,
      previousLongitude,
      timeElapsedMinutes,
      itineraryCoordinates,
    });

    return res.status(200).json({
      success: true,
      message: "Anomaly detection rules evaluated",
      data: result,
    });
  } catch (error) {
    console.error("Anomaly detection error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to evaluate anomaly rules",
    });
  }
}

export async function simulateAnomaly(req, res) {
  const { touristId, scenario, latitude, longitude } = req.body;

  if (!touristId || !scenario) {
    return res.status(400).json({
      success: false,
      message: "touristId and scenario are required for anomaly simulation",
    });
  }

  try {
    const simulatedAlert = await simulateAnomalyScenario({
      touristId,
      scenario,
      latitude,
      longitude,
    });

    return res.status(201).json({
      success: true,
      message: `Simulated anomaly "${scenario}" generated successfully`,
      data: simulatedAlert,
    });
  } catch (error) {
    console.error("Simulate anomaly error:", error);
    const status = error.message.includes("not found") ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to simulate anomaly",
    });
  }
}

export async function fetchAllAlerts(req, res) {
  try {
    const { touristId, severity, status, type } = req.query;
    const alerts = await getAllAnomalyAlerts({ touristId, severity, status, type });

    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Fetch anomaly alerts error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch anomaly alerts",
    });
  }
}

export async function fetchTouristAlerts(req, res) {
  try {
    const alerts = await getAlertsByTouristId(req.params.touristId);
    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Fetch tourist anomaly alerts error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch tourist anomaly alerts",
    });
  }
}

export async function patchAlertStatus(req, res) {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({
      success: false,
      message: "status is required in request body",
    });
  }

  try {
    const updated = await updateAlertStatus(req.params.id, status);
    return res.status(200).json({
      success: true,
      message: "Alert status updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Patch alert status error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update alert status",
    });
  }
}
