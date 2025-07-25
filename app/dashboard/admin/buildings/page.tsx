import { getCurrentUser, isSuperUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, Home, AlertTriangle } from "lucide-react";
import BuildingActions from "./building-actions";

export default async function BuildingsListPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  const isSuper = await isSuperUser(user.email);
  
  if (!isSuper) {
    redirect("/dashboard/admin");
  }
  
  // Get all buildings with stats
  const buildings = await prisma.building.findMany({
    include: {
      _count: {
        select: {
          units: true,
          issues: {
            where: {
              status: {
                in: ["OPEN", "IN_PROGRESS", "AWAITING_LANDLORD"]
              }
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
  
  // Get tenant counts separately (can't count through relations)
  const buildingsWithStats = await Promise.all(
    buildings.map(async (building) => {
      const tenantCount = await prisma.tenancy.count({
        where: {
          unit: {
            buildingId: building.id
          },
          isCurrent: true
        }
      });
      
      return {
        ...building,
        tenantCount
      };
    })
  );
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Building Management</h1>
          <p className="text-muted-foreground">Manage all buildings in the platform</p>
        </div>
        <BuildingActions />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {buildingsWithStats.map((building) => (
          <div key={building.id} className="relative rounded-lg border p-6 hover:bg-accent/50 transition-colors">
            <Link href={`/dashboard/admin/buildings/${building.id}`} className="absolute inset-0" />
            
            <div className="relative pointer-events-none">
              <div className="flex items-center gap-4 mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{building.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {building.address}, {building.city}, {building.state} {building.zipCode}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">{building.tenantCount}</p>
                    <p className="text-xs text-muted-foreground">Tenants</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">{building._count.units}</p>
                    <p className="text-xs text-muted-foreground">Units</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">{building._count.issues}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {building.floors} floors × {building.unitsPerFloor} units/floor
              </div>
            </div>
            
            <div className="absolute top-4 right-4 pointer-events-auto z-10">
              <BuildingActions buildingId={building.id} buildingName={building.name} />
            </div>
          </div>
        ))}
      </div>
      
      {buildingsWithStats.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No buildings yet</h3>
          <p className="text-muted-foreground mb-4">Create your first building to get started</p>
          <BuildingActions />
        </div>
      )}
    </div>
  );
}