import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-middleware';
import { hasPermission, hasAnyPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Get unit with building info to check permissions
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        tenancies: {
          where: { isCurrent: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            issues: true,
            tenancies: true,
          },
        },
      },
    });

    if (!unit) {
      return createErrorResponse(404, 'Unit not found');
    }

    // Check permission
    const canView = await hasAnyPermission(user.id, unit.building.id, [
      PERMISSIONS.MANAGE_BUILDING,
      PERMISSIONS.MANAGE_UNIT_REQUESTS
    ]);
    
    if (!canView) {
      return createErrorResponse(403, 'Forbidden');
    }

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    return createErrorResponse(500, 'Failed to fetch unit');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Get unit to check building
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { buildingId: true },
    });

    if (!unit) {
      return createErrorResponse(404, 'Unit not found');
    }

    // Check permission
    const canManageBuilding = await hasPermission(user.id, unit.buildingId, PERMISSIONS.MANAGE_BUILDING);
    
    if (!canManageBuilding) {
      return createErrorResponse(403, 'Forbidden');
    }

    const body = await req.json();
    // For now, units don't have many editable fields
    // This could be extended to update unit-specific settings

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'unit',
        entityId: unitId,
        metadata: body,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating unit:', error);
    return createErrorResponse(500, 'Failed to update unit');
  }
}