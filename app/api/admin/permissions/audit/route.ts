import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/auth-helpers';
import { PERMISSIONS } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    
    if (!buildingId) {
      return new NextResponse('Building ID is required', { status: 400 });
    }

    // Check if user has permission to view audit logs
    const canViewAuditLogs = await hasPermission(
      user.id,
      buildingId,
      PERMISSIONS.VIEW_AUDIT_LOGS
    );

    if (!canViewAuditLogs) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Fetch audit logs with user information
    const logs = await prisma.permissionAuditLog.findMany({
      where: {
        buildingId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to recent 100 entries
    });

    // Get unique user IDs
    const userIds = new Set<string>();
    logs.forEach(log => {
      userIds.add(log.userId);
      userIds.add(log.performedBy);
    });

    // Fetch user information
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(userIds),
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Create user map
    const userMap = new Map(users.map(u => [u.id, u]));

    // Enhance logs with user information
    const enhancedLogs = logs.map(log => ({
      ...log,
      user: userMap.get(log.userId),
      performer: userMap.get(log.performedBy),
    }));

    return NextResponse.json(enhancedLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}