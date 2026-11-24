import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { appendAuditEvent } from "./auditLedger.service.js";

export async function registerTourist(data) {
  const touristCode = `TST-${randomUUID().slice(0, 8).toUpperCase()}`;

  const tourist = await prisma.tourist.create({
    data: {
      touristCode,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      emergencyContactName: data.emergencyContactName.trim(),
      emergencyContactPhone: data.emergencyContactPhone.trim(),
      itinerary: data.itinerary?.trim() || null,
      visitExpiry: new Date(data.visitExpiry),
    },
  });

  // Append to tamper-evident audit ledger
  try {
    await appendAuditEvent({
      eventType: "TOURIST_REGISTRATION",
      entityType: "Tourist",
      entityId: tourist.id,
      payload: {
        touristCode: tourist.touristCode,
        fullName: tourist.fullName,
        visitExpiry: tourist.visitExpiry.toISOString(),
      },
    });
  } catch (err) {
    console.error("Audit ledger logging error on registration:", err.message);
  }

  return tourist;
}

export async function getTouristById(id) {
  return prisma.tourist.findUnique({
    where: { id },
  });
}

export async function getAllTourists() {
  return prisma.tourist.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}
