import { DocumentVisibility, Prisma } from '@prisma/client';
import { prisma } from './db';

/**
 * Check if a user can access a specific document
 */
export async function canAccessDocument(
  userId: string | null,
  document: {
    visibility: DocumentVisibility;
    buildingId: string;
    tenancyId: string | null;
    uploadedBy: string;
  }
): Promise<boolean> {
  // Public documents are accessible to everyone
  if (document.visibility === 'PUBLIC') {
    return true;
  }

  // No user = no access to non-public documents
  if (!userId) {
    return false;
  }

  // Document owner always has access
  if (document.uploadedBy === userId) {
    return true;
  }

  // Get user's current tenancy
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenancies: {
        where: { isCurrent: true },
        include: { unit: true }
      }
    }
  });

  if (!user) {
    return false;
  }

  const currentTenancy = user.tenancies[0];
  if (!currentTenancy) {
    return false;
  }

  switch (document.visibility) {
    case 'BUILDING_TENANTS':
      // Check if user is in the same building
      return currentTenancy.unit.buildingId === document.buildingId;

    case 'TENANT_ONLY':
      // Check if document belongs to user's tenancy
      return currentTenancy.id === document.tenancyId;

    default:
      return false;
  }
}

/**
 * Get Prisma where clause for documents accessible by a user
 */
export async function getDocumentAccessFilter(userId: string | null) {
  if (!userId) {
    // Unauthenticated users can only see public documents
    return { visibility: 'PUBLIC' as DocumentVisibility };
  }

  // Get user's current tenancy
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenancies: {
        where: { isCurrent: true },
        include: { unit: true }
      }
    }
  });

  if (!user) {
    return { visibility: 'PUBLIC' as DocumentVisibility };
  }

  const currentTenancy = user.tenancies[0];
  
  // Build OR conditions for document access
  const conditions: Prisma.DocumentWhereInput[] = [
    { visibility: 'PUBLIC' as DocumentVisibility },
    { uploadedBy: userId } // User's own documents
  ];

  if (currentTenancy) {
    // Documents visible to building tenants
    conditions.push({
      AND: [
        { visibility: 'BUILDING_TENANTS' as DocumentVisibility },
        { buildingId: currentTenancy.unit.buildingId }
      ]
    });

    // Documents specific to user's tenancy
    conditions.push({
      AND: [
        { visibility: 'TENANT_ONLY' as DocumentVisibility },
        { tenancyId: currentTenancy.id }
      ]
    });
  }

  return { OR: conditions };
}

/**
 * Check if user can upload documents to a building
 */
export async function canUploadToBuilding(
  userId: string,
  buildingId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenancies: {
        where: { isCurrent: true },
        include: { unit: true }
      },
      buildingRoles: {
        where: { buildingId }
      }
    }
  });

  if (!user) {
    return false;
  }

  // Check if user is a current tenant in the building
  const isCurrentTenant = user.tenancies.some(
    t => t.unit.buildingId === buildingId
  );

  // Check if user has admin role in the building
  const isAdmin = user.buildingRoles.some(
    r => r.role === 'BUILDING_ADMIN' || r.role === 'ASSOCIATION_ADMIN'
  );

  return isCurrentTenant || isAdmin;
}

/**
 * Get the default building ID for a user (their current tenancy's building)
 */
export async function getUserBuildingId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenancies: {
        where: { isCurrent: true },
        include: { unit: true }
      }
    }
  });

  if (!user || user.tenancies.length === 0) {
    return null;
  }

  return user.tenancies[0].unit.buildingId;
}

/**
 * Check if user can manage documents (delete, edit) based on ownership or admin status
 */
export async function canManageDocument(
  userId: string,
  document: {
    uploadedBy: string;
    buildingId: string;
  }
): Promise<boolean> {
  // Owner can always manage their documents
  if (document.uploadedBy === userId) {
    return true;
  }

  // Check if user is building admin
  const buildingRole = await prisma.buildingRole.findFirst({
    where: {
      userId,
      buildingId: document.buildingId,
      role: 'BUILDING_ADMIN'
    }
  });

  return !!buildingRole;
}