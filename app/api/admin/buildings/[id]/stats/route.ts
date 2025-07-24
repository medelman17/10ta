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
    const canViewAnalytics = await hasPermission(user.id, buildingId, PERMISSIONS.VIEW_BUILDING_ANALYTICS);
    if (!canViewAnalytics) {
      return createErrorResponse(403, 'Forbidden');
    }

    // Get building with unit count
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      include: {
        _count: {
          select: {
            units: true,
          },
        },
      },
    });

    if (!building) {
      return createErrorResponse(404, 'Building not found');
    }

    // Get occupied units count
    const occupiedUnits = await prisma.unit.count({
      where: {
        buildingId,
        tenancies: {
          some: {
            isCurrent: true,
          },
        },
      },
    });

    // Get total and verified tenants
    const tenants = await prisma.tenancy.findMany({
      where: {
        unit: {
          buildingId,
        },
        isCurrent: true,
      },
      include: {
        user: true,
      },
    });

    const totalTenants = tenants.length;
    const verifiedTenants = tenants.filter(t => t.user.phone !== null).length; // Users with phone numbers

    // Get active issues
    const activeIssues = await prisma.issue.count({
      where: {
        buildingId,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'AWAITING_LANDLORD'],
        },
      },
    });

    // Get critical issues
    const criticalIssues = await prisma.issue.count({
      where: {
        buildingId,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'AWAITING_LANDLORD'],
        },
        severity: 'EMERGENCY',
      },
    });

    // Average response time - would need to calculate from communications in production
    const avgResponseTime = 'N/A';

    const stats = {
      totalUnits: building.floors * building.unitsPerFloor,
      occupiedUnits,
      totalTenants,
      verifiedTenants,
      activeIssues,
      criticalIssues,
      avgResponseTime,
      occupancyRate: Math.round((occupiedUnits / (building.floors * building.unitsPerFloor)) * 100),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching building stats:', error);
    return createErrorResponse(500, 'Failed to fetch building statistics');
  }
}