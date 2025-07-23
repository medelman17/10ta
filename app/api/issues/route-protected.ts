// This is an example of how to update the issues endpoint with proper permission checks
// This file shows the pattern - we'll apply it to the actual route.ts file

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { put } from '@vercel/blob';
import { withAuth, withPermission, createErrorResponse } from '@/lib/api-middleware';
import { PERMISSIONS } from '@/lib/permissions';
import { canAccessIssue, getAccessibleIssueIds } from '@/lib/api-access-helpers';

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
      // Building-wide scope requires permission or building membership
      if (!buildingId) {
        return createErrorResponse(400, 'Building ID required for building scope');
      }

      // Check if user has permission to view all issues
      const hasViewAllPermission = await hasPermission(
        user.id, 
        buildingId, 
        PERMISSIONS.VIEW_ALL_ISSUES
      );

      if (hasViewAllPermission) {
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
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }
    } else {
      // 'my' scope - user's own issues
      issues = await prisma.issue.findMany({
        where: {
          reporterId: user.id,
        },
        include: {
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
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const severity = formData.get('severity') as string;
    const location = formData.get('location') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const unitId = formData.get('unitId') as string;
    const buildingId = formData.get('buildingId') as string;
    
    // Validate required fields
    if (!title || !description || !category || !severity || !unitId || !buildingId) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // Verify user has access to this unit/building
    const hasAccess = user.buildingRoles.some(br => br.buildingId === buildingId) ||
                     user.tenancies.some(t => t.unitId === unitId && t.isCurrent);
    
    if (!hasAccess) {
      return createErrorResponse(403, 'You do not have access to create issues for this unit');
    }

    // Handle photo uploads
    const photos = formData.getAll('photos') as File[];
    const mediaUrls: string[] = [];
    
    for (const photo of photos) {
      if (photo.size > 0) {
        // Add file size validation
        if (photo.size > 10 * 1024 * 1024) { // 10MB limit
          return createErrorResponse(400, 'Photo size must be less than 10MB');
        }
        
        const blob = await put(`issues/${Date.now()}-${photo.name}`, photo, {
          access: 'public',
        });
        mediaUrls.push(blob.url);
      }
    }

    // Create issue
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        category: category as 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'STRUCTURAL' | 'PEST' | 'SAFETY' | 'NOISE' | 'OTHER',
        severity: severity as 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW',
        location,
        isPublic,
        reporterId: user.id,
        unitId,
        buildingId,
        status: 'OPEN',
        media: {
          create: mediaUrls.map((url, index) => ({
            url,
            type: 'IMAGE',
            fileName: photos[index]?.name || 'image.jpg',
            fileSize: photos[index]?.size || 0,
            mimeType: photos[index]?.type || 'image/jpeg',
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

    // Log issue creation
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
        },
      },
    });

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Error creating issue:', error);
    return createErrorResponse(500, 'Internal server error');
  }
});