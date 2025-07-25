import { getCurrentUser, isSuperUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import TenantTable from "./tenant-table";
import TenantActions from "./tenant-actions";

export default async function TenantsAdminPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get buildings where user is admin
  const adminBuildings = user.buildingRoles
    .filter((role) => role.role === Role.BUILDING_ADMIN || role.role === Role.ASSOCIATION_ADMIN)
    .map((role) => role.buildingId);
  
  if (adminBuildings.length === 0) {
    redirect("/dashboard");
  }
  
  // Get all tenants in admin's buildings
  const tenants = await prisma.user.findMany({
    where: {
      buildingRoles: {
        some: {
          buildingId: {
            in: adminBuildings,
          },
          role: Role.TENANT,
        },
      },
    },
    include: {
      buildingRoles: {
        where: {
          buildingId: {
            in: adminBuildings,
          },
        },
        include: {
          building: true,
        },
      },
      tenancies: {
        where: {
          isCurrent: true,
          unit: {
            buildingId: {
              in: adminBuildings,
            },
          },
        },
        include: {
          unit: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  
  const isSuper = await isSuperUser(user.email);
  
  // Get all buildings for the create form
  const buildings = isSuper ? await prisma.building.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  }) : [];
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Member Directory</h1>
          <p className="text-muted-foreground">View and manage association members</p>
        </div>
        {isSuper && (
          <TenantActions buildings={buildings} />
        )}
      </div>
      <TenantTable tenants={tenants} isSuperUser={isSuper} />
    </div>
  );
}