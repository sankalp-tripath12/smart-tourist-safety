import {
  createSosIncident,
  getAllIncidents,
  getIncidentById,
  getIncidentsByTouristId,
  updateIncidentStatus,
} from "../services/incident.service.js";

export async function triggerSos(req, res) {
  const { touristId, latitude, longitude, description } = req.body;

  if (!touristId) {
    return res.status(400).json({
      success: false,
      message: "touristId is required to trigger SOS",
    });
  }

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "GPS coordinates (latitude, longitude) are required for SOS",
    });
  }

  try {
    const incident = await createSosIncident({
      touristId,
      latitude,
      longitude,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Emergency SOS incident created successfully (Simulated MVP Incident)",
      data: incident,
    });
  } catch (error) {
    console.error("SOS trigger error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to trigger SOS",
    });
  }
}

export async function fetchAllIncidents(req, res) {
  try {
    const { status, type, severity, touristId } = req.query;
    const incidents = await getAllIncidents({ status, type, severity, touristId });

    return res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    console.error("Fetch incidents error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch incidents",
    });
  }
}

export async function fetchIncidentById(req, res) {
  try {
    const incident = await getIncidentById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    console.error("Fetch incident error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch incident",
    });
  }
}

export async function fetchTouristIncidents(req, res) {
  try {
    const incidents = await getIncidentsByTouristId(req.params.touristId);
    return res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    console.error("Fetch tourist incidents error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch tourist incidents",
    });
  }
}

export async function patchIncidentStatus(req, res) {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({
      success: false,
      message: "status is required in request body",
    });
  }

  try {
    const updated = await updateIncidentStatus(req.params.id, status);
    return res.status(200).json({
      success: true,
      message: "Incident status updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Patch incident status error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update incident status",
    });
  }
}
