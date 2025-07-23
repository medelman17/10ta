import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { IssueCategory, IssueSeverity, IssueStatus } from '@prisma/client';
import { withAuth, createErrorResponse } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { isUserInBuilding } from '@/lib/api-access-helpers';

interface HeatMapData {
  buildingId: string;
  buildingName: string;
  floors: number;
  unitsPerFloor: number;
  units: {
    [unitNumber: string]: {
      unitId: string;
      floor: number;
      line: string;
      totalIssues: number;
      openIssues: number;
      severityScore: number;
      categories: Record<string, number>;
      lastReportedAt?: Date;
    };
  };
  summary: {
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    averageSeverityScore: number;
    topCategories: Array<{ category: string; count: number }>;
    mostAffectedUnits: Array<{ unitNumber: string; issueCount: number }>;
  };
}

// Severity weights for calculating heat map intensity
const SEVERITY_WEIGHTS = {
  EMERGENCY: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export const GET = withAuth(async (req: Request) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const timeRange = searchParams.get('timeRange') || '30d'; // Default 30 days
    const categories = searchParams.getAll('category');
    const severities = searchParams.getAll('severity');
    const statuses = searchParams.getAll('status');

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

    // Get building info
    const building = await prisma.building.findUnique({
      where: { id: targetBuildingId },
    });

    if (!building) {
      return new NextResponse('Building not found', { status: 404 });
    }

    // Build query filters
    type IssueFilters = {
      buildingId: string;
      isPublic: boolean;
      createdAt?: { gte: Date };
      category?: { in: IssueCategory[] };
      severity?: { in: IssueSeverity[] };
      status?: { in: IssueStatus[] };
    };
    
    const issueFilters: IssueFilters = {
      buildingId: targetBuildingId,
      isPublic: true, // Only show public issues in heat map
    };

    if (dateFilter) {
      issueFilters.createdAt = { gte: dateFilter };
    }

    if (categories.length > 0) {
      issueFilters.category = { in: categories as IssueCategory[] };
    }

    if (severities.length > 0) {
      issueFilters.severity = { in: severities as IssueSeverity[] };
    }

    if (statuses.length > 0) {
      issueFilters.status = { in: statuses as IssueStatus[] };
    }

    // Get all issues for the building
    const issues = await prisma.issue.findMany({
      where: issueFilters,
      include: {
        unit: true,
      },
    });

    // Get all units for the building (to show empty units too)
    const units = await prisma.unit.findMany({
      where: { buildingId: targetBuildingId },
    });

    // Initialize heat map data
    const heatMapData: HeatMapData = {
      buildingId: building.id,
      buildingName: building.name,
      floors: building.floors,
      unitsPerFloor: building.unitsPerFloor,
      units: {},
      summary: {
        totalIssues: 0,
        openIssues: 0,
        resolvedIssues: 0,
        averageSeverityScore: 0,
        topCategories: [],
        mostAffectedUnits: [],
      },
    };

    // Initialize units data
    units.forEach(unit => {
      heatMapData.units[unit.unitNumber] = {
        unitId: unit.id,
        floor: unit.floor,
        line: unit.line,
        totalIssues: 0,
        openIssues: 0,
        severityScore: 0,
        categories: {},
      };
    });

    // Process issues
    let totalSeverityScore = 0;
    const categoryCount: Record<string, number> = {};

    issues.forEach(issue => {
      const unitData = heatMapData.units[issue.unit.unitNumber];
      if (!unitData) return;

      // Update counts
      unitData.totalIssues++;
      heatMapData.summary.totalIssues++;

      if (issue.status === 'OPEN' || issue.status === 'IN_PROGRESS' || issue.status === 'AWAITING_LANDLORD') {
        unitData.openIssues++;
        heatMapData.summary.openIssues++;
      } else if (issue.status === 'RESOLVED' || issue.status === 'CLOSED') {
        heatMapData.summary.resolvedIssues++;
      }

      // Calculate severity score
      const severityWeight = SEVERITY_WEIGHTS[issue.severity as keyof typeof SEVERITY_WEIGHTS] || 1;
      unitData.severityScore += severityWeight;
      totalSeverityScore += severityWeight;

      // Track categories
      unitData.categories[issue.category] = (unitData.categories[issue.category] || 0) + 1;
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;

      // Update last reported date
      if (!unitData.lastReportedAt || new Date(issue.createdAt) > unitData.lastReportedAt) {
        unitData.lastReportedAt = issue.createdAt;
      }
    });

    // Calculate summary statistics
    if (heatMapData.summary.totalIssues > 0) {
      heatMapData.summary.averageSeverityScore = totalSeverityScore / heatMapData.summary.totalIssues;
    }

    // Get top categories
    heatMapData.summary.topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get most affected units
    heatMapData.summary.mostAffectedUnits = Object.entries(heatMapData.units)
      .map(([unitNumber, data]) => ({ unitNumber, issueCount: data.totalIssues }))
      .filter(unit => unit.issueCount > 0)
      .sort((a, b) => b.issueCount - a.issueCount)
      .slice(0, 10);

    return NextResponse.json(heatMapData);
  } catch (error) {
    console.error('Heat map data error:', error);
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