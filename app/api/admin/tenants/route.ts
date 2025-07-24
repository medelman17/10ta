import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createErrorResponse } from '@/lib/api-middleware';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const buildingId = searchParams.get('buildingId');

    // Check if user is superuser or has admin access
    const isSuperUser = process.env.NEXT_PUBLIC_SUPER_USER_EMAILS?.split(',').includes(user.email);
    
    if (!isSuperUser && !buildingId) {
      return createErrorResponse(403, 'Building ID required for non-superusers');
    }

    // Build where clause
    const where: {
      role: Role;
      buildingId?: string;
      user?: {
        OR?: Array<{
          firstName?: { contains: string; mode: 'insensitive' };
          lastName?: { contains: string; mode: 'insensitive' };
          email?: { contains: string; mode: 'insensitive' };
          phone?: { contains: string; mode: 'insensitive' };
        }>;
      };
    } = {
      role: Role.TENANT
    };

    if (buildingId) {
      where.buildingId = buildingId;
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Get total count
    const total = await prisma.buildingRole.count({ where });

    // Get tenants with pagination
    const tenantRoles = await prisma.buildingRole.findMany({
      where,
      include: {
        user: {
          include: {
            tenancies: {
              where: {
                isCurrent: true
              },
              include: {
                unit: true
              }
            }
          }
        },
        building: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { user: { lastName: 'asc' } },
        { user: { firstName: 'asc' } }
      ]
    });

    // Transform data
    const tenants = tenantRoles.map(role => ({
      id: role.user.id,
      email: role.user.email,
      firstName: role.user.firstName,
      lastName: role.user.lastName,
      phone: role.user.phone,
      shareContactInfo: role.user.shareContactInfo,
      allowNeighborMessages: role.user.allowNeighborMessages,
      publicIssuesByDefault: role.user.publicIssuesByDefault,
      building: {
        id: role.building.id,
        name: role.building.name
      },
      currentUnit: role.user.tenancies[0]?.unit || null,
      joinedAt: role.createdAt
    }));

    return NextResponse.json({
      tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return createErrorResponse(500, 'Failed to fetch tenants');
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Only superusers can manually create tenants
    const isSuperUser = process.env.NEXT_PUBLIC_SUPER_USER_EMAILS?.split(',').includes(user.email);
    
    if (!isSuperUser) {
      return createErrorResponse(403, 'Only platform administrators can manually create tenants');
    }

    const body = await req.json();
    const { email, firstName, lastName, phone, buildingId, unitId } = body;

    if (!email || !buildingId) {
      return createErrorResponse(400, 'Email and building ID are required');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return createErrorResponse(400, 'User with this email already exists');
    }

    // Create user and assign to building/unit in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          clerkId: `manual_${Date.now()}`, // Placeholder for manual creation
          email,
          firstName,
          lastName,
          phone
        }
      });

      // Create building role
      await tx.buildingRole.create({
        data: {
          userId: newUser.id,
          buildingId,
          role: Role.TENANT
        }
      });

      // If unit is provided, create tenancy
      if (unitId) {
        await tx.tenancy.create({
          data: {
            userId: newUser.id,
            unitId,
            startDate: new Date(),
            isCurrent: true
          }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entityType: 'user',
          entityId: newUser.id,
          metadata: {
            email,
            buildingId,
            unitId,
            createdManually: true
          }
        }
      });

      return newUser;
    });

    return NextResponse.json({
      tenant: result,
      message: 'Tenant created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return createErrorResponse(500, 'Failed to create tenant');
  }
}