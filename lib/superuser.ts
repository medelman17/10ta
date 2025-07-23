import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

const SUPERUSER_EMAILS = ['mike.edelman@gmail.com'];

export async function grantSuperuserAccess(userId: string, email: string) {
  if (!SUPERUSER_EMAILS.includes(email.toLowerCase())) {
    return false;
  }
  
  // Get all buildings
  const buildings = await prisma.building.findMany();
  
  // Grant BUILDING_ADMIN role for each building
  for (const building of buildings) {
    await prisma.buildingRole.upsert({
      where: {
        userId_buildingId_role: {
          userId,
          buildingId: building.id,
          role: Role.BUILDING_ADMIN,
        },
      },
      update: {},
      create: {
        userId,
        buildingId: building.id,
        role: Role.BUILDING_ADMIN,
      },
    });
  }
  
  console.log(`Superuser access granted to ${email}`);
  return true;
}

export async function grantSuperuserAccessToNewBuilding(buildingId: string) {
  // Find all superusers
  const superusers = await prisma.user.findMany({
    where: {
      email: {
        in: SUPERUSER_EMAILS.map(email => email.toLowerCase()),
      },
    },
  });
  
  // Grant access to the new building for each superuser
  for (const user of superusers) {
    await prisma.buildingRole.upsert({
      where: {
        userId_buildingId_role: {
          userId: user.id,
          buildingId,
          role: Role.BUILDING_ADMIN,
        },
      },
      update: {},
      create: {
        userId: user.id,
        buildingId,
        role: Role.BUILDING_ADMIN,
      },
    });
  }
  
  console.log(`Superuser access granted to new building ${buildingId} for ${superusers.length} superusers`);
}

export function isSuperuserEmail(email: string): boolean {
  return SUPERUSER_EMAILS.includes(email.toLowerCase());
}