import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";

export async function registerTourist(data) {
  const touristCode = `TST-${randomUUID().slice(0, 8).toUpperCase()}`;

  return prisma.tourist.create({
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
