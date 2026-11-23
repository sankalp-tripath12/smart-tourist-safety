import {
  getAllSafetyZones,
  getSafetyZoneById,
  createSafetyZone,
  evaluateLocationAgainstZones,
} from "../services/geoFence.service.js";

export async function fetchAllZones(req, res) {
  try {
    const zones = await getAllSafetyZones();
    return res.status(200).json({
      success: true,
      count: zones.length,
      data: zones,
    });
  } catch (error) {
    console.error("Fetch safety zones error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch safety zones",
    });
  }
}

export async function fetchZoneById(req, res) {
  try {
    const zone = await getSafetyZoneById(req.params.id);
    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Safety zone not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: zone,
    });
  } catch (error) {
    console.error("Fetch safety zone error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch safety zone",
    });
  }
}

export async function addSafetyZone(req, res) {
  const { name, latitude, longitude, radius, riskLevel, description } = req.body;

  if (!name || latitude === undefined || longitude === undefined || radius === undefined || !riskLevel) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: name, latitude, longitude, radius, riskLevel",
    });
  }

  const validRiskLevels = ["SAFE", "CAUTION", "DANGER"];
  if (!validRiskLevels.includes(riskLevel.toUpperCase().trim())) {
    return res.status(400).json({
      success: false,
      message: `Invalid riskLevel. Must be one of: ${validRiskLevels.join(", ")}`,
    });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const rad = parseFloat(radius);

  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      message: "Invalid latitude. Must be a number between -90 and 90",
    });
  }

  if (Number.isNaN(lon) || lon < -180 || lon > 180) {
    return res.status(400).json({
      success: false,
      message: "Invalid longitude. Must be a number between -180 and 180",
    });
  }

  if (Number.isNaN(rad) || rad <= 0) {
    return res.status(400).json({
      success: false,
      message: "Radius must be a positive number in meters",
    });
  }

  try {
    const newZone = await createSafetyZone({
      name,
      latitude: lat,
      longitude: lon,
      radius: rad,
      riskLevel,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Safety zone created successfully",
      data: newZone,
    });
  } catch (error) {
    console.error("Create safety zone error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create safety zone",
    });
  }
}

export async function evaluateLocation(req, res) {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "Latitude and longitude are required",
    });
  }

  try {
    const result = await evaluateLocationAgainstZones(latitude, longitude);
    return res.status(200).json({
      success: true,
      message: "Location evaluated against safety zones",
      data: result,
    });
  } catch (error) {
    console.error("Evaluate location error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to evaluate location",
    });
  }
}
