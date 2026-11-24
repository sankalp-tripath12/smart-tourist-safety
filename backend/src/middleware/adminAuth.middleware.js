import { verifyAdminToken } from "../services/adminAuth.service.js";

/**
 * Middleware protecting admin routes.
 */
export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  let token = null;

  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Valid authority token required in Authorization header.",
    });
  }

  const decoded = verifyAdminToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Session token invalid or expired. Please log in again.",
    });
  }

  req.admin = decoded;
  next();
}
