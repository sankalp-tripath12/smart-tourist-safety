import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";
import { appendAuditEvent } from "./auditLedger.service.js";

/**
 * Computes SHA-256 hash of a raw token for secure database storage and lookup.
 */
export function hashToken(rawToken) {
  return crypto.createHash("sha256").update(String(rawToken).trim()).digest("hex");
}

/**
 * Generates a cryptographically secure verification token for a tourist.
 * Stores only tokenHash in DB, returns rawToken to mobile client for QR encoding.
 */
export async function createVerificationToken(touristId, validHours = 24) {
  const tourist = await prisma.tourist.findUnique({
    where: { id: touristId },
  });

  if (!tourist) {
    throw new Error(`Tourist with ID ${touristId} not found`);
  }

  // Generate 256-bit cryptographically secure token
  const rawToken = "st_tok_" + crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  // Expiration: min(now + validHours, tourist.visitExpiry)
  const maxExpiry = new Date(Date.now() + validHours * 3600 * 1000);
  const expiresAt = tourist.visitExpiry && tourist.visitExpiry < maxExpiry
    ? tourist.visitExpiry
    : maxExpiry;

  const tokenRecord = await prisma.verificationToken.create({
    data: {
      touristId,
      tokenHash,
      expiresAt,
    },
  });

  // Log to tamper-evident audit ledger
  await appendAuditEvent({
    eventType: "QR_TOKEN_GENERATED",
    entityType: "VerificationToken",
    entityId: tokenRecord.id,
    payload: {
      touristId,
      touristCode: tourist.touristCode,
      expiresAt: expiresAt.toISOString(),
      tokenHashPrefix: tokenHash.slice(0, 10),
    },
  });

  return {
    rawToken,
    tokenId: tokenRecord.id,
    touristId: tourist.id,
    touristCode: tourist.touristCode,
    fullName: tourist.fullName,
    expiresAt,
  };
}

/**
 * Gets or creates the active valid verification token for a tourist.
 */
export async function getActiveOrCreateToken(touristId) {
  const now = new Date();

  // Check if an unrevoked, unexpired token already exists
  const existingToken = await prisma.verificationToken.findFirst({
    where: {
      touristId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    include: { tourist: true },
  });

  if (existingToken) {
    // Generate fresh raw token for safe display since we do not store raw tokens
    return createVerificationToken(touristId);
  }

  return createVerificationToken(touristId);
}

/**
 * Verifies a QR token.
 * Validates existence, revocation, token expiry, and tourist validity.
 * Returns only minimum necessary public verification fields.
 */
export async function verifyTouristToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string" || !rawToken.trim()) {
    return {
      valid: false,
      status: "INVALID",
      message: "Malformed or empty verification token.",
      verifiedAt: new Date().toISOString(),
    };
  }

  const tokenHash = hashToken(rawToken);

  const tokenRecord = await prisma.verificationToken.findUnique({
    where: { tokenHash },
    include: {
      tourist: {
        select: {
          id: true,
          touristCode: true,
          fullName: true,
          visitExpiry: true,
          createdAt: true,
        },
      },
    },
  });

  if (!tokenRecord) {
    // Log failed verification attempt
    await appendAuditEvent({
      eventType: "QR_VERIFICATION_ATTEMPT",
      entityType: "VerificationToken",
      entityId: "unknown",
      payload: {
        result: "INVALID_TOKEN",
        tokenHashPrefix: tokenHash.slice(0, 10),
      },
    });

    return {
      valid: false,
      status: "INVALID",
      message: "Verification token not recognized or does not exist.",
      verifiedAt: new Date().toISOString(),
    };
  }

  const now = new Date();

  // Check revocation
  if (tokenRecord.revokedAt) {
    await appendAuditEvent({
      eventType: "QR_VERIFICATION_ATTEMPT",
      entityType: "VerificationToken",
      entityId: tokenRecord.id,
      payload: {
        result: "TOKEN_REVOKED",
        touristCode: tokenRecord.tourist.touristCode,
        revokedAt: tokenRecord.revokedAt.toISOString(),
      },
    });

    return {
      valid: false,
      status: "REVOKED",
      message: "This digital tourist pass has been revoked by authorities.",
      touristCode: tokenRecord.tourist.touristCode,
      fullName: tokenRecord.tourist.fullName,
      verifiedAt: now.toISOString(),
    };
  }

  // Check token expiration
  if (tokenRecord.expiresAt < now) {
    return {
      valid: false,
      status: "TOKEN_EXPIRED",
      message: "This QR verification code has expired. Please refresh your pass in the app.",
      touristCode: tokenRecord.tourist.touristCode,
      fullName: tokenRecord.tourist.fullName,
      expiresAt: tokenRecord.expiresAt.toISOString(),
      verifiedAt: now.toISOString(),
    };
  }

  // Check tourist visit expiry
  if (tokenRecord.tourist.visitExpiry && tokenRecord.tourist.visitExpiry < now) {
    return {
      valid: false,
      status: "VISIT_EXPIRED",
      message: "Tourist official visit duration has expired.",
      touristCode: tokenRecord.tourist.touristCode,
      fullName: tokenRecord.tourist.fullName,
      visitExpiry: tokenRecord.tourist.visitExpiry.toISOString(),
      verifiedAt: now.toISOString(),
    };
  }

  // Record valid verification in audit ledger
  await appendAuditEvent({
    eventType: "QR_VERIFIED_SUCCESS",
    entityType: "Tourist",
    entityId: tokenRecord.tourist.id,
    payload: {
      touristCode: tokenRecord.tourist.touristCode,
      fullName: tokenRecord.tourist.fullName,
      tokenId: tokenRecord.id,
    },
  });

  return {
    valid: true,
    status: "VALID",
    message: "Tourist digital identity verified successfully.",
    touristCode: tokenRecord.tourist.touristCode,
    fullName: tokenRecord.tourist.fullName,
    visitExpiry: tokenRecord.tourist.visitExpiry.toISOString(),
    registeredDate: tokenRecord.tourist.createdAt.toISOString(),
    verifiedAt: now.toISOString(),
    issuer: "Smart Tourist Safety & Incident Response System",
  };
}

/**
 * Revokes a token by ID.
 */
export async function revokeToken(tokenId) {
  const updated = await prisma.verificationToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });

  await appendAuditEvent({
    eventType: "QR_TOKEN_REVOKED",
    entityType: "VerificationToken",
    entityId: tokenId,
    payload: {
      revokedAt: updated.revokedAt.toISOString(),
      touristId: updated.touristId,
    },
  });

  return updated;
}
