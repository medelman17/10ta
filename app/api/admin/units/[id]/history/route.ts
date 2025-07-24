import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-middleware';
import { hasAnyPermission } from '@/lib/auth-helpers';
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

    // Get unit to check building
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { buildingId: true },
    });

    if (!unit) {
      return createErrorResponse(404, 'Unit not found');
    }

    // Check permission
    const canView = await hasAnyPermission(user.id, unit.buildingId, [
      PERMISSIONS.MANAGE_BUILDING,
      PERMISSIONS.VIEW_ALL_TENANTS
    ]);
    
    if (!canView) {
      return createErrorResponse(403, 'Forbidden');
    }

    // Get all tenancies for this unit
    const tenancies = await prisma.tenancy.findMany({
      where: { unitId },
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
    });

    // Get unit-related audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'unit',
        entityId: unitId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      tenancies,
      auditLogs,
    });
  } catch (error) {
    console.error('Error fetching unit history:', error);
    return createErrorResponse(500, 'Failed to fetch unit history');
  }
}