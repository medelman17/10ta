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

// POST /api/admin/units - Create a new unit
export const POST = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const body = await req.json();
    const { buildingId, unitNumber, floor, line } = body;

    if (!buildingId || !unitNumber || !floor || !line) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // Check permission
    const canManageUnits = await hasPermission(user.id, buildingId, PERMISSIONS.MANAGE_BUILDING);
    
    if (!canManageUnits) {
      return createErrorResponse(403, 'Forbidden');
    }

    // Check if unit already exists
    const existingUnit = await prisma.unit.findFirst({
      where: {
        buildingId,
        unitNumber
      }
    });

    if (existingUnit) {
      return createErrorResponse(400, 'Unit already exists');
    }

    // Create the unit
    const unit = await prisma.unit.create({
      data: {
        buildingId,
        unitNumber,
        floor,
        line
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'unit',
        entityId: unit.id,
        metadata: {
          buildingId,
          unitNumber,
          floor,
          line
        }
      }
    });

    return NextResponse.json({
      unit,
      message: 'Unit created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating unit:', error);
    return createErrorResponse(500, 'Failed to create unit');
  }
});