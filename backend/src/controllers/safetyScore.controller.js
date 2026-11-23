import { calculateTouristSafetyScore } from "../services/safetyScore.service.js";

export async function getTouristSafetyScore(req, res) {
  const { touristId } = req.params;
  const { latitude, longitude } = req.query;

  try {
    const result = await calculateTouristSafetyScore({
      touristId,
      latitude,
      longitude,
    });

    return res.status(200).json({
      success: true,
      message: "Safety score calculated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Calculate safety score error:", error);
    const status = error.message.includes("not found") ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to calculate safety score",
    });
  }
}

export async function computeSafetyScorePost(req, res) {
  const { touristId, latitude, longitude } = req.body;

  if (!touristId) {
    return res.status(400).json({
      success: false,
      message: "touristId is required in request body",
    });
  }

  try {
    const result = await calculateTouristSafetyScore({
      touristId,
      latitude,
      longitude,
    });

    return res.status(200).json({
      success: true,
      message: "Safety score calculated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Compute safety score error:", error);
    const status = error.message.includes("not found") ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to calculate safety score",
    });
  }
}
