import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnitGrid from "./unit-grid";
import PendingRequests from "./pending-requests";
import { Building2 } from "lucide-react";

export default async function UnitsManagementPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  // Check if user is admin
  const isAdmin = user.buildingRoles.some(
    (role) => role.role === Role.BUILDING_ADMIN || role.role === Role.ASSOCIATION_ADMIN
  );
  
  if (!isAdmin) {
    redirect("/dashboard");
  }
  
  // Get buildings where user is admin
  const adminBuildings = user.buildingRoles.filter(
    (role) => role.role === Role.BUILDING_ADMIN || role.role === Role.ASSOCIATION_ADMIN
  );
  
  // For now, we'll work with the first building
  // TODO: Add building selector if admin manages multiple buildings
  const currentBuilding = adminBuildings[0]?.building;
  
  if (!currentBuilding) {
    redirect("/dashboard");
  }
  
  // Get all units with their current tenants
  const units = await prisma.unit.findMany({
    where: {
      buildingId: currentBuilding.id,
    },
    include: {
      tenancies: {
        where: {
          isCurrent: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      },
      _count: {
        select: {
          issues: {
            where: {
              status: {
                in: ["OPEN", "IN_PROGRESS", "AWAITING_LANDLORD"],
              },
            },
          },
        },
      },
    },
    orderBy: [
      { floor: 'desc' },
      { line: 'asc' },
    ],
  });
  
  // Get pending unit requests
  const pendingRequestsData = await prisma.unitRequest.findMany({
    where: {
      buildingId: currentBuilding.id,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      requestedUnit: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  // Convert dates to strings for client component
  const pendingRequests = pendingRequestsData.map(req => ({
    ...req,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
    processedAt: req.processedAt?.toISOString() || null,
    requestedUnit: req.requestedUnit ? {
      ...req.requestedUnit,
      createdAt: req.requestedUnit.createdAt.toISOString(),
      updatedAt: req.requestedUnit.updatedAt.toISOString(),
    } : null,
  }));
  
  return (
    <div className="container mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Unit Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage units and tenant assignments for {currentBuilding.name}
        </p>
      </div>
      
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Unit Grid</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          <UnitGrid units={units} buildingId={currentBuilding.id} />
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          <PendingRequests requests={pendingRequests} />
        </TabsContent>
      </Tabs>
    </div>
  );
}