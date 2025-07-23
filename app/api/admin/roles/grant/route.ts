import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/auth-helpers";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userId, buildingId, role } = body;

    // Check if current user has permission to manage admins
    const canManageAdmins = await hasPermission(
      user.id,
      buildingId,
      PERMISSIONS.MANAGE_ADMINS
    );

    if (!canManageAdmins) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if user already has any role in this building
    const existingRole = await prisma.buildingRole.findFirst({
      where: {
        userId,
        buildingId,
      },
    });

    if (existingRole) {
      // Update existing role
      await prisma.buildingRole.update({
        where: {
          id: existingRole.id,
        },
        data: {
          role,
        },
      });
    } else {
      // Create new role
      await prisma.buildingRole.create({
        data: {
          userId,
          buildingId,
          role,
        },
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "GRANT_ROLE",
        entityType: "BuildingRole",
        entityId: `${userId}-${buildingId}`,
        metadata: {
          targetUserId: userId,
          buildingId,
          role,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error granting role:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}