import { prisma } from "../config/prisma.js";

export async function createSosIncident({ touristId, latitude, longitude, description }) {
  const tourist = await prisma.tourist.findUnique({
    where: { id: touristId },
  });

  if (!tourist) {
    throw new Error(`Tourist with ID ${touristId} not found`);
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (Number.isNaN(lat) || lat < -90 || lat > 90 || Number.isNaN(lon) || lon < -180 || lon > 180) {
    throw new Error("Invalid GPS coordinates for SOS incident");
  }

  const incident = await prisma.incident.create({
    data: {
      touristId,
      type: "SOS",
      status: "OPEN",
      severity: "CRITICAL",
      description: description?.trim() || "Emergency SOS activated by tourist. Immediate response requested (Simulated Demo Incident).",
      latitude: lat,
      longitude: lon,
    },
    include: {
      tourist: {
        select: {
          id: true,
          touristCode: true,
          fullName: true,
          phone: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
        },
      },
    },
  });

  // Also log an AnomalyAlert so the safety score & alert history immediately register the SOS event
  await prisma.anomalyAlert.create({
    data: {
      touristId,
      type: "SOS_ACTIVATION",
      severity: "CRITICAL",
      description: `SOS Emergency triggered at coordinates [${lat.toFixed(5)}, ${lon.toFixed(5)}]. Incident Ref: INC-${incident.id.slice(-6).toUpperCase()}`,
      latitude: lat,
      longitude: lon,
      status: "ACTIVE",
    },
  });

  return {
    ...incident,
    referenceCode: `INC-${incident.id.slice(-6).toUpperCase()}`,
  };
}

export async function getAllIncidents(filters = {}) {
  const where = {};
  if (filters.touristId) where.touristId = filters.touristId;
  if (filters.status) where.status = filters.status.toUpperCase();
  if (filters.type) where.type = filters.type.toUpperCase();
  if (filters.severity) where.severity = filters.severity.toUpperCase();

  const incidents = await prisma.incident.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tourist: {
        select: {
          id: true,
          touristCode: true,
          fullName: true,
          phone: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
        },
      },
    },
  });

  return incidents.map((inc) => ({
    ...inc,
    referenceCode: `INC-${inc.id.slice(-6).toUpperCase()}`,
  }));
}

export async function getIncidentById(id) {
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      tourist: {
        select: {
          id: true,
          touristCode: true,
          fullName: true,
          phone: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
        },
      },
    },
  });

  if (!incident) return null;

  return {
    ...incident,
    referenceCode: `INC-${incident.id.slice(-6).toUpperCase()}`,
  };
}

export async function getIncidentsByTouristId(touristId) {
  return getAllIncidents({ touristId });
}

export async function updateIncidentStatus(id, status) {
  const validStatuses = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "CANCELLED"];
  const upperStatus = status.toUpperCase().trim();

  if (!validStatuses.includes(upperStatus)) {
    throw new Error(`Invalid incident status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const updated = await prisma.incident.update({
    where: { id },
    data: { status: upperStatus },
  });

  return {
    ...updated,
    referenceCode: `INC-${updated.id.slice(-6).toUpperCase()}`,
  };
}
