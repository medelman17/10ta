import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      buildingRoles: {
        include: {
          building: true,
        },
      },
      tenancies: {
        where: { isCurrent: true },
        include: {
          unit: {
            include: {
              building: true,
            },
          },
        },
      },
    },
  });

  // If user doesn't exist in database, create them from Clerk data
  if (!user) {
    const clerkUser = await clerkCurrentUser();
    if (clerkUser) {
      try {
        user = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
          },
          include: {
            buildingRoles: {
              include: {
                building: true,
              },
            },
            tenancies: {
              where: { isCurrent: true },
              include: {
                unit: {
                  include: {
                    building: true,
                  },
                },
              },
            },
          },
        });
      } catch (error) {
        console.error('Failed to create user from Clerk data:', error);
        return null;
      }
    }
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  return user;
}

export async function requireRole(buildingId: string, requiredRole: Role) {
  const user = await requireAuth();
  
  const buildingRole = user.buildingRoles.find(
    (br) => br.buildingId === buildingId
  );
  
  if (!buildingRole) {
    throw new Error("No access to this building");
  }
  
  // Check role hierarchy
  const roleHierarchy = {
    [Role.TENANT]: 0,
    [Role.ASSOCIATION_ADMIN]: 1,
    [Role.BUILDING_ADMIN]: 2,
  };
  
  if (roleHierarchy[buildingRole.role] < roleHierarchy[requiredRole]) {
    throw new Error("Insufficient permissions");
  }
  
  return user;
}

export async function getUserBuildings(userId: string) {
  const buildingRoles = await prisma.buildingRole.findMany({
    where: { userId },
    include: {
      building: true,
    },
  });
  
  return buildingRoles.map((br) => ({
    building: br.building,
    role: br.role,
  }));
}

export async function checkUserNeedsOnboarding() {
  const user = await getCurrentUser();
  
  if (!user) {
    return true;
  }
  
  // User needs onboarding if they have no building roles
  return user.buildingRoles.length === 0;
}