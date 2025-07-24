import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Get unit with active tenancy
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        tenancies: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });

    if (!unit) {
      return createErrorResponse(404, 'Unit not found');
    }

    // Check permission
    const canManageTenants = await hasPermission(user.id, unit.buildingId, PERMISSIONS.MANAGE_TENANTS);
    
    if (!canManageTenants) {
      return createErrorResponse(403, 'Forbidden');
    }

    const activeTenancy = unit.tenancies[0];
    if (!activeTenancy) {
      return createErrorResponse(400, 'Unit is already vacant');
    }

    // End the tenancy
    await prisma.tenancy.update({
      where: { id: activeTenancy.id },
      data: {
        isCurrent: false,
        endDate: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'VACATE',
        entityType: 'unit',
        entityId: unitId,
        metadata: {
          unitNumber: unit.unitNumber,
          tenancyId: activeTenancy.id,
          tenantId: activeTenancy.userId,
        },
      },
    });

    return NextResponse.json({ 
      success: true,
      message: `Unit ${unit.unitNumber} has been vacated`,
    });
  } catch (error) {
    console.error('Error vacating unit:', error);
    return createErrorResponse(500, 'Failed to vacate unit');
  }
}