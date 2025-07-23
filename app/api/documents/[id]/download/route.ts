import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessDocument } from '@/lib/document-access';
import { createErrorResponse } from '@/lib/api-middleware';

// GET /api/documents/[id]/download - Download document with tracking
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
      where: { id, isActive: true }
    });

    if (!document) {
      return createErrorResponse(404, 'Document not found');
    }

    // Check access permissions
    const canAccess = await canAccessDocument(userId, document);
    if (!canAccess) {
      return createErrorResponse(403, 'You do not have permission to download this document');
    }

    // Update download count and last accessed
    await prisma.document.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    });

    // Log document access
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'DOCUMENT_DOWNLOADED',
          entityType: 'Document',
          entityId: id,
          metadata: {
            fileName: document.fileName,
            fileSize: document.fileSize
          }
        }
      });
    }

    // Fetch the file from Vercel Blob
    const response = await fetch(document.fileUrl);
    if (!response.ok) {
      return createErrorResponse(500, 'Failed to fetch document from storage');
    }

    // Get the file blob
    const blob = await response.blob();

    // Return the file with appropriate headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': document.fileType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
        'Content-Length': document.fileSize.toString(),
        'Cache-Control': 'private, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return createErrorResponse(500, 'Failed to download document');
  }
}