import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission, revokePermission } from "@/lib/auth-helpers";
import { PERMISSIONS, Permission } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userId, buildingId, permissions } = body;

    // Check if current user has permission to manage permissions
    const canManagePermissions = await hasPermission(
      user.id,
      buildingId,
      PERMISSIONS.MANAGE_PERMISSIONS
    );

    if (!canManagePermissions) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Revoke each permission
    for (const permission of permissions) {
      if (Object.values(PERMISSIONS).includes(permission as Permission)) {
        await revokePermission(
          userId,
          buildingId,
          permission as Permission,
          user.id,
          "Permission removed via admin interface"
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking permissions:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}