import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buildingId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Check permission
    const canManage = await hasPermission(user.id, buildingId, PERMISSIONS.MANAGE_BUILDING);
    if (!canManage) {
      return createErrorResponse(403, 'Forbidden');
    }

    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        _count: {
          select: {
            units: true,
            issues: true,
            petitions: true,
            meetings: true,
          },
        },
      },
    });

    if (!building) {
      return createErrorResponse(404, 'Building not found');
    }

    return NextResponse.json(building);
  } catch (error) {
    console.error('Error fetching building:', error);
    return createErrorResponse(500, 'Failed to fetch building data');
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buildingId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Only superusers can delete buildings
    const isSuperUser = process.env.NEXT_PUBLIC_SUPER_USER_EMAILS?.split(',').includes(user.email);
    
    if (!isSuperUser) {
      return createErrorResponse(403, 'Only platform administrators can delete buildings');
    }

    // Check if building exists
    const building = await prisma.building.findUnique({
      where: { id: buildingId }
    });

    if (!building) {
      return createErrorResponse(404, 'Building not found');
    }

    // Check for active tenants and open issues
    const [activeTenancyCount, openIssueCount] = await Promise.all([
      prisma.tenancy.count({
        where: {
          unit: {
            buildingId
          },
          isCurrent: true
        }
      }),
      prisma.issue.count({
        where: {
          buildingId,
          status: {
            in: ['OPEN', 'IN_PROGRESS']
          }
        }
      })
    ]);

    // Prevent deletion if there are active tenants or open issues
    if (activeTenancyCount > 0) {
      return createErrorResponse(400, 'Cannot delete building with active tenants');
    }

    if (openIssueCount > 0) {
      return createErrorResponse(400, 'Cannot delete building with open issues');
    }

    // Delete building and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete in order of dependencies
      // Delete communications through issues
      await tx.communication.deleteMany({ 
        where: { 
          issue: { 
            buildingId 
          } 
        } 
      });
      await tx.issue.deleteMany({ where: { buildingId } });
      await tx.document.deleteMany({ where: { buildingId } });
      await tx.petition.deleteMany({ where: { buildingId } });
      await tx.meeting.deleteMany({ where: { buildingId } });
      await tx.tenancy.deleteMany({ where: { unit: { buildingId } } });
      await tx.unitRequest.deleteMany({ where: { buildingId } });
      await tx.unit.deleteMany({ where: { buildingId } });
      await tx.adminPermission.deleteMany({ where: { buildingId } });
      await tx.buildingRole.deleteMany({ where: { buildingId } });
      await tx.building.delete({ where: { id: buildingId } });

      // Create audit log for deletion
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          entityType: 'building',
          entityId: buildingId,
          metadata: {
            name: building.name,
            address: building.address
          }
        }
      });
    });

    return NextResponse.json({
      message: 'Building deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting building:', error);
    return createErrorResponse(500, 'Failed to delete building');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buildingId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Check permission
    const canManage = await hasPermission(user.id, buildingId, PERMISSIONS.MANAGE_BUILDING);
    if (!canManage) {
      return createErrorResponse(403, 'Forbidden');
    }

    const body = await req.json();
    const { name, address, city, state, zipCode, floors, unitsPerFloor } = body;

    const updatedBuilding = await prisma.building.update({
      where: { id: buildingId },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
        ...(zipCode && { zipCode }),
        ...(floors && { floors }),
        ...(unitsPerFloor && { unitsPerFloor }),
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'building',
        entityId: buildingId,
        metadata: body,
      },
    });

    return NextResponse.json(updatedBuilding);
  } catch (error) {
    console.error('Error updating building:', error);
    return createErrorResponse(500, 'Failed to update building');
  }
}