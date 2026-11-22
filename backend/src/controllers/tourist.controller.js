import {
  registerTourist,
  getTouristById,
  getAllTourists,
} from "../services/tourist.service.js";

export async function createTourist(req, res) {
  const {
    fullName,
    phone,
    email,
    emergencyContactName,
    emergencyContactPhone,
    itinerary,
    visitExpiry,
  } = req.body;

  const requiredFields = {
    fullName,
    phone,
    emergencyContactName,
    emergencyContactPhone,
    visitExpiry,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => typeof value !== "string" || !value.trim())
    .map(([field]) => field);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Required fields are missing or invalid",
      missingFields,
    });
  }

  if (
    email !== undefined &&
    email !== null &&
    (typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
  }

  if (
    itinerary !== undefined &&
    itinerary !== null &&
    typeof itinerary !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Itinerary must be a string",
    });
  }

  const expiryDate = new Date(visitExpiry);

  if (Number.isNaN(expiryDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid visit expiry date",
    });
  }

  try {
    const tourist = await registerTourist(req.body);

    return res.status(201).json({
      success: true,
      message: "Tourist registered successfully",
      data: tourist,
    });
  } catch (error) {
    console.error("Tourist registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register tourist",
    });
  }
}

export async function fetchAllTourists(req, res) {
  try {
    const tourists = await getAllTourists();

    return res.status(200).json({
      success: true,
      count: tourists.length,
      data: tourists,
    });
  } catch (error) {
    console.error("Fetch tourists error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch tourists",
    });
  }
}

export async function fetchTouristById(req, res) {
  try {
    const tourist = await getTouristById(req.params.id);

    if (!tourist) {
      return res.status(404).json({
        success: false,
        message: "Tourist not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tourist,
    });
  } catch (error) {
    console.error("Fetch tourist error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch tourist",
    });
  }
}
