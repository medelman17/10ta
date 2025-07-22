import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface IssueStatistics {
  overview: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    averageResolutionTime: number; // in days
  };
  byCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  bySeverity: Array<{
    severity: string;
    count: number;
    percentage: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  timeline: Array<{
    date: string;
    newIssues: number;
    resolvedIssues: number;
  }>;
  resolutionTimes: {
    emergency: number;
    high: number;
    medium: number;
    low: number;
  };
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const timeRange = searchParams.get('timeRange') || '30d';

    // Get user's building if not specified
    let targetBuildingId = buildingId;
    if (!targetBuildingId) {
      const currentTenancy = user.tenancies.find(t => t.isCurrent);
      if (!currentTenancy) {
        return new NextResponse('No building association found', { status: 400 });
      }
      targetBuildingId = currentTenancy.unit.buildingId;
    }

    // Verify user has access to this building
    const hasAccess = user.buildingRoles.some(br => br.buildingId === targetBuildingId) ||
                     user.tenancies.some(t => t.unit.buildingId === targetBuildingId);
    
    if (!hasAccess) {
      return new NextResponse('Access denied', { status: 403 });
    }

    // Calculate date filter
    const dateFilter = getDateFilter(timeRange);

    // Build base query
    const baseWhere: {
      buildingId: string;
      isPublic: boolean;
      createdAt?: { gte: Date };
    } = {
      buildingId: targetBuildingId,
      isPublic: true,
    };

    if (dateFilter) {
      baseWhere.createdAt = { gte: dateFilter };
    }

    // Get all issues
    const issues = await prisma.issue.findMany({
      where: baseWhere,
      select: {
        id: true,
        category: true,
        severity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate overview stats
    const overview = {
      total: issues.length,
      open: issues.filter(i => i.status === 'OPEN').length,
      inProgress: issues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'AWAITING_LANDLORD').length,
      resolved: issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length,
      averageResolutionTime: 0,
    };

    // Calculate average resolution time
    const resolvedIssues = issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED');
    if (resolvedIssues.length > 0) {
      const totalResolutionTime = resolvedIssues.reduce((acc, issue) => {
        const createdAt = new Date(issue.createdAt).getTime();
        const resolvedAt = new Date(issue.updatedAt).getTime();
        return acc + (resolvedAt - createdAt);
      }, 0);
      overview.averageResolutionTime = Math.round(totalResolutionTime / resolvedIssues.length / (1000 * 60 * 60 * 24)); // Convert to days
    }

    // Group by category
    const categoryMap: Record<string, number> = {};
    issues.forEach(issue => {
      categoryMap[issue.category] = (categoryMap[issue.category] || 0) + 1;
    });
    
    const byCategory = Object.entries(categoryMap)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / issues.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Group by severity
    const severityMap: Record<string, number> = {};
    issues.forEach(issue => {
      severityMap[issue.severity] = (severityMap[issue.severity] || 0) + 1;
    });
    
    const bySeverity = Object.entries(severityMap)
      .map(([severity, count]) => ({
        severity,
        count,
        percentage: Math.round((count / issues.length) * 100),
      }))
      .sort((a, b) => {
        const order = ['EMERGENCY', 'HIGH', 'MEDIUM', 'LOW'];
        return order.indexOf(a.severity) - order.indexOf(b.severity);
      });

    // Group by status
    const statusMap: Record<string, number> = {};
    issues.forEach(issue => {
      statusMap[issue.status] = (statusMap[issue.status] || 0) + 1;
    });
    
    const byStatus = Object.entries(statusMap)
      .map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / issues.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Create timeline data
    const timeline = createTimelineData(issues, timeRange);

    // Calculate resolution times by severity
    const resolutionTimes = {
      emergency: calculateAverageResolutionTime(resolvedIssues.filter(i => i.severity === 'EMERGENCY')),
      high: calculateAverageResolutionTime(resolvedIssues.filter(i => i.severity === 'HIGH')),
      medium: calculateAverageResolutionTime(resolvedIssues.filter(i => i.severity === 'MEDIUM')),
      low: calculateAverageResolutionTime(resolvedIssues.filter(i => i.severity === 'LOW')),
    };

    const statistics: IssueStatistics = {
      overview,
      byCategory,
      bySeverity,
      byStatus,
      timeline,
      resolutionTimes,
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Statistics error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

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

function createTimelineData(issues: Array<{ 
  id: string;
  category: string;
  severity: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}>, timeRange: string) {
  const timeline: Array<{ date: string; newIssues: number; resolvedIssues: number }> = [];
  const now = new Date();
  let days = 30;
  
  switch (timeRange) {
    case '7d':
      days = 7;
      break;
    case '30d':
      days = 30;
      break;
    case '90d':
      days = 90;
      break;
    case '1y':
      days = 365;
      break;
  }

  // Create date buckets
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
      date: date.toISOString().split('T')[0],
      newIssues,
      resolvedIssues,
    });
  }
  
  return timeline;
}

function calculateAverageResolutionTime(issues: Array<{
  id: string;
  category: string;
  severity: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}>): number {
  if (issues.length === 0) return 0;
  
  const totalTime = issues.reduce((acc, issue) => {
    const createdAt = new Date(issue.createdAt).getTime();
    const resolvedAt = new Date(issue.updatedAt).getTime();
    return acc + (resolvedAt - createdAt);
  }, 0);
  
  return Math.round(totalTime / issues.length / (1000 * 60 * 60 * 24)); // Convert to days
}