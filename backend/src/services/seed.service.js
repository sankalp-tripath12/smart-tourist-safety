import { prisma } from "../config/prisma.js";

export const DEMO_SAFETY_ZONES = [
  {
    name: "Amer Fort Heritage Area (Demo Safe Zone)",
    latitude: 26.9855,
    longitude: 75.8513,
    radius: 600, // 600 meters
    riskLevel: "SAFE",
    description: "Verified tourist heritage monument area with active tourist police presence and visitor assistance kiosks. (Demo Safe Zone)",
  },
  {
    name: "Hawa Mahal Cultural Plaza (Demo Safe Zone)",
    latitude: 26.9239,
    longitude: 75.8267,
    radius: 400,
    riskLevel: "SAFE",
    description: "Pedestrian tourist square with high tourist density, CCTV coverage, and designated information desks. (Demo Safe Zone)",
  },
  {
    name: "Old Bazaar Narrow Lanes (Demo Caution Zone)",
    latitude: 26.9280,
    longitude: 75.8320,
    radius: 350,
    riskLevel: "CAUTION",
    description: "High-density market area with narrow pedestrian alleys. High crowding; keep belongings secure. (Demo Caution Zone)",
  },
  {
    name: "Aravalli Ridge Restricted Cliffs (Demo Danger Zone)",
    latitude: 26.9950,
    longitude: 75.8600,
    radius: 500,
    riskLevel: "DANGER",
    description: "Unlit steep rocky terrain outside permitted trail hours. High risk of falls and wild animal encounters. (Demo Danger Zone)",
  },
  {
    name: "Isolated Riverbank Embankment (Demo Danger Zone)",
    latitude: 26.9400,
    longitude: 75.8800,
    radius: 450,
    riskLevel: "DANGER",
    description: "Seasonal flash floodway with restricted access. No lighting or security guard presence. (Demo Danger Zone)",
  },
];

export async function seedDefaultSafetyZones() {
  const existingCount = await prisma.safetyZone.count();
  if (existingCount === 0) {
    console.log("Seeding demo safety zones...");
    for (const zone of DEMO_SAFETY_ZONES) {
      await prisma.safetyZone.create({ data: zone });
    }
    console.log(`Seeded ${DEMO_SAFETY_ZONES.length} demo safety zones.`);
  }
}
