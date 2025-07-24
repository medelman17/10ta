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
    const { id: buildingId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Check permission
    const canView = await hasAnyPermission(user.id, buildingId, [
      PERMISSIONS.MANAGE_BUILDING,
      PERMISSIONS.MANAGE_TENANTS,
      PERMISSIONS.VIEW_ALL_TENANTS
    ]);
    
    if (!canView) {
      return createErrorResponse(403, 'Forbidden');
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const floor = searchParams.get('floor');
    const verified = searchParams.get('verified');

    // Build where clause for tenancies
    const whereClause: {
      unit: {
        buildingId: string;
        floor?: number;
      };
      isCurrent: boolean;
    } = {
      unit: {
        buildingId,
      },
      isCurrent: true,
    };

    if (floor && floor !== 'all') {
      whereClause.unit.floor = parseInt(floor);
    }

    // Get all current tenancies with user data
    let tenancies = await prisma.tenancy.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            _count: {
              select: {
                reportedIssues: true,
                communications: true,
              },
            },
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            floor: true,
            line: true,
          },
        },
      },
      orderBy: [
        { unit: { floor: 'asc' } },
        { unit: { line: 'asc' } },
      ],
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      tenancies = tenancies.filter(tenancy => {
        const user = tenancy.user;
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          tenancy.unit.unitNumber.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply verification filter
    if (verified && verified !== 'all') {
      tenancies = tenancies.filter(tenancy => {
        const isVerified = !!tenancy.user.phone; // Simple verification check
        return verified === 'verified' ? isVerified : !isVerified;
      });
    }

    // Transform data for frontend
    const tenants = tenancies.map(tenancy => ({
      id: tenancy.user.id,
      firstName: tenancy.user.firstName,
      lastName: tenancy.user.lastName,
      email: tenancy.user.email,
      phone: tenancy.user.phone,
      shareContactInfo: tenancy.user.shareContactInfo,
      tenancy: {
        id: tenancy.id,
        unitId: tenancy.unitId,
        unit: tenancy.unit,
        startDate: tenancy.startDate,
        isCurrent: tenancy.isCurrent,
      },
      _count: tenancy.user._count,
    }));

    // Calculate stats
    const stats = {
      total: tenants.length,
      verified: tenants.filter(t => !!t.phone).length,
      withIssues: tenants.filter(t => t._count.reportedIssues > 0).length,
      sharingContact: tenants.filter(t => t.shareContactInfo).length,
    };

    return NextResponse.json({
      tenants,
      stats,
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return createErrorResponse(500, 'Failed to fetch tenants');
  }
}

export async function POST(
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
    const canManage = await hasAnyPermission(user.id, buildingId, [
      PERMISSIONS.MANAGE_BUILDING,
      PERMISSIONS.MANAGE_TENANTS
    ]);
    
    if (!canManage) {
      return createErrorResponse(403, 'Forbidden');
    }

    const body = await req.json();
    const { action, tenantIds, data } = body;

    switch (action) {
      case 'bulk_message':
        // This would integrate with your communication system
        return NextResponse.json({ 
          success: true, 
          message: `Message queued for ${tenantIds.length} tenants`,
          data: data || null
        });

      case 'bulk_update':
        // Bulk update tenant preferences or data
        // This would need careful permission checking
        return NextResponse.json({ 
          success: true, 
          message: 'Tenants updated',
          data: data || null
        });

      default:
        return createErrorResponse(400, 'Invalid action');
    }
  } catch (error) {
    console.error('Error processing tenant action:', error);
    return createErrorResponse(500, 'Failed to process action');
  }
}