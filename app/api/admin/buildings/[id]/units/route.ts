import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-middleware';
import { hasAnyPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface UnitWhereClause {
  buildingId: string;
  OR?: Array<{
    unitNumber?: { contains: string; mode: 'insensitive' };
    tenancies?: {
      some: {
        isCurrent: boolean;
        user?: {
          OR: Array<{
            firstName?: { contains: string; mode: 'insensitive' };
            lastName?: { contains: string; mode: 'insensitive' };
            email?: { contains: string; mode: 'insensitive' };
          }>;
        };
      };
    };
  }>;
  floor?: number;
}

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
    const canView = await hasAnyPermission(user.id, buildingId, [
      PERMISSIONS.MANAGE_BUILDING,
      PERMISSIONS.MANAGE_UNIT_REQUESTS
    ]);
    
    if (!canView) {
      return createErrorResponse(403, 'Forbidden');
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const floor = searchParams.get('floor');
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: UnitWhereClause = { buildingId };

    if (search) {
      whereClause.OR = [
        { unitNumber: { contains: search, mode: 'insensitive' } },
        {
          tenancies: {
            some: {
              isCurrent: true,
              user: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      ];
    }

    if (floor && floor !== 'all') {
      whereClause.floor = parseInt(floor);
    }

    // Get all units with their data
    const units = await prisma.unit.findMany({
      where: whereClause,
      include: {
        tenancies: {
          where: { isCurrent: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        issues: {
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS', 'AWAITING_LANDLORD'] },
          },
          select: {
            id: true,
            status: true,
            severity: true,
          },
        },
        _count: {
          select: {
            tenancies: true,
          },
        },
      },
      orderBy: [
        { floor: 'asc' },
        { line: 'asc' },
      ],
    });

    // Transform units data
    const transformedUnits = units.map(unit => {
      const activeTenancy = unit.tenancies[0];
      const issueStats = {
        open: unit.issues.filter(i => i.status === 'OPEN').length,
        inProgress: unit.issues.filter(i => i.status === 'IN_PROGRESS').length,
        critical: unit.issues.filter(i => i.severity === 'EMERGENCY').length,
      };

      let unitStatus: 'OCCUPIED' | 'VACANT' = 'VACANT';
      if (activeTenancy) {
        unitStatus = 'OCCUPIED';
      }
      // You could check for maintenance status based on specific issue categories

      return {
        id: unit.id,
        unitNumber: unit.unitNumber,
        floor: unit.floor,
        line: unit.line,
        status: unitStatus,
        tenancy: activeTenancy ? {
          user: activeTenancy.user,
          moveInDate: activeTenancy.startDate,
        } : undefined,
        issues: issueStats,
        lastActivity: unit.updatedAt,
      };
    });

    // Apply status filter after transformation
    let filteredUnits = transformedUnits;
    if (status && status !== 'all') {
      switch (status) {
        case 'occupied':
          filteredUnits = transformedUnits.filter(u => u.status === 'OCCUPIED');
          break;
        case 'vacant':
          filteredUnits = transformedUnits.filter(u => u.status === 'VACANT');
          break;
        case 'maintenance':
          // For now, maintenance status is based on having critical issues
          filteredUnits = transformedUnits.filter(u => u.issues.critical > 0);
          break;
        case 'issues':
          filteredUnits = transformedUnits.filter(u => u.issues.open > 0 || u.issues.inProgress > 0);
          break;
      }
    }

    // Calculate stats
    const stats = {
      total: filteredUnits.length,
      occupied: filteredUnits.filter(u => u.status === 'OCCUPIED').length,
      vacant: filteredUnits.filter(u => u.status === 'VACANT').length,
      withIssues: filteredUnits.filter(u => u.issues.open > 0 || u.issues.inProgress > 0).length,
      criticalIssues: filteredUnits.reduce((sum, u) => sum + u.issues.critical, 0),
      longestVacant: 0, // Would need more complex query to calculate
    };

    return NextResponse.json({
      units: filteredUnits,
      stats,
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    return createErrorResponse(500, 'Failed to fetch units');
  }
}