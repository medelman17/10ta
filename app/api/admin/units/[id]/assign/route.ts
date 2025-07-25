import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unitId } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const body = await req.json();
    const { tenantId, moveInDate, notes } = body;

    if (!tenantId) {
      return createErrorResponse(400, 'Tenant ID required');
    }

    if (!moveInDate) {
      return createErrorResponse(400, 'Move-in date required');
    }

    // Get unit details
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        tenancies: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });

    if (!unit) {
      return createErrorResponse(404, 'Unit not found');
    }

    // Check permission
    const canManageTenants = await hasPermission(user.id, unit.buildingId, PERMISSIONS.MANAGE_TENANTS);
    
    if (!canManageTenants) {
      return createErrorResponse(403, 'Forbidden');
    }

    // Check if unit is already occupied
    if (unit.tenancies.length > 0) {
      return createErrorResponse(400, 'Unit is already occupied');
    }

    // Get tenant details
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      include: {
        tenancies: {
          where: { isCurrent: true },
          include: {
            unit: true,
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return createErrorResponse(404, 'Tenant not found');
    }

    // Start a transaction to handle the assignment
    const result = await prisma.$transaction(async (tx) => {
      // If tenant has a current tenancy, end it (transfer scenario)
      const currentTenancy = tenant.tenancies[0];
      if (currentTenancy) {
        await tx.tenancy.update({
          where: { id: currentTenancy.id },
          data: {
            isCurrent: false,
            endDate: new Date(moveInDate),
          },
        });

        // Log the transfer
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'TRANSFER',
            entityType: 'tenancy',
            entityId: currentTenancy.id,
            metadata: {
              fromUnit: currentTenancy.unit.unitNumber,
              toUnit: unit.unitNumber,
              tenantId,
              notes,
            },
          },
        });
      }

      // Create new tenancy
      const newTenancy = await tx.tenancy.create({
        data: {
          userId: tenantId,
          unitId,
          startDate: new Date(moveInDate),
          isCurrent: true,
        },
      });

      // Update any pending unit requests from this tenant
      await tx.unitRequest.updateMany({
        where: {
          userId: tenantId,
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          processedBy: user.id,
          processedAt: new Date(),
          adminNotes: `Assigned to unit ${unit.unitNumber}`,
        },
      });

      // Log the assignment
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'ASSIGN',
          entityType: 'tenancy',
          entityId: newTenancy.id,
          metadata: {
            unitNumber: unit.unitNumber,
            tenantId,
            tenantName: `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || tenant.email,
            moveInDate,
            notes,
          },
        },
      });

      return newTenancy;
    });

    // TODO: Send welcome email/notification to tenant

    return NextResponse.json({
      success: true,
      tenancy: result,
      message: 'Tenant assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning tenant:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return createErrorResponse(500, `Failed to assign tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}