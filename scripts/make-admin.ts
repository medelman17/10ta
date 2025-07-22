#!/usr/bin/env tsx

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
      include: { buildingRoles: true },
    });
    
    if (!user) {
      console.error("User not found with email:", email);
      process.exit(1);
    }
    
    // Get the first building (assuming single building for now)
    const building = await prisma.building.findFirst();
    
    if (!building) {
      console.error("No building found in database");
      process.exit(1);
    }
    
    // Check if user already has a role in this building
    const existingRole = user.buildingRoles.find(
      (role) => role.buildingId === building.id
    );
    
    if (existingRole) {
      // Update existing role to BUILDING_ADMIN
      await prisma.buildingRole.update({
        where: { id: existingRole.id },
        data: { role: Role.BUILDING_ADMIN },
      });
      console.log(`Updated ${email} to BUILDING_ADMIN for ${building.name}`);
    } else {
      // Create new building admin role
      await prisma.buildingRole.create({
        data: {
          userId: user.id,
          buildingId: building.id,
          role: Role.BUILDING_ADMIN,
        },
      });
      console.log(`Made ${email} a BUILDING_ADMIN for ${building.name}`);
    }
    
    console.log("✅ Admin privileges granted successfully!");
  } catch (error) {
    console.error("Error making admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error("Usage: pnpm tsx scripts/make-admin.ts <email>");
  process.exit(1);
}

makeAdmin(email);