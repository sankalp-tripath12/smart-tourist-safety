import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Produces a deterministic canonical string representation of an object.
 */
export function canonicalize(obj) {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => canonicalize(item)).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((key) => JSON.stringify(key) + ":" + canonicalize(obj[key]));
  return "{" + pairs.join(",") + "}";
}

/**
 * Calculates SHA-256 hash from canonical components of an audit ledger record.
 */
export function calculateRecordHash({
  id,
  eventType,
  entityType,
  entityId,
  payload,
  timestamp,
  previousHash,
}) {
  const tsString = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const canonicalPayload = typeof payload === "string" ? payload : canonicalize(payload);

  const hashInput = [
    id,
    eventType,
    entityType,
    entityId,
    canonicalPayload,
    tsString,
    previousHash,
  ].join("|");

  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

let writeLock = Promise.resolve();

/**
 * Appends a tamper-evident audit record to the hash-chained ledger.
 * Serialized to prevent concurrent race conditions on previousHash.
 */
export async function appendAuditEvent({
  eventType,
  entityType,
  entityId,
  payload = {},
}) {
  const executeAppend = async () => {
    // 1. Get the latest record to obtain previousHash
    const lastRecord = await prisma.auditLedger.findFirst({
      orderBy: { timestamp: "desc" },
    });

    const previousHash = lastRecord ? lastRecord.currentHash : GENESIS_HASH;
    const id = "aud_" + crypto.randomBytes(12).toString("hex");
    const timestamp = new Date();
    const serializedPayload = typeof payload === "string" ? payload : canonicalize(payload);

    // 2. Compute current record hash
    const currentHash = calculateRecordHash({
      id,
      eventType,
      entityType,
      entityId: String(entityId),
      payload: serializedPayload,
      timestamp,
      previousHash,
    });

    // 3. Persist record in SQLite
    return prisma.auditLedger.create({
      data: {
        id,
        eventType,
        entityType,
        entityId: String(entityId),
        payload: serializedPayload,
        timestamp,
        previousHash,
        currentHash,
      },
    });
  };

  // Queue behind write lock
  writeLock = writeLock.then(executeAppend, executeAppend);
  return writeLock;
}

/**
 * Verifies the integrity of the entire audit chain.
 * Re-computes hashes and verifies previousHash links.
 */
export async function verifyAuditChain() {
  const records = await prisma.auditLedger.findMany({
    orderBy: { timestamp: "asc" },
  });

  if (records.length === 0) {
    return {
      valid: true,
      totalRecords: 0,
      verifiedRecords: 0,
      firstInvalidRecord: null,
      message: "Audit ledger is empty. Chain is clean.",
    };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Check 1: Linkage with previous record hash
    if (record.previousHash !== expectedPrevHash) {
      return {
        valid: false,
        totalRecords: records.length,
        verifiedRecords: i,
        firstInvalidRecord: {
          id: record.id,
          index: i,
          eventType: record.eventType,
          reason: `Broken chain link: expected previousHash '${expectedPrevHash}', but found '${record.previousHash}'`,
        },
        message: `Tampering detected at record #${i + 1} (${record.id}): broken previousHash link.`,
      };
    }

    // Check 2: Re-calculate hash from components
    const recalculatedHash = calculateRecordHash({
      id: record.id,
      eventType: record.eventType,
      entityType: record.entityType,
      entityId: record.entityId,
      payload: record.payload,
      timestamp: record.timestamp,
      previousHash: record.previousHash,
    });

    if (recalculatedHash !== record.currentHash) {
      return {
        valid: false,
        totalRecords: records.length,
        verifiedRecords: i,
        firstInvalidRecord: {
          id: record.id,
          index: i,
          eventType: record.eventType,
          reason: `Content hash mismatch: stored '${record.currentHash}', recomputed '${recalculatedHash}'`,
        },
        message: `Tampering detected at record #${i + 1} (${record.id}): payload or record fields modified.`,
      };
    }

    expectedPrevHash = record.currentHash;
  }

  return {
    valid: true,
    totalRecords: records.length,
    verifiedRecords: records.length,
    firstInvalidRecord: null,
    message: `All ${records.length} audit records cryptographically verified. Chain is intact.`,
  };
}

export async function getAuditRecords({ limit = 50, offset = 0, eventType = null } = {}) {
  const where = {};
  if (eventType) where.eventType = eventType;

  const [total, records] = await Promise.all([
    prisma.auditLedger.count({ where }),
    prisma.auditLedger.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Math.min(Number(limit) || 50, 200),
      skip: Number(offset) || 0,
    }),
  ]);

  return { total, records };
}

export async function getAuditRecordById(id) {
  return prisma.auditLedger.findUnique({
    where: { id },
  });
}
