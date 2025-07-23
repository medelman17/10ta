import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/auth-helpers";
import { PERMISSIONS } from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminList from "./admin-list";
import PermissionAuditLog from "./audit-log";
import RoleTemplates from "./role-templates";

export default async function AccessControlPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  // For now, we'll use the first building the user has admin access to
  // In a real app, you'd have a building selector
  const adminBuilding = user.buildingRoles.find(
    (role) => role.role === "BUILDING_ADMIN"
  );

  if (!adminBuilding) {
    redirect("/dashboard");
  }

  const buildingId = adminBuilding.buildingId;

  // Check if user has permission to manage permissions
  const canManagePermissions = await hasPermission(
    user.id,
    buildingId,
    PERMISSIONS.MANAGE_PERMISSIONS
  );

  if (!canManagePermissions) {
    redirect("/dashboard");
  }

  // Fetch building info
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!building) {
    redirect("/dashboard");
  }

  // Fetch all users with any role or permission in this building
  const admins = await prisma.user.findMany({
    where: {
      OR: [
        {
          buildingRoles: {
            some: {
              buildingId: building.id,
            },
          },
        },
        {
          permissions: {
            some: {
              buildingId: building.id,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
          },
        },
      ],
    },
    include: {
      buildingRoles: {
        where: { buildingId: building.id },
      },
      permissions: {
        where: {
          buildingId: building.id,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      },
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Access Control</h1>
        <p className="text-muted-foreground mt-2">
          Manage administrative permissions for {building.name}
        </p>
      </div>

      <Tabs defaultValue="admins" className="space-y-6">
        <TabsList>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
          <TabsTrigger value="templates">Role Templates</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="space-y-6">
          <AdminList 
            admins={admins}
            buildingId={building.id}
            currentUserId={user.id}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <RoleTemplates buildingId={building.id} />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <PermissionAuditLog buildingId={building.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}