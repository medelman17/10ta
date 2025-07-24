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
    const { id: tenantId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Get tenant's building
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      include: {
        tenancies: {
          where: { isCurrent: true },
          select: {
            unit: {
              select: {
                buildingId: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return createErrorResponse(404, 'Tenant not found');
    }

    const buildingId = tenant.tenancies[0]?.unit.buildingId;
    
    if (buildingId) {
      const canView = await hasAnyPermission(user.id, buildingId, [
        PERMISSIONS.MANAGE_BUILDING,
        PERMISSIONS.MANAGE_TENANTS,
        PERMISSIONS.VIEW_ALL_COMMUNICATIONS
      ]);
      
      if (!canView) {
        return createErrorResponse(403, 'Forbidden');
      }
    }

    // Get all communications involving this tenant
    const communications = await prisma.communication.findMany({
      where: {
        userId: tenantId,
      },
      select: {
        id: true,
        subject: true,
        type: true,
        direction: true,
        resolved: true,
        createdAt: true,
        issue: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent communications
    });

    return NextResponse.json(communications);
  } catch (error) {
    console.error('Error fetching tenant communications:', error);
    return createErrorResponse(500, 'Failed to fetch tenant communications');
  }
}