import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if user already has a building assignment
    if (user.buildingRoles.length > 0) {
      return new NextResponse("User already onboarded", { status: 400 });
    }
    
    const { buildingId, floor, line } = await req.json();
    
    if (!buildingId || !floor || !line) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Check if building exists
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });
    
    if (!building) {
      return new NextResponse("Building not found", { status: 404 });
    }
    
    // Check if unit is valid for the building
    if (floor < 1 || floor > building.floors) {
      return new NextResponse("Invalid floor", { status: 400 });
    }
    
    const lineIndex = line.charCodeAt(0) - 65; // Convert A->0, B->1, etc.
    if (lineIndex < 0 || lineIndex >= building.unitsPerFloor) {
      return new NextResponse("Invalid unit line", { status: 400 });
    }
    
    const unitNumber = `${floor}${line}`;
    
    // Start a transaction to create/find unit and assign user
    const result = await prisma.$transaction(async (tx) => {
      // Find or create the unit
      let unit = await tx.unit.findUnique({
        where: {
          buildingId_unitNumber: {
            buildingId,
            unitNumber,
          },
        },
      });
      
      if (!unit) {
        unit = await tx.unit.create({
          data: {
            buildingId,
            floor,
            line,
            unitNumber,
          },
        });
      }
      
      // Create building role (start as TENANT)
      const buildingRole = await tx.buildingRole.create({
        data: {
          userId: user.id,
          buildingId,
          role: Role.TENANT,
        },
      });
      
      // Create tenancy record
      const tenancy = await tx.tenancy.create({
        data: {
          userId: user.id,
          unitId: unit.id,
          startDate: new Date(),
          isCurrent: true,
        },
      });
      
      return { unit, buildingRole, tenancy };
    });
    
    return NextResponse.json({ success: true, unit: result.unit });
  } catch (error) {
    console.error("Onboarding error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}