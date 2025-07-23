import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createErrorResponse } from '@/lib/api-middleware';
import { canAccessDocument, canManageDocument } from '@/lib/document-access';
import { z } from 'zod';

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().nullable().optional()
});

// GET /api/documents/[id] - Get document details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const userId = user?.id || null;

    // Get document
    const document = await prisma.document.findUnique({
      where: { id, isActive: true },
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
            name: true,
            address: true
          }
        },
        tenancy: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            unit: {
              select: {
                id: true,
                unitNumber: true
              }
            }
          }
        },
        relatedIssues: {
          include: {
            issue: {
              select: {
                id: true,
                title: true,
                status: true,
                category: true
              }
            }
          }
        },
        relatedCommunications: {
          include: {
            communication: {
              select: {
                id: true,
                subject: true,
                type: true,
                communicationDate: true
              }
            }
          }
        },
        previousVersion: {
          select: {
            id: true,
            title: true,
            version: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            nextVersions: true
          }
        }
      }
    });

    if (!document) {
      return createErrorResponse(404, 'Document not found');
    }

    // Check access permissions
    const canAccess = await canAccessDocument(userId, document);
    if (!canAccess) {
      return createErrorResponse(403, 'You do not have permission to view this document');
    }

    // Update last accessed timestamp
    if (userId) {
      await prisma.document.update({
        where: { id },
        data: { lastAccessedAt: new Date() }
      });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return createErrorResponse(500, 'Failed to fetch document');
  }
}

// PUT /api/documents/[id] - Update document metadata
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id, isActive: true }
    });

    if (!document) {
      return createErrorResponse(404, 'Document not found');
    }

    // Check permissions
    const canManage = await canManageDocument(user.id, document);
    if (!canManage) {
      return createErrorResponse(403, 'You do not have permission to edit this document');
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateDocumentSchema.parse(body);

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: validatedData,
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

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DOCUMENT_UPDATED',
        entityType: 'Document',
        entityId: id,
        metadata: validatedData
      }
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Invalid request data', { errors: error.issues });
    }
    return createErrorResponse(500, 'Failed to update document');
  }
}

// DELETE /api/documents/[id] - Soft delete document
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id, isActive: true }
    });

    if (!document) {
      return createErrorResponse(404, 'Document not found');
    }

    // Check permissions
    const canManage = await canManageDocument(user.id, document);
    if (!canManage) {
      return createErrorResponse(403, 'You do not have permission to delete this document');
    }

    // Soft delete the document
    await prisma.document.update({
      where: { id },
      data: { isActive: false }
    });

    // Note: We keep the file in Vercel Blob for now in case of recovery needs
    // In production, you might want to schedule deletion after a grace period

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DOCUMENT_DELETED',
        entityType: 'Document',
        entityId: id,
        metadata: {
          title: document.title,
          fileUrl: document.fileUrl
        }
      }
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return createErrorResponse(500, 'Failed to delete document');
  }
}