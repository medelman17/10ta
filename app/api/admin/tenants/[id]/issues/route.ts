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
        PERMISSIONS.VIEW_ALL_ISSUES
      ]);
      
      if (!canView) {
        return createErrorResponse(403, 'Forbidden');
      }
    }

    // Get all issues reported by this tenant
    const issues = await prisma.issue.findMany({
      where: { reporterId: tenantId },
      include: {
        unit: {
          select: {
            unitNumber: true,
          },
        },
        _count: {
          select: {
            media: true,
            communications: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching tenant issues:', error);
    return createErrorResponse(500, 'Failed to fetch tenant issues');
  }
}