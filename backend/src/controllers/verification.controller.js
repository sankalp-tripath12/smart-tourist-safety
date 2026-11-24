import {
  verifyTouristToken,
  createVerificationToken,
  getActiveOrCreateToken,
  revokeToken,
} from "../services/verification.service.js";

export async function verifyToken(req, res) {
  try {
    const { token } = req.params;
    const result = await verifyTouristToken(token);
    const statusCode = result.valid ? 200 : 400;

    return res.status(statusCode).json({
      success: result.valid,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process QR verification request",
    });
  }
}

export async function generateToken(req, res) {
  try {
    const { touristId, validHours } = req.body;
    if (!touristId) {
      return res.status(400).json({
        success: false,
        message: "touristId is required to generate a verification token",
      });
    }

    const tokenData = await getActiveOrCreateToken(touristId, validHours);
    return res.status(201).json({
      success: true,
      message: "Verification token generated successfully",
      data: tokenData,
    });
  } catch (error) {
    console.error("Generate token error:", error);
    const statusCode = error.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to generate verification token",
    });
  }
}

export async function revokeVerificationToken(req, res) {
  try {
    const { id } = req.params;
    const updated = await revokeToken(id);
    return res.status(200).json({
      success: true,
      message: "Verification token revoked successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Revoke token error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to revoke token",
    });
  }
}
