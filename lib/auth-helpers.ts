import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSIONS, Permission } from '@/lib/permissions';
import { cache } from 'react';

// Cache permission checks during a single request
export const hasPermission = cache(async (
  userId: string,
  buildingId: string,
  permission: Permission
): Promise<boolean> => {
  // First check if user is a superuser
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });
  
  if (user) {
    const superUserEmails = process.env.NEXT_PUBLIC_SUPER_USER_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
    if (superUserEmails.includes(user.email.toLowerCase())) {
      // Superusers have all permissions
      return true;
    }
  }
  
  // Otherwise, check regular permissions
  const permissionRecord = await prisma.adminPermission.findUnique({
    where: {
      userId_buildingId_permission: {
        userId,
        buildingId,
        permission,
      },
    },
  });

  if (!permissionRecord) {
    return false;
  }

  // Check if permission has expired
  if (permissionRecord.expiresAt && permissionRecord.expiresAt < new Date()) {
    return false;
  }

  return true;
});

// Check multiple permissions (returns true if user has ANY of them)
export const hasAnyPermission = cache(async (
  userId: string,
  buildingId: string,
  permissions: Permission[]
): Promise<boolean> => {
  const results = await Promise.all(
    permissions.map(permission => hasPermission(userId, buildingId, permission))
  );
  return results.some(result => result === true);
});

// Check multiple permissions (returns true only if user has ALL of them)
export const hasAllPermissions = cache(async (
  userId: string,
  buildingId: string,
  permissions: Permission[]
): Promise<boolean> => {
  const results = await Promise.all(
    permissions.map(permission => hasPermission(userId, buildingId, permission))
  );
  return results.every(result => result === true);
});

// Get all permissions for a user in a building
export const getUserPermissions = cache(async (
  userId: string,
  buildingId: string
): Promise<Permission[]> => {
  // First check if user is a superuser
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });
  
  if (user) {
    const superUserEmails = process.env.NEXT_PUBLIC_SUPER_USER_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
    if (superUserEmails.includes(user.email.toLowerCase())) {
      // Superusers get all permissions
      return Object.values(PERMISSIONS) as Permission[];
    }
  }
  
  // Otherwise, check regular permissions
  const permissions = await prisma.adminPermission.findMany({
    where: {
      userId,
      buildingId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: {
      permission: true,
    },
  });

  return permissions.map(p => p.permission as Permission);
});

// Check if user is a building admin (has BUILDING_ADMIN role)
export const isBuildingAdmin = cache(async (
  userId: string,
  buildingId: string
): Promise<boolean> => {
  const role = await prisma.buildingRole.findFirst({
    where: {
      userId,
      buildingId,
      role: 'BUILDING_ADMIN',
    },
  });

  return !!role;
});

// Get current user's permissions for a building
export async function getCurrentUserPermissions(buildingId: string): Promise<Permission[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  
  return getUserPermissions(user.id, buildingId);
}

// Grant a permission to a user
export async function grantPermission(
  userId: string,
  buildingId: string,
  permission: Permission,
  grantedBy: string,
  expiresAt?: Date
): Promise<void> {
  // Create the permission
  await prisma.adminPermission.create({
    data: {
      userId,
      buildingId,
      permission,
      grantedBy,
      expiresAt,
    },
  });

  // Log the action
  await prisma.permissionAuditLog.create({
    data: {
      userId,
      buildingId,
      permission,
      action: 'granted',
      performedBy: grantedBy,
    },
  });
}

// Revoke a permission from a user
export async function revokePermission(
  userId: string,
  buildingId: string,
  permission: Permission,
  revokedBy: string,
  reason?: string
): Promise<void> {
  // Delete the permission
  await prisma.adminPermission.delete({
    where: {
      userId_buildingId_permission: {
        userId,
        buildingId,
        permission,
      },
    },
  });

  // Log the action
  await prisma.permissionAuditLog.create({
    data: {
      userId,
      buildingId,
      permission,
      action: 'revoked',
      performedBy: revokedBy,
      reason,
    },
  });
}

// Grant multiple permissions at once (useful for role templates)
export async function grantPermissions(
  userId: string,
  buildingId: string,
  permissions: Permission[],
  grantedBy: string,
  expiresAt?: Date
): Promise<void> {
  // Use a transaction to ensure all permissions are granted together
  await prisma.$transaction([
    // Create all permissions
    prisma.adminPermission.createMany({
      data: permissions.map(permission => ({
        userId,
        buildingId,
        permission,
        grantedBy,
        expiresAt,
      })),
      skipDuplicates: true, // Skip if permission already exists
    }),
    
    // Log all actions
    prisma.permissionAuditLog.createMany({
      data: permissions.map(permission => ({
        userId,
        buildingId,
        permission,
        action: 'granted',
        performedBy: grantedBy,
      })),
    }),
  ]);
}

// Check if current user can manage permissions (has MANAGE_PERMISSIONS permission)
export async function canManagePermissions(buildingId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  return hasPermission(user.id, buildingId, PERMISSIONS.MANAGE_PERMISSIONS);
}