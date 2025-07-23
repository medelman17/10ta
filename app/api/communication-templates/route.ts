import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { TemplateCategory } from '@prisma/client';
import { isUserInBuilding } from '@/lib/api-access-helpers';

// GET /api/communication-templates
export const GET = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { searchParams } = new URL(req.url) ;
    const category = searchParams.get('category') as TemplateCategory | null;
    const buildingId = searchParams.get('buildingId');
    const includeBuiltIn = searchParams.get('includeBuiltIn') !== 'false'; // default true
    
    // Get building ID from user context if not provided
    let targetBuildingId = buildingId;
    if (!targetBuildingId) {
      const currentTenancy = user.tenancies.find(t => t.isCurrent);
      if (!currentTenancy) {
        return createErrorResponse(400, 'No building association found');
      }
      targetBuildingId = currentTenancy.unit.buildingId;
    }

    // Verify user is in the building (if building-specific templates are requested)
    if (targetBuildingId) {
      const userInBuilding = await isUserInBuilding(user.id, targetBuildingId);
      if (!userInBuilding) {
        return createErrorResponse(403, 'You do not have access to this building');
      }
    }

    // Build the where clause
    const whereClause: {
      isActive: boolean;
      category?: TemplateCategory;
      AND: Array<{
        OR: Array<{ isBuiltIn: boolean; buildingId: null } | { buildingId: string }>;
      }>;
    } = {
      isActive: true,
      AND: [
        // Include built-in templates and/or building-specific templates
        {
          OR: [
            ...(includeBuiltIn ? [{ isBuiltIn: true, buildingId: null }] : []),
            ...(targetBuildingId ? [{ buildingId: targetBuildingId }] : [])
          ]
        }
      ]
    };

    // Add category filter if specified
    if (category) {
      whereClause.category = category;
    }

    const templates = await prisma.communicationTemplate.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        building: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: [
        { isBuiltIn: 'desc' }, // Built-in templates first
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching communication templates:', error);
    return createErrorResponse(500, 'Internal server error');
  }
});

// POST /api/communication-templates - Create custom template
export const POST = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const body = await req.json();
    const { 
      name, 
      category, 
      description, 
      subject, 
      content, 
      placeholders = [], 
      buildingId 
    } = body;

    // Validate required fields
    if (!name || !category || !subject || !content) {
      return createErrorResponse(400, 'Missing required fields: name, category, subject, content');
    }

    // Validate category
    if (!Object.values(TemplateCategory).includes(category)) {
      return createErrorResponse(400, 'Invalid template category');
    }

    // If building-specific, verify user has access
    if (buildingId) {
      const userInBuilding = await isUserInBuilding(user.id, buildingId);
      if (!userInBuilding) {
        return createErrorResponse(403, 'You do not have access to this building');
      }
    }

    const template = await prisma.communicationTemplate.create({
      data: {
        name,
        category,
        description,
        subject,
        content,
        placeholders,
        buildingId: buildingId || null,
        createdBy: user.id,
        isBuiltIn: false, // User-created templates are never built-in
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        building: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating communication template:', error);
    return createErrorResponse(500, 'Internal server error');
  }
});