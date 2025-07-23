import { prisma } from '@/lib/db';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS, Permission } from '@/lib/permissions';

// Check if a user can access a specific issue
export async function canAccessIssue(
  userId: string,
  issueId: string,
  requiredPermission?: Permission
): Promise<boolean> {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      reporterId: true,
      buildingId: true,
      isPublic: true,
    },
  });

  if (!issue) return false;

  // Owner can always access their own issues
  if (issue.reporterId === userId) return true;

  // Check if user is in the same building
  const userInBuilding = await prisma.user.findFirst({
    where: {
      id: userId,
      OR: [
        {
          tenancies: {
            some: {
              unit: {
                buildingId: issue.buildingId,
              },
              isCurrent: true,
            },
          },
        },
        {
          buildingRoles: {
            some: {
              buildingId: issue.buildingId,
            },
          },
        },
      ],
    },
  });

  if (!userInBuilding) return false;

  // Public issues can be seen by any building member
  if (issue.isPublic && !requiredPermission) return true;

  // Check specific permission if required
  if (requiredPermission) {
    return hasPermission(userId, issue.buildingId, requiredPermission);
  }

  // Private issues require VIEW_ALL_ISSUES permission
  return hasPermission(userId, issue.buildingId, PERMISSIONS.VIEW_ALL_ISSUES);
}

// Check if a user can modify an issue
export async function canModifyIssue(
  userId: string,
  issueId: string
): Promise<boolean> {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      reporterId: true,
      buildingId: true,
    },
  });

  if (!issue) return false;

  // Owner can modify their own issues (limited actions)
  if (issue.reporterId === userId) return true;

  // Otherwise need MANAGE_ISSUES permission
  return hasPermission(userId, issue.buildingId, PERMISSIONS.MANAGE_ISSUES);
}

// Check if a user can access a communication
export async function canAccessCommunication(
  userId: string,
  communicationId: string,
  requiredPermission?: Permission
): Promise<boolean> {
  const communication = await prisma.communication.findUnique({
    where: { id: communicationId },
    select: {
      userId: true,
      issue: {
        select: {
          buildingId: true,
        },
      },
    },
  });

  if (!communication) return false;

  // Owner can always access their own communications
  if (communication.userId === userId) return true;

  // Need building context
  const buildingId = communication.issue?.buildingId;
  if (!buildingId) return false;

  // Check specific permission
  if (requiredPermission) {
    return hasPermission(userId, buildingId, requiredPermission);
  }

  // Default requires VIEW_ALL_COMMUNICATIONS
  return hasPermission(userId, buildingId, PERMISSIONS.VIEW_ALL_COMMUNICATIONS);
}

// Check if a user can access a unit
export async function canAccessUnit(
  userId: string,
  unitId: string,
  requiredPermission?: Permission
): Promise<boolean> {
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      tenancies: {
        where: {
          userId,
          isCurrent: true,
        },
      },
    },
  });

  if (!unit) return false;

  // Tenant can access their own unit
  if (unit.tenancies.length > 0) return true;

  // Check specific permission
  if (requiredPermission) {
    return hasPermission(userId, unit.buildingId, requiredPermission);
  }

  // Default requires VIEW_ALL_TENANTS
  return hasPermission(userId, unit.buildingId, PERMISSIONS.VIEW_ALL_TENANTS);
}

// Check if a user can manage a unit request
export async function canManageUnitRequest(
  userId: string,
  requestId: string
): Promise<boolean> {
  const request = await prisma.unitRequest.findUnique({
    where: { id: requestId },
    select: {
      userId: true,
      buildingId: true,
    },
  });

  if (!request) return false;

  // Requester can view (but not approve) their own request
  if (request.userId === userId) return false;

  // Need MANAGE_UNIT_REQUESTS permission
  return hasPermission(userId, request.buildingId, PERMISSIONS.MANAGE_UNIT_REQUESTS);
}

// Check if user is in a specific building
export async function isUserInBuilding(
  userId: string,
  buildingId: string
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      OR: [
        {
          tenancies: {
            some: {
              unit: {
                buildingId,
              },
              isCurrent: true,
            },
          },
        },
        {
          buildingRoles: {
            some: {
              buildingId,
            },
          },
        },
      ],
    },
  });

  return !!user;
}

// Get user's building context (for endpoints that need a default building)
export async function getUserBuildingContext(userId: string): Promise<string | null> {
  // First try to get from current tenancy
  const tenancy = await prisma.tenancy.findFirst({
    where: {
      userId,
      isCurrent: true,
    },
    include: {
      unit: {
        select: {
          buildingId: true,
        },
      },
    },
  });

  if (tenancy) return tenancy.unit.buildingId;

  // Then try to get from building roles
  const role = await prisma.buildingRole.findFirst({
    where: {
      userId,
    },
    select: {
      buildingId: true,
    },
  });

  return role?.buildingId || null;
}

// Check if a user can perform an action on behalf of another user
export async function canActOnBehalfOf(
  actingUserId: string,
  targetUserId: string,
  buildingId: string,
  requiredPermission: Permission
): Promise<boolean> {
  // Can't act on behalf of yourself using this check
  if (actingUserId === targetUserId) return false;

  // Check if target user is in the building
  const targetInBuilding = await isUserInBuilding(targetUserId, buildingId);
  if (!targetInBuilding) return false;

  // Check if acting user has required permission
  return hasPermission(actingUserId, buildingId, requiredPermission);
}

// Helper to get accessible issues for a user
export async function getAccessibleIssueIds(
  userId: string,
  buildingId: string
): Promise<string[]> {
  // Get user's own issues
  const ownIssues = await prisma.issue.findMany({
    where: {
      reporterId: userId,
      buildingId,
    },
    select: { id: true },
  });

  const ownIssueIds = ownIssues.map(i => i.id);

  // Check if user has permission to view all issues
  const canViewAll = await hasPermission(userId, buildingId, PERMISSIONS.VIEW_ALL_ISSUES);
  
  if (canViewAll) {
    const allIssues = await prisma.issue.findMany({
      where: { buildingId },
      select: { id: true },
    });
    return allIssues.map(i => i.id);
  }

  // Otherwise, get public issues in the building
  const publicIssues = await prisma.issue.findMany({
    where: {
      buildingId,
      isPublic: true,
      id: {
        notIn: ownIssueIds, // Exclude already included own issues
      },
    },
    select: { id: true },
  });

  return [...ownIssueIds, ...publicIssues.map(i => i.id)];
}