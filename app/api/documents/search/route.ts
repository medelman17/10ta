import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getDocumentAccessFilter } from '@/lib/document-access';
import { createErrorResponse } from '@/lib/api-middleware';
import { DocumentCategory, Prisma } from '@prisma/client';

// GET /api/documents/search - Advanced document search
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const categories = searchParams.getAll('category') as DocumentCategory[];
    const uploadedBy = searchParams.get('uploadedBy');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const hasIssues = searchParams.get('hasIssues') === 'true';
    const hasCommunications = searchParams.get('hasCommunications') === 'true';
    const minSize = searchParams.get('minSize');
    const maxSize = searchParams.get('maxSize');
    const fileTypes = searchParams.getAll('fileType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause with access control
    const accessFilter = await getDocumentAccessFilter(userId);
    const whereClause: Prisma.DocumentWhereInput = {
      ...accessFilter,
      isActive: true
    };

    // Text search across multiple fields
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { fileName: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ];
    }

    // Category filter
    if (categories.length > 0) {
      whereClause.category = { in: categories };
    }

    // Uploader filter
    if (uploadedBy) {
      whereClause.uploadedBy = uploadedBy;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo);
      }
    }

    // File size filter
    if (minSize || maxSize) {
      whereClause.fileSize = {};
      if (minSize) {
        whereClause.fileSize.gte = parseInt(minSize);
      }
      if (maxSize) {
        whereClause.fileSize.lte = parseInt(maxSize);
      }
    }

    // File type filter
    if (fileTypes.length > 0) {
      whereClause.fileType = { in: fileTypes };
    }

    // Relationship filters
    if (hasIssues) {
      whereClause.relatedIssues = { some: {} };
    }
    if (hasCommunications) {
      whereClause.relatedCommunications = { some: {} };
    }

    // Get total count
    const totalCount = await prisma.document.count({ where: whereClause });

    // Get documents with pagination and relationships
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
      orderBy: [
        { downloadCount: 'desc' }, // Popular documents first
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // Get aggregated stats for the search results
    const stats = await prisma.document.aggregate({
      where: whereClause,
      _sum: {
        fileSize: true,
        downloadCount: true
      },
      _avg: {
        fileSize: true
      }
    });

    // Get category distribution
    const categoryDistribution = await prisma.document.groupBy({
      by: ['category'],
      where: whereClause,
      _count: true
    });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalSize: stats._sum.fileSize || 0,
        totalDownloads: stats._sum.downloadCount || 0,
        averageSize: Math.round(stats._avg.fileSize || 0),
        categoryDistribution: categoryDistribution.map(cat => ({
          category: cat.category,
          count: cat._count
        }))
      }
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    return createErrorResponse(500, 'Failed to search documents');
  }
}