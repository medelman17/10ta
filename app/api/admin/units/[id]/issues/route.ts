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
    const canViewIssues = await hasPermission(user.id, unit.buildingId, PERMISSIONS.VIEW_ALL_ISSUES);
    
    if (!canViewIssues) {
      return createErrorResponse(403, 'Forbidden');
    }

    const issues = await prisma.issue.findMany({
      where: { unitId },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            media: true,
            communications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching unit issues:', error);
    return createErrorResponse(500, 'Failed to fetch unit issues');
  }
}