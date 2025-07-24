import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createErrorResponse } from '@/lib/api-middleware';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Check if user is a superuser or has admin access to any building
    const isSuperUser = process.env.NEXT_PUBLIC_SUPER_USER_EMAILS?.split(',').includes(user.email);
    
    if (!isSuperUser) {
      // Check if user has admin permissions in any building
      const adminRoles = await prisma.buildingRole.findMany({
        where: {
          userId: user.id,
          role: {
            in: ['BUILDING_ADMIN', 'ASSOCIATION_ADMIN']
          }
        }
      });
      
      if (adminRoles.length === 0) {
        return createErrorResponse(403, 'Forbidden');
      }
    }

    // Get all buildings with stats
    const buildings = await prisma.building.findMany({
      include: {
        _count: {
          select: {
            units: true,
            issues: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get tenant counts separately
    const tenantCounts = await Promise.all(
      buildings.map(building => 
        prisma.buildingRole.count({
          where: {
            buildingId: building.id,
            role: Role.TENANT
          }
        })
      )
    );

    // Transform the data
    const buildingsWithStats = buildings.map((building, index) => ({
      id: building.id,
      name: building.name,
      address: building.address,
      city: building.city,
      state: building.state,
      zipCode: building.zipCode,
      floors: building.floors,
      unitsPerFloor: building.unitsPerFloor,
      createdAt: building.createdAt,
      stats: {
        totalUnits: building._count.units,
        totalTenants: tenantCounts[index],
        activeIssues: building._count.issues
      }
    }));

    return NextResponse.json({
      buildings: buildingsWithStats,
      total: buildings.length
    });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return createErrorResponse(500, 'Failed to fetch buildings');
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Only superusers can create buildings
    const isSuperUser = process.env.NEXT_PUBLIC_SUPER_USER_EMAILS?.split(',').includes(user.email);
    
    if (!isSuperUser) {
      return createErrorResponse(403, 'Only platform administrators can create buildings');
    }

    const body = await req.json();
    const { name, address, city, state, zipCode, floors = 10, unitsPerFloor = 8 } = body;

    if (!name || !address || !city || !state || !zipCode) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // Create building and units in a transaction
    const building = await prisma.$transaction(async (tx) => {
      // Create the building
      const newBuilding = await tx.building.create({
        data: {
          name,
          address,
          city,
          state,
          zipCode,
          floors,
          unitsPerFloor
        }
      });

      // Create all units for the building
      const units = [];
      const lines = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, unitsPerFloor);
      
      for (let floor = 1; floor <= floors; floor++) {
        for (const line of lines) {
          units.push({
            buildingId: newBuilding.id,
            unitNumber: `${floor}${line}`,
            floor,
            line
          });
        }
      }

      await tx.unit.createMany({
        data: units
      });

      // Create an audit log entry
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entityType: 'building',
          entityId: newBuilding.id,
          metadata: {
            name,
            address,
            totalUnits: units.length
          }
        }
      });

      return newBuilding;
    });

    return NextResponse.json({
      building,
      message: 'Building created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating building:', error);
    return createErrorResponse(500, 'Failed to create building');
  }
}