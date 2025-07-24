import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-middleware';
import { hasAnyPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    const buildingId = searchParams.get('buildingId');
    const includeExternal = searchParams.get('includeExternal') === 'true';

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    if (!buildingId) {
      return createErrorResponse(400, 'Building ID required');
    }

    // Check permission
    const canSearch = await hasAnyPermission(user.id, buildingId, [
      PERMISSIONS.MANAGE_BUILDING,
      PERMISSIONS.MANAGE_TENANTS,
      PERMISSIONS.MANAGE_UNIT_REQUESTS
    ]);
    
    if (!canSearch) {
      return createErrorResponse(403, 'Forbidden');
    }

    const searchLower = query.toLowerCase();

    // Search for users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            firstName: {
              contains: searchLower,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: searchLower,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: searchLower,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: searchLower,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        tenancies: {
          where: { isCurrent: true },
          include: {
            unit: {
              select: {
                id: true,
                unitNumber: true,
                buildingId: true,
              },
            },
          },
          take: 1,
        },
        unitRequests: {
          where: {
            status: 'PENDING',
            buildingId,
          },
          take: 1,
        },
      },
      take: 20,
    });

    // Transform results
    const results = users
      .filter(user => {
        // If includeExternal is false, only show users from this building
        if (!includeExternal) {
          const currentTenancy = user.tenancies[0];
          return currentTenancy && currentTenancy.unit.buildingId === buildingId;
        }
        return true;
      })
      .map(user => {
        const currentTenancy = user.tenancies[0];
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          currentUnit: currentTenancy ? {
            unitNumber: currentTenancy.unit.unitNumber,
          } : null,
          hasActiveRequest: user.unitRequests.length > 0,
        };
      });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching tenants:', error);
    return createErrorResponse(500, 'Failed to search tenants');
  }
}