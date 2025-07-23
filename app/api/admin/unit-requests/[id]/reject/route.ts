import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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
    
    // Check if admin has access to this building
    const hasAccess = user.buildingRoles.some(
      (role) => role.buildingId === unitRequest.buildingId
    );
    
    if (!hasAccess) {
      return new NextResponse("No access to this building", { status: 403 });
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
    return new NextResponse("Internal server error", { status: 500 });
  }
}