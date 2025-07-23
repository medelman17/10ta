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
    
    // Update request status
    const updatedRequest = await prisma.unitRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        adminNotes,
        processedBy: user.id,
        processedAt: new Date(),
      },
    });
    
    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error rejecting unit request:", error);
    return createErrorResponse(500, 'Internal server error');
  }
});