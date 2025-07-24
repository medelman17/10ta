import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, Home, Key } from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Get buildings where user is admin
  const adminBuildings = user.buildingRoles.filter(
    (role) => role.role === Role.BUILDING_ADMIN || role.role === Role.ASSOCIATION_ADMIN
  );
  
  if (adminBuildings.length === 0) {
    redirect("/dashboard");
  }
  
  // Get stats for each building
  const buildingStats = await Promise.all(
    adminBuildings.map(async (buildingRole) => {
      const [tenantCount, unitCount, activeIssues] = await Promise.all([
        prisma.buildingRole.count({
          where: {
            buildingId: buildingRole.buildingId,
            role: Role.TENANT,
          },
        }),
        prisma.unit.count({
          where: {
            buildingId: buildingRole.buildingId,
          },
        }),
        prisma.issue.count({
          where: {
            buildingId: buildingRole.buildingId,
            status: {
              in: ["OPEN", "IN_PROGRESS", "AWAITING_LANDLORD"],
            },
          },
        }),
      ]);
      
      return {
        building: buildingRole.building,
        role: buildingRole.role,
        tenantCount,
        unitCount,
        activeIssues,
      };
    })
  );
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {buildingStats.map((stat) => (
          <div key={stat.building.id} className="rounded-lg border p-6">
            <div className="flex items-center gap-4 mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{stat.building.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {stat.role === Role.BUILDING_ADMIN ? "Building Organizer" : "Association Leader"}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold">{stat.tenantCount}</p>
                <p className="text-xs text-muted-foreground">Tenants</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.unitCount}</p>
                <p className="text-xs text-muted-foreground">Units</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.activeIssues}</p>
                <p className="text-xs text-muted-foreground">Active Issues</p>
              </div>
            </div>
            
            <Link 
              href={`/dashboard/admin/buildings/${stat.building.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              View Building Dashboard →
            </Link>
          </div>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/admin/tenants"
          className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
        >
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Member Directory</h3>
            <p className="text-sm text-muted-foreground">View association members</p>
          </div>
        </Link>
        
        <Link
          href="/dashboard/admin/units"
          className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
        >
          <Home className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Building Overview</h3>
            <p className="text-sm text-muted-foreground">View units and occupancy</p>
          </div>
        </Link>
        
        <Link
          href="/dashboard/admin/access"
          className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
        >
          <Key className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Leadership Roles</h3>
            <p className="text-sm text-muted-foreground">Manage association leaders</p>
          </div>
        </Link>
      </div>
    </div>
  );
}