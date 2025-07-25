import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { put } from '@vercel/blob';
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { getAccessibleIssueIds, isUserInBuilding } from '@/lib/api-access-helpers';

// GET /api/issues - Fetch issues based on scope
export const GET = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'my';
    const buildingId = searchParams.get('buildingId');
    
    let issues;
    
    if (scope === 'building') {
      // Building-wide scope
      if (!buildingId) {
        // If no buildingId provided, try to get from user's context
        const userBuilding = user.buildingRoles[0]?.buildingId || 
                            user.tenancies.find(t => t.isCurrent)?.unit.building.id;
        
        if (!userBuilding) {
          return createErrorResponse(400, 'No building context available');
        }
        
        return NextResponse.redirect(new URL(`/api/issues?scope=building&buildingId=${userBuilding}`, req.url));
      }

      // Check if user is in the building
      const userInBuilding = await isUserInBuilding(user.id, buildingId);
      if (!userInBuilding) {
        return createErrorResponse(403, 'You do not have access to this building');
      }

      // Check if user has permission to view all issues
      const canViewAll = await hasPermission(
        user.id, 
        buildingId, 
        PERMISSIONS.VIEW_ALL_ISSUES
      );

      if (canViewAll) {
        // User can see all issues in the building
        issues = await prisma.issue.findMany({
          where: { buildingId },
          include: {
            reporter: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            unit: {
              select: {
                unitNumber: true,
              },
            },
            building: {
              select: {
                name: true,
              },
            },
            media: true,
            _count: {
              select: {
                communications: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      } else {
        // User can only see public issues and their own
        const accessibleIssueIds = await getAccessibleIssueIds(user.id, buildingId);
        
        issues = await prisma.issue.findMany({
          where: {
            id: { in: accessibleIssueIds },
          },
          include: {
            reporter: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            unit: {
              select: {
                unitNumber: true,
              },
            },
            building: {
              select: {
                name: true,
              },
            },
            media: true,
            _count: {
              select: {
                communications: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }

      // Log access for auditing
      console.log(`User ${user.id} accessed building issues for ${buildingId} (canViewAll: ${canViewAll})`);
    } else {
      // 'my' scope - user's own issues
      issues = await prisma.issue.findMany({
        where: {
          reporterId: user.id,
        },
        include: {
          reporter: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          unit: {
            select: {
              unitNumber: true,
            },
          },
          building: {
            select: {
              name: true,
            },
          },
          media: true,
          _count: {
            select: {
              communications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
    
    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return createErrorResponse(500, 'Internal server error');
  }
});

// POST /api/issues - Create a new issue
export const POST = withAuth(async (req: Request) => {
  console.log('=== Issue Creation API Called ===');
  try {
    const user = await getCurrentUser();
    console.log('User found:', user ? `${user.id} (${user.email})` : 'null');
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const formData = await req.formData();
    console.log('FormData received. Keys:', Array.from(formData.keys()));
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const severity = formData.get('severity') as string;
    const location = formData.get('location') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const unitId = formData.get('unitId') as string;
    const buildingId = formData.get('buildingId') as string;
    
    console.log('Extracted form fields:', {
      title, description, category, severity, location, isPublic, unitId, buildingId
    });
    
    // Validate required fields
    if (!title || !description || !category || !severity || !unitId || !buildingId) {
      return createErrorResponse(400, 'Missing required fields', {
        missing: {
          title: !title,
          description: !description,
          category: !category,
          severity: !severity,
          unitId: !unitId,
          buildingId: !buildingId,
        },
      });
    }

    // Verify user has access to this unit/building
    const userInBuilding = await isUserInBuilding(user.id, buildingId);
    
    if (!userInBuilding) {
      return createErrorResponse(403, 'You do not have access to create issues in this building');
    }

    // Additional check: if creating for a specific unit, verify access
    const isOwnUnit = user.tenancies.some(t => t.unitId === unitId && t.isCurrent);
    const canCreateForOthers = await hasPermission(user.id, buildingId, PERMISSIONS.MANAGE_ISSUES);
    
    if (!isOwnUnit && !canCreateForOthers) {
      return createErrorResponse(403, 'You can only create issues for your own unit', {
        required: PERMISSIONS.MANAGE_ISSUES,
      });
    }

    // Handle photo uploads with validation
    const photos = formData.getAll('photos') as File[];
    const mediaUrls: Array<{ url: string; fileName: string; fileSize: number; mimeType: string }> = [];
    
    for (const photo of photos) {
      if (photo.size > 0) {
        // Validate file size (10MB limit)
        if (photo.size > 10 * 1024 * 1024) {
          return createErrorResponse(400, 'Photo size must be less than 10MB', {
            fileName: photo.name,
            fileSize: photo.size,
          });
        }
        
        // Validate file type
        if (!photo.type.startsWith('image/')) {
          return createErrorResponse(400, 'Only image files are allowed', {
            fileName: photo.name,
            fileType: photo.type,
          });
        }
        
        const blob = await put(`issues/${Date.now()}-${photo.name}`, photo, {
          access: 'public',
        });
        
        mediaUrls.push({
          url: blob.url,
          fileName: photo.name,
          fileSize: photo.size,
          mimeType: photo.type,
        });
      }
    }

    // Create issue
    console.log('Creating issue with data:', {
      title,
      description,
      category,
      severity: severity.toUpperCase(),
      location,
      isPublic,
      reporterId: user.id,
      unitId,
      buildingId,
      mediaCount: mediaUrls.length
    });
    
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        category: category,
        severity: severity.toUpperCase() as 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW',
        location,
        isPublic,
        reporterId: user.id,
        unitId,
        buildingId,
        status: 'OPEN',
        media: {
          create: mediaUrls.map((media) => ({
            url: media.url,
            type: 'IMAGE',
            fileName: media.fileName,
            fileSize: media.fileSize,
            mimeType: media.mimeType,
            uploadedBy: user.id,
          })),
        },
      },
      include: {
        media: true,
        unit: {
          select: {
            unitNumber: true,
          },
        },
        building: {
          select: {
            name: true,
          },
        },
      },
    });

    // Log issue creation for auditing
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_ISSUE',
        entityType: 'Issue',
        entityId: issue.id,
        metadata: {
          title: issue.title,
          category: issue.category,
          severity: issue.severity,
          isPublic: issue.isPublic,
          unitId: issue.unitId,
          buildingId: issue.buildingId,
        },
      },
    });

    console.log(`User ${user.id} created issue ${issue.id} in building ${buildingId}`);

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Error creating issue:', error);
    return createErrorResponse(500, 'Internal server error');
  }
});