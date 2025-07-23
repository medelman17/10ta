import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';

export const POST = withAuth(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }
    
    const { adminNotes } = await req.json();
    const { id } = await params;
    
    // Get the unit request
    const unitRequest = await prisma.unitRequest.findUnique({
      where: { id },
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
    
    // Check if user has permission to manage unit requests
    const canManageRequests = await hasPermission(
      user.id,
      unitRequest.buildingId,
      PERMISSIONS.MANAGE_UNIT_REQUESTS
    );
    
    if (!canManageRequests) {
      return createErrorResponse(403, 'You do not have permission to manage unit requests');
    }
    
    // Start transaction to approve request and create tenancy
    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.unitRequest.update({
        where: { id },
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
    return createErrorResponse(
      500,
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
});