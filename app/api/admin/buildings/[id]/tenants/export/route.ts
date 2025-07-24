import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-middleware';
import { hasAnyPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
    const canExport = await hasAnyPermission(user.id, buildingId, [
      PERMISSIONS.MANAGE_BUILDING,
      PERMISSIONS.MANAGE_TENANTS,
      PERMISSIONS.VIEW_ALL_TENANTS
    ]);
    
    if (!canExport) {
      return createErrorResponse(403, 'Forbidden');
    }

    const body = await req.json();
    const { tenantIds } = body;

    // Build where clause
    const whereClause: {
      unit: {
        buildingId: string;
      };
      isCurrent: boolean;
      userId?: { in: string[] };
    } = {
      unit: {
        buildingId,
      },
      isCurrent: true,
    };

    if (tenantIds && tenantIds.length > 0) {
      whereClause.userId = {
        in: tenantIds,
      };
    }

    // Get tenancy data
    const tenancies = await prisma.tenancy.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            _count: {
              select: {
                reportedIssues: true,
              },
            },
          },
        },
        unit: true,
      },
      orderBy: [
        { unit: { floor: 'asc' } },
        { unit: { line: 'asc' } },
      ],
    });

    // Create CSV content
    const headers = [
      'Unit',
      'Floor',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Move-in Date',
      'Verification Status',
      'Issues Reported',
      'Contact Info Shared'
    ];

    const rows = tenancies.map(tenancy => {
      const user = tenancy.user;
      return [
        tenancy.unit.unitNumber,
        tenancy.unit.floor,
        user.firstName || '',
        user.lastName || '',
        user.email,
        user.shareContactInfo ? (user.phone || '') : 'Private',
        new Date(tenancy.startDate).toLocaleDateString(),
        user.phone ? 'Verified' : 'Unverified',
        user._count.reportedIssues,
        user.shareContactInfo ? 'Yes' : 'No'
      ];
    });

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EXPORT',
        entityType: 'tenants',
        entityId: buildingId,
        metadata: {
          count: tenancies.length,
          selectedOnly: !!tenantIds,
        },
      },
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="tenants-${buildingId}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting tenants:', error);
    return createErrorResponse(500, 'Failed to export tenants');
  }
}