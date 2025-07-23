import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { getDocumentAccessFilter, canUploadToBuilding, getUserBuildingId } from '@/lib/document-access';
import { put } from '@vercel/blob';
import { DocumentCategory, DocumentVisibility, Prisma } from '@prisma/client';

// GET /api/documents - List documents with visibility filtering
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category') as DocumentCategory | null;
    const visibility = searchParams.get('visibility') as DocumentVisibility | null;
    const tags = searchParams.getAll('tags');
    const folderId = searchParams.get('folderId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause with access control
    const accessFilter = await getDocumentAccessFilter(userId);
    const whereClause: Prisma.DocumentWhereInput = {
      ...accessFilter,
      isActive: true
    };

    // Add filters
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (visibility && userId) {
      // Only authenticated users can filter by visibility
      whereClause.visibility = visibility;
    }

    if (tags.length > 0) {
      whereClause.tags = { hasSome: tags };
    }

    if (folderId) {
      whereClause.folderId = folderId;
    }

    // Get total count
    const totalCount = await prisma.document.count({ where: whereClause });

    // Get documents with pagination
    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        folder: true,
        building: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            relatedIssues: true,
            relatedCommunications: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder as 'asc' | 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return createErrorResponse(500, 'Failed to fetch documents');
  }
}

// POST /api/documents - Upload new document
export const POST = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return createErrorResponse(400, 'No file provided');
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return createErrorResponse(400, 'File size exceeds 10MB limit');
    }

    // Parse other form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const category = formData.get('category') as DocumentCategory;
    const visibility = formData.get('visibility') as DocumentVisibility;
    const tags = formData.getAll('tags') as string[];
    const folderId = formData.get('folderId') as string | null;
    const buildingId = formData.get('buildingId') as string | null;
    const issueId = formData.get('issueId') as string | null;
    const communicationId = formData.get('communicationId') as string | null;

    // Validate required fields
    if (!title || !category || !visibility) {
      return createErrorResponse(400, 'Missing required fields: title, category, visibility');
    }

    // Determine building ID
    let targetBuildingId = buildingId;
    if (!targetBuildingId) {
      targetBuildingId = await getUserBuildingId(user.id);
      if (!targetBuildingId) {
        return createErrorResponse(400, 'No building associated with user');
      }
    }

    // Check upload permissions
    const canUpload = await canUploadToBuilding(user.id, targetBuildingId);
    if (!canUpload) {
      return createErrorResponse(403, 'You do not have permission to upload documents to this building');
    }

    // Determine tenancy ID for TENANT_ONLY documents
    let tenancyId: string | null = null;
    if (visibility === 'TENANT_ONLY') {
      const currentTenancy = user.tenancies.find(t => t.isCurrent);
      if (!currentTenancy) {
        return createErrorResponse(400, 'No current tenancy found for TENANT_ONLY document');
      }
      tenancyId = currentTenancy.id;
    }

    // Upload file to Vercel Blob
    const filename = `documents/${targetBuildingId}/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true
    });

    // Create document record
    const document = await prisma.document.create({
      data: {
        title,
        description,
        category,
        visibility,
        tags,
        folderId,
        buildingId: targetBuildingId,
        uploadedBy: user.id,
        tenancyId,
        fileUrl: blob.url,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        building: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Link to issue if provided
    if (issueId) {
      await prisma.issueDocument.create({
        data: {
          issueId,
          documentId: document.id,
          addedBy: user.id
        }
      });
    }

    // Link to communication if provided
    if (communicationId) {
      await prisma.communicationDocument.create({
        data: {
          communicationId,
          documentId: document.id,
          addedBy: user.id
        }
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'Document',
        entityId: document.id,
        metadata: {
          title,
          category,
          visibility,
          fileSize: file.size,
          buildingId: targetBuildingId
        }
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return createErrorResponse(500, 'Failed to upload document');
  }
});