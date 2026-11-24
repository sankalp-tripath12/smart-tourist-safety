import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";
import { appendAuditEvent } from "./auditLedger.service.js";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "smart-tourist-safety-admin-secret-2026";
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@safetravel.gov.in";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@Safety2026!";

/**
 * Derives a secure password hash using scrypt and a random 16-byte salt.
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string.
 */
export function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generates an HMAC-SHA256 signed session token for an authenticated admin.
 */
export function generateAdminToken(adminUser, expiresInHours = 12) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      fullName: adminUser.fullName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInHours * 3600,
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

/**
 * Verifies and decodes an admin token.
 */
export function verifyAdminToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const nowSec = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < nowSec) {
      return null; // Expired
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Seeds default administrator account if none exists.
 */
export async function seedDefaultAdminUser() {
  const adminCount = await prisma.adminUser.count();
  if (adminCount === 0) {
    console.log("Seeding default demonstration authority operator...");
    const admin = await prisma.adminUser.create({
      data: {
        email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
        passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
        fullName: "Superintendent / Duty Officer",
        role: "ADMIN",
      },
    });

    await appendAuditEvent({
      eventType: "ADMIN_SEED",
      entityType: "AdminUser",
      entityId: admin.id,
      payload: {
        email: admin.email,
        role: admin.role,
        note: "Initial authority demonstration credentials generated",
      },
    });

    console.log(`Demo operator created: ${DEFAULT_ADMIN_EMAIL}`);
  }
}

/**
 * Authenticates an admin and returns session token.
 */
export async function authenticateAdmin(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    // Log failed login
    await appendAuditEvent({
      eventType: "ADMIN_LOGIN_FAILED",
      entityType: "AdminUser",
      entityId: email,
      payload: { email },
    });
    throw new Error("Invalid authority credentials.");
  }

  const token = generateAdminToken(admin);

  // Log successful login
  await appendAuditEvent({
    eventType: "ADMIN_LOGIN_SUCCESS",
    entityType: "AdminUser",
    entityId: admin.id,
    payload: {
      email: admin.email,
      role: admin.role,
    },
  });

  return {
    token,
    user: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
    },
  };
}
