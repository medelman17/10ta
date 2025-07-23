import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { getUserBuildingId, canUploadToBuilding } from '@/lib/document-access';
import { DocumentVisibility, Prisma } from '@prisma/client';
import { z } from 'zod';

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  visibility: z.nativeEnum(DocumentVisibility),
  buildingId: z.string().optional()
});

// GET /api/document-folders - List folders
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const parentId = searchParams.get('parentId');

    // Build where clause based on user access
    const whereClause: Prisma.DocumentFolderWhereInput = {};

    if (!userId) {
      // Unauthenticated users can only see public folders
      whereClause.visibility = 'PUBLIC';
    } else {
      // Get user's building
      const userBuildingId = await getUserBuildingId(userId);
      
      // Show folders user has access to
      const orConditions: Prisma.DocumentFolderWhereInput[] = [
        { visibility: 'PUBLIC' as DocumentVisibility }
      ];
      
      if (userBuildingId) {
        orConditions.push({
          AND: [
            { visibility: 'BUILDING_TENANTS' as DocumentVisibility },
            { buildingId: userBuildingId }
          ]
        });
      }
      
      whereClause.OR = orConditions;
    }

    // Filter by building if specified
    if (buildingId) {
      whereClause.buildingId = buildingId;
    }

    // Filter by parent folder
    if (parentId === 'root') {
      whereClause.parentId = null;
    } else if (parentId) {
      whereClause.parentId = parentId;
    }

    // Get folders with document count
    const folders = await prisma.documentFolder.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            documents: true,
            children: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return createErrorResponse(500, 'Failed to fetch folders');
  }
}

// POST /api/document-folders - Create new folder
export const POST = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const body = await req.json();
    const validatedData = createFolderSchema.parse(body);

    // Determine building ID
    let targetBuildingId = validatedData.buildingId;
    if (!targetBuildingId) {
      const userBuildingId = await getUserBuildingId(user.id);
      if (!userBuildingId) {
        return createErrorResponse(400, 'No building associated with user');
      }
      targetBuildingId = userBuildingId;
    }

    // Check permissions
    const canCreate = await canUploadToBuilding(user.id, targetBuildingId);
    if (!canCreate) {
      return createErrorResponse(403, 'You do not have permission to create folders in this building');
    }

    // Validate parent folder if specified
    if (validatedData.parentId) {
      const parentFolder = await prisma.documentFolder.findUnique({
        where: { id: validatedData.parentId }
      });

      if (!parentFolder) {
        return createErrorResponse(400, 'Parent folder not found');
      }

      if (parentFolder.buildingId !== targetBuildingId) {
        return createErrorResponse(400, 'Parent folder is in a different building');
      }
    }

    // Create folder
    const folder = await prisma.documentFolder.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        parentId: validatedData.parentId,
        visibility: validatedData.visibility,
        buildingId: targetBuildingId
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FOLDER_CREATED',
        entityType: 'DocumentFolder',
        entityId: folder.id,
        metadata: {
          name: folder.name,
          visibility: folder.visibility,
          buildingId: targetBuildingId
        }
      }
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Invalid request data', { errors: error.issues });
    }
    return createErrorResponse(500, 'Failed to create folder');
  }
});