import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { IssueCategory, IssueSeverity, IssueStatus } from '@prisma/client';
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { isUserInBuilding } from '@/lib/api-access-helpers';

export const GET = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Get user's building if not specified
    let targetBuildingId = buildingId;
    if (!targetBuildingId) {
      const currentTenancy = user.tenancies.find(t => t.isCurrent);
      if (!currentTenancy) {
        return createErrorResponse(400, 'No building association found');
      }
      targetBuildingId = currentTenancy.unit.buildingId;
    }

    // Verify user is in the building
    const userInBuilding = await isUserInBuilding(user.id, targetBuildingId);
    if (!userInBuilding) {
      return createErrorResponse(403, 'You do not have access to this building');
    }

    // Check if user has permission to view building analytics
    const canViewAnalytics = await hasPermission(
      user.id,
      targetBuildingId,
      PERMISSIONS.VIEW_BUILDING_ANALYTICS
    );

    if (!canViewAnalytics) {
      return createErrorResponse(403, 'You do not have permission to view building analytics');
    }

    // Calculate date filter
    const dateFilter = getDateFilter(timeRange);

    // Build query filters
    type BaseFilters = {
      buildingId: string;
      isPublic: boolean;
      createdAt?: { gte: Date };
    };
    
    const baseFilters: BaseFilters = {
      buildingId: targetBuildingId,
      isPublic: true,
    };

    if (dateFilter) {
      baseFilters.createdAt = { gte: dateFilter };
    }

    // Get all issues for statistics
    const allIssues = await prisma.issue.findMany({
      where: baseFilters,
      include: {
        unit: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate overview statistics
    const totalIssues = allIssues.length;
    const openIssues = allIssues.filter(i => 
      i.status === 'OPEN' || i.status === 'IN_PROGRESS' || i.status === 'AWAITING_LANDLORD'
    ).length;
    const inProgressIssues = allIssues.filter(i => i.status === 'IN_PROGRESS').length;
    const resolvedIssues = allIssues.filter(i => 
      i.status === 'RESOLVED' || i.status === 'CLOSED'
    ).length;

    // Calculate average resolution time for resolved issues
    const resolvedWithTime = allIssues.filter(i => 
      (i.status === 'RESOLVED' || i.status === 'CLOSED') && i.updatedAt
    );
    const averageResolutionTime = resolvedWithTime.length > 0
      ? Math.round(
          resolvedWithTime.reduce((sum, issue) => {
            const createdTime = new Date(issue.createdAt).getTime();
            const resolvedTime = new Date(issue.updatedAt).getTime();
            const daysToResolve = (resolvedTime - createdTime) / (1000 * 60 * 60 * 24);
            return sum + daysToResolve;
          }, 0) / resolvedWithTime.length
        )
      : 0;

    // Category distribution
    const categoryCount: Record<string, number> = {};
    allIssues.forEach(issue => {
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
    });
    const byCategory = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalIssues) * 100) || 0,
    })).sort((a, b) => b.count - a.count);

    // Severity distribution
    const severityCount: Record<string, number> = {};
    allIssues.forEach(issue => {
      severityCount[issue.severity] = (severityCount[issue.severity] || 0) + 1;
    });
    const bySeverity = Object.entries(severityCount).map(([severity, count]) => ({
      severity,
      count,
      percentage: Math.round((count / totalIssues) * 100) || 0,
    }));

    // Status distribution
    const statusCount: Record<string, number> = {};
    allIssues.forEach(issue => {
      statusCount[issue.status] = (statusCount[issue.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalIssues) * 100) || 0,
    }));

    // Timeline data (issues over time)
    const timeline = generateTimelineData(allIssues, timeRange);

    // Resolution times by severity
    const resolutionBySeverity = {
      emergency: calculateAvgResolutionBySeverity(allIssues, 'EMERGENCY'),
      high: calculateAvgResolutionBySeverity(allIssues, 'HIGH'),
      medium: calculateAvgResolutionBySeverity(allIssues, 'MEDIUM'),
      low: calculateAvgResolutionBySeverity(allIssues, 'LOW'),
    };

    const statistics = {
      overview: {
        total: totalIssues,
        open: openIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues,
        averageResolutionTime,
      },
      byCategory,
      bySeverity,
      byStatus,
      timeline,
      resolutionTimes: resolutionBySeverity,
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Statistics error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
});

function getDateFilter(timeRange: string): Date | null {
  const now = new Date();
  
  switch (timeRange) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

interface IssueWithUnit {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: IssueStatus;
  severity: IssueSeverity;
  category: IssueCategory;
  unit: {
    unitNumber: string;
  };
}

function generateTimelineData(issues: IssueWithUnit[], timeRange: string) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const timeline = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const newIssues = issues.filter(issue => {
      const createdAt = new Date(issue.createdAt);
      return createdAt >= date && createdAt < nextDate;
    }).length;

    const resolvedIssues = issues.filter(issue => {
      if (issue.status !== 'RESOLVED' && issue.status !== 'CLOSED') return false;
      const updatedAt = new Date(issue.updatedAt);
      return updatedAt >= date && updatedAt < nextDate;
    }).length;

    timeline.push({
      date: date.toISOString(),
      newIssues,
      resolvedIssues,
    });
  }

  return timeline;
}

function calculateAvgResolutionBySeverity(issues: IssueWithUnit[], severity: string): number {
  const resolvedIssues = issues.filter(i => 
    i.severity === severity && 
    (i.status === 'RESOLVED' || i.status === 'CLOSED') && 
    i.updatedAt
  );

  if (resolvedIssues.length === 0) return 0;

  const totalDays = resolvedIssues.reduce((sum, issue) => {
    const createdTime = new Date(issue.createdAt).getTime();
    const resolvedTime = new Date(issue.updatedAt).getTime();
    const daysToResolve = (resolvedTime - createdTime) / (1000 * 60 * 60 * 24);
    return sum + daysToResolve;
  }, 0);

  return Math.round(totalDays / resolvedIssues.length);
}