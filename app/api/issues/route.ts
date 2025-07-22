import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'my'; // 'my' or 'building'
    
    let issues;
    
    if (scope === 'building') {
      // Get building-wide issues for current user's building
      const userBuildings = user.buildingRoles.map(br => br.buildingId);
      
      issues = await prisma.issue.findMany({
        where: {
          buildingId: { in: userBuildings },
          isPublic: true, // Only show public issues for building view
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
    } else {
      // Get user's own issues
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
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
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
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Verify user has access to this unit/building
    const hasAccess = user.buildingRoles.some(br => br.buildingId === buildingId) ||
                     user.tenancies.some(t => t.unitId === unitId && t.isCurrent);
    
    if (!hasAccess) {
      return new NextResponse('Access denied', { status: 403 });
    }

    // Handle photo uploads
    const photos = formData.getAll('photos') as File[];
    const mediaUrls: string[] = [];
    
    for (const photo of photos) {
      if (photo.size > 0) {
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
          create: mediaUrls.map(url => ({
            url,
            type: 'IMAGE',
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

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Error creating issue:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}