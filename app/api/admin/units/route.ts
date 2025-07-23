import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';

// GET /api/admin/units - Fetch units for admin use
export const GET = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    
    if (!buildingId) {
      return createErrorResponse(400, 'Building ID is required');
    }

    // Check if user has permission to view units in this building
    const canManageBuilding = await hasPermission(user.id, buildingId, PERMISSIONS.MANAGE_BUILDING);
    const canManageIssues = await hasPermission(user.id, buildingId, PERMISSIONS.MANAGE_ISSUES);
    
    if (!canManageBuilding && !canManageIssues) {
      return createErrorResponse(403, 'You do not have permission to view units in this building');
    }

    // Fetch units for the building
    const units = await prisma.unit.findMany({
      where: {
        buildingId,
      },
      select: {
        id: true,
        unitNumber: true,
        buildingId: true,
        floor: true,
        line: true,
      },
      orderBy: [
        { floor: 'desc' },
        { line: 'asc' },
      ],
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error('Error fetching units:', error);
    return createErrorResponse(500, 'Internal server error');
  }
});