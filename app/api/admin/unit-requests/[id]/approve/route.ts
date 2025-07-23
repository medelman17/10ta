import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check if user is admin
    const isAdmin = user.buildingRoles.some(
      (role) => role.role === Role.BUILDING_ADMIN || role.role === Role.ASSOCIATION_ADMIN
    );
    
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const { adminNotes } = await req.json();
    
    // Get the unit request
    const unitRequest = await prisma.unitRequest.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        requestedUnit: true,
        building: true,
      },
    });
    
    if (!unitRequest) {
      return new NextResponse("Request not found", { status: 404 });
    }
    
    if (unitRequest.status !== "PENDING") {
      return new NextResponse("Request already processed", { status: 400 });
    }
    
    // Check if admin has access to this building
    const hasAccess = user.buildingRoles.some(
      (role) => role.buildingId === unitRequest.buildingId
    );
    
    if (!hasAccess) {
      return new NextResponse("No access to this building", { status: 403 });
    }
    
    // Start transaction to approve request and create tenancy
    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.unitRequest.update({
        where: { id: params.id },
        data: {
          status: "APPROVED",
          adminNotes,
          processedBy: user.id,
          processedAt: new Date(),
        },
      });
      
      // If a specific unit was requested, assign it
      if (unitRequest.unitId) {
        // Check if unit is available
        const existingTenancy = await tx.tenancy.findFirst({
          where: {
            unitId: unitRequest.unitId,
            isCurrent: true,
          },
        });
        
        if (existingTenancy) {
          throw new Error("Unit is already occupied");
        }
        
        // Create tenancy
        await tx.tenancy.create({
          data: {
            userId: unitRequest.userId,
            unitId: unitRequest.unitId,
            startDate: new Date(),
            isCurrent: true,
          },
        });
      }
      
      // Ensure user has tenant role for this building
      const existingRole = await tx.buildingRole.findFirst({
        where: {
          userId: unitRequest.userId,
          buildingId: unitRequest.buildingId,
          role: Role.TENANT,
        },
      });
      
      if (!existingRole) {
        await tx.buildingRole.create({
          data: {
            userId: unitRequest.userId,
            buildingId: unitRequest.buildingId,
            role: Role.TENANT,
          },
        });
      }
      
      return updatedRequest;
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error approving unit request:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal server error", 
      { status: 500 }
    );
  }
}