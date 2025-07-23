import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, grantPermissions } from "@/lib/auth-helpers";
import { PERMISSIONS, Permission } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userId, buildingId, permissions, expiresAt } = body;

    // Check if current user has permission to manage permissions
    const canManagePermissions = await hasPermission(
      user.id,
      buildingId,
      PERMISSIONS.MANAGE_PERMISSIONS
    );

    if (!canManagePermissions) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Validate permissions
    const validPermissions = permissions.filter((p: string) => 
      Object.values(PERMISSIONS).includes(p as Permission)
    );

    if (validPermissions.length === 0) {
      return new NextResponse("No valid permissions provided", { status: 400 });
    }

    // Grant the permissions
    await grantPermissions(
      userId,
      buildingId,
      validPermissions,
      user.id,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error granting permissions:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}