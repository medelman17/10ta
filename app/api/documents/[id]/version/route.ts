import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createErrorResponse } from '@/lib/api-middleware';
import { canManageDocument } from '@/lib/document-access';
import { put } from '@vercel/blob';

// POST /api/documents/[id]/version - Upload new version of document
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Get current document
    const currentDocument = await prisma.document.findUnique({
      where: { id, isActive: true }
    });

    if (!currentDocument) {
      return createErrorResponse(404, 'Document not found');
    }

    // Check permissions
    const canManage = await canManageDocument(user.id, currentDocument);
    if (!canManage) {
      return createErrorResponse(403, 'You do not have permission to update this document');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const changeNotes = formData.get('changeNotes') as string | null;
    
    if (!file) {
      return createErrorResponse(400, 'No file provided');
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return createErrorResponse(400, 'File size exceeds 10MB limit');
    }

    // Upload new file to Vercel Blob
    const filename = `documents/${currentDocument.buildingId}/${Date.now()}-v${currentDocument.version + 1}-${file.name}`;
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true
    });

    // Create new document version
    const newDocument = await prisma.document.create({
      data: {
        // Copy most fields from current document
        title: currentDocument.title,
        description: changeNotes || currentDocument.description,
        category: currentDocument.category,
        visibility: currentDocument.visibility,
        tags: currentDocument.tags,
        folderId: currentDocument.folderId,
        buildingId: currentDocument.buildingId,
        uploadedBy: user.id, // New uploader
        tenancyId: currentDocument.tenancyId,
        
        // New file info
        fileUrl: blob.url,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        
        // Version info
        version: currentDocument.version + 1,
        previousVersionId: currentDocument.id
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
        },
        previousVersion: {
          select: {
            id: true,
            version: true,
            title: true
          }
        }
      }
    });

    // Copy document relationships to new version
    const [issueRelations, communicationRelations] = await Promise.all([
      prisma.issueDocument.findMany({
        where: { documentId: currentDocument.id }
      }),
      prisma.communicationDocument.findMany({
        where: { documentId: currentDocument.id }
      })
    ]);

    // Create new relationships for the new version
    if (issueRelations.length > 0) {
      await prisma.issueDocument.createMany({
        data: issueRelations.map(rel => ({
          issueId: rel.issueId,
          documentId: newDocument.id,
          addedBy: user.id,
          addedAt: new Date()
        }))
      });
    }

    if (communicationRelations.length > 0) {
      await prisma.communicationDocument.createMany({
        data: communicationRelations.map(rel => ({
          communicationId: rel.communicationId,
          documentId: newDocument.id,
          addedBy: user.id,
          addedAt: new Date()
        }))
      });
    }

    // Mark old version as inactive (optional - you might want to keep old versions active)
    // await prisma.document.update({
    //   where: { id: currentDocument.id },
    //   data: { isActive: false }
    // });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DOCUMENT_VERSION_CREATED',
        entityType: 'Document',
        entityId: newDocument.id,
        metadata: {
          previousVersion: currentDocument.version,
          newVersion: newDocument.version,
          previousDocumentId: currentDocument.id,
          changeNotes
        }
      }
    });

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('Error creating document version:', error);
    return createErrorResponse(500, 'Failed to create document version');
  }
}