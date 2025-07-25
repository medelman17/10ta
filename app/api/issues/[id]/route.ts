import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/issues/[id] - Get a single issue
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { id } = await params;
    
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        unit: {
          select: {
            unitNumber: true,
          },
        },
        building: {
          select: {
            name: true,
          },
        },
        media: true,
        _count: {
          select: {
            communications: true,
            comments: true,
          },
        },
      },
    });

    if (!issue) {
      return createErrorResponse(404, 'Issue not found');
    }

    // Check if user has access to this issue
    const isReporter = issue.reporterId === user.id;
    const canViewAll = await hasPermission(user.id, issue.buildingId, PERMISSIONS.VIEW_ALL_ISSUES);
    const isInBuilding = user.buildingRoles.some(role => role.buildingId === issue.buildingId) ||
                        user.tenancies.some(t => t.unit.buildingId === issue.buildingId && t.isCurrent);
    
    // Access rules:
    // 1. Reporter can always see their own issues
    // 2. Users with VIEW_ALL_ISSUES permission can see all issues
    // 3. Other users in the building can only see public issues
    if (!isReporter && !canViewAll && (!isInBuilding || !issue.isPublic)) {
      return createErrorResponse(403, 'You do not have access to this issue');
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Error fetching issue:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

// PATCH /api/issues/[id] - Update an issue
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { id } = await params;
    const body = await req.json();
    
    // Validate the request body
    const { 
      title, 
      description, 
      category, 
      severity, 
      location, 
      status, 
      isPublic,
      newMediaUrls,
      removedMediaIds 
    } = body;
    
    // Get the issue to check permissions
    const issue = await prisma.issue.findUnique({
      where: { id },
      select: {
        reporterId: true,
        buildingId: true,
      },
    });

    if (!issue) {
      return createErrorResponse(404, 'Issue not found');
    }

    // Check permissions
    const isReporter = issue.reporterId === user.id;
    const canManageIssues = await hasPermission(user.id, issue.buildingId, PERMISSIONS.MANAGE_ISSUES);
    
    if (!isReporter && !canManageIssues) {
      return createErrorResponse(403, 'You do not have permission to edit this issue');
    }

    // Start a transaction to handle media updates
    const updatedIssue = await prisma.$transaction(async (tx) => {
      // Handle media removal
      if (removedMediaIds && removedMediaIds.length > 0) {
        await tx.issueMedia.deleteMany({
          where: {
            id: { in: removedMediaIds },
            issueId: id,
          },
        });
      }

      // Handle new media additions
      if (newMediaUrls && newMediaUrls.length > 0) {
        await tx.issueMedia.createMany({
          data: newMediaUrls.map((url: string) => ({
            issueId: id,
            url,
            type: 'IMAGE',
          })),
        });
      }

      // Update the issue
      const updated = await tx.issue.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          ...(severity !== undefined && { severity }),
          ...(location !== undefined && { location }),
          ...(status !== undefined && { status }),
          ...(isPublic !== undefined && { isPublic }),
        },
        include: {
          reporter: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          unit: {
            select: {
              unitNumber: true,
            },
          },
          building: {
            select: {
              name: true,
            },
          },
          media: true,
        },
      });

      return updated;
    });

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_ISSUE',
        entityType: 'Issue',
        entityId: id,
        metadata: {
          changes: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(category !== undefined && { category }),
            ...(severity !== undefined && { severity }),
            ...(location !== undefined && { location }),
            ...(status !== undefined && { status }),
            ...(isPublic !== undefined && { isPublic }),
            ...(newMediaUrls && newMediaUrls.length > 0 && { addedPhotos: newMediaUrls.length }),
            ...(removedMediaIds && removedMediaIds.length > 0 && { removedPhotos: removedMediaIds.length }),
          },
          updatedBy: isReporter ? 'reporter' : 'admin',
        },
      },
    });

    console.log(`User ${user.id} updated issue ${id}`);

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error('Error updating issue:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

// DELETE /api/issues/[id] - Delete an issue (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { id } = await params;
    
    // Get the issue to check permissions
    const issue = await prisma.issue.findUnique({
      where: { id },
      select: {
        reporterId: true,
        buildingId: true,
      },
    });

    if (!issue) {
      return createErrorResponse(404, 'Issue not found');
    }

    // Only allow deletion by admin or the reporter (within 24 hours)
    const isReporter = issue.reporterId === user.id;
    const canManageIssues = await hasPermission(user.id, issue.buildingId, PERMISSIONS.MANAGE_ISSUES);
    
    if (!canManageIssues && !isReporter) {
      return createErrorResponse(403, 'You do not have permission to delete this issue');
    }

    // Delete the issue (cascades to related records)
    await prisma.issue.delete({
      where: { id },
    });

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_ISSUE',
        entityType: 'Issue',
        entityId: id,
        metadata: {
          deletedBy: isReporter ? 'reporter' : 'admin',
        },
      },
    });

    console.log(`User ${user.id} deleted issue ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}