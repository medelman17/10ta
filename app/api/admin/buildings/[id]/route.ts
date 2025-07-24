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