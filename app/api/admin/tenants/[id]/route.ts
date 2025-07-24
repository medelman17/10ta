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

    // Get tenant with current tenancy to find building
    const tenantData = await prisma.user.findUnique({
      where: { id: tenantId },
      include: {
        tenancies: {
          where: { isCurrent: true },
          include: {
            unit: {
              include: {
                building: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                  },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tenantData) {
      return createErrorResponse(404, 'Tenant not found');
    }

    const currentTenancy = tenantData.tenancies[0];
    const buildingId = currentTenancy?.unit.buildingId;

    // Check permission
    if (buildingId) {
      const canView = await hasAnyPermission(user.id, buildingId, [
        PERMISSIONS.MANAGE_BUILDING,
        PERMISSIONS.MANAGE_TENANTS,
        PERMISSIONS.VIEW_ALL_TENANTS
      ]);
      
      if (!canView) {
        return createErrorResponse(403, 'Forbidden');
      }
    }

    // Get full tenant profile
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      include: {
        tenancies: {
          include: {
            unit: {
              select: {
                id: true,
                unitNumber: true,
                buildingId: true,
                building: {
                  select: {
                    name: true,
                    address: true,
                  },
                },
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
        _count: {
          select: {
            reportedIssues: true,
            communications: true,
            signatures: true,
          },
        },
      },
    });

    if (!tenant) {
      return createErrorResponse(404, 'Tenant not found');
    }

    // Transform data
    const profile = {
      id: tenant.id,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      email: tenant.email,
      phone: tenant.phone,
      shareContactInfo: tenant.shareContactInfo,
      allowNeighborMessages: tenant.allowNeighborMessages,
      publicIssuesByDefault: tenant.publicIssuesByDefault,
      emergencyContacts: [], // Would come from a separate table
      currentTenancy: currentTenancy ? {
        id: currentTenancy.id,
        unit: currentTenancy.unit,
        startDate: currentTenancy.startDate,
      } : null,
      tenancyHistory: tenant.tenancies.map(t => ({
        id: t.id,
        unit: {
          unitNumber: t.unit.unitNumber,
        },
        startDate: t.startDate,
        endDate: t.endDate,
      })),
      _count: tenant._count,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return createErrorResponse(500, 'Failed to fetch tenant');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Get tenant's current building for permission check
    const tenantData = await prisma.user.findUnique({
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

    if (!tenantData) {
      return createErrorResponse(404, 'Tenant not found');
    }

    const buildingId = tenantData.tenancies[0]?.unit.buildingId;
    
    if (buildingId) {
      const canManage = await hasAnyPermission(user.id, buildingId, [
        PERMISSIONS.MANAGE_BUILDING,
        PERMISSIONS.MANAGE_TENANTS
      ]);
      
      if (!canManage) {
        return createErrorResponse(403, 'Forbidden');
      }
    }

    const body = await req.json();
    const { phone, shareContactInfo, allowNeighborMessages, publicIssuesByDefault } = body;

    // Update tenant
    const updatedTenant = await prisma.user.update({
      where: { id: tenantId },
      data: {
        ...(phone !== undefined && { phone }),
        ...(shareContactInfo !== undefined && { shareContactInfo }),
        ...(allowNeighborMessages !== undefined && { allowNeighborMessages }),
        ...(publicIssuesByDefault !== undefined && { publicIssuesByDefault }),
      },
    });

    // Log the change
    if (buildingId) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entityType: 'tenant',
          entityId: tenantId,
          metadata: body,
        },
      });
    }

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    return createErrorResponse(500, 'Failed to update tenant');
  }
}