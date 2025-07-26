import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/auth-helpers';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/db';

// Types for our middleware
type ApiHandler = (req: Request) => Promise<Response>;
type MiddlewareFunction = (req: Request, next: ApiHandler) => Promise<Response>;

// Extract building ID from various sources
export async function extractBuildingId(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  
  // Check URL params
  const buildingId = url.searchParams.get('buildingId');
  if (buildingId) return buildingId;
  
  // Check if we're dealing with a resource that has a building
  const pathname = url.pathname;
  
  // For issue-related endpoints
  if (pathname.includes('/issues/')) {
    const issueId = pathname.split('/issues/')[1]?.split('/')[0];
    if (issueId) {
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        select: { buildingId: true },
      });
      return issue?.buildingId || null;
    }
  }
  
  // For unit-related endpoints
  if (pathname.includes('/units/')) {
    const unitId = pathname.split('/units/')[1]?.split('/')[0];
    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
        select: { buildingId: true },
      });
      return unit?.buildingId || null;
    }
  }
  
  // Try to get from request body for POST/PUT requests
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = await req.clone().json();
      return body.buildingId || null;
    } catch {
      // Body might not be JSON
    }
  }
  
  // Get user's current building as fallback
  const user = await getCurrentUser();
  if (user) {
    const currentBuilding = user.buildingRoles[0]?.buildingId;
    return currentBuilding || null;
  }
  
  return null;
}

// Create standard error response
export function createErrorResponse(
  status: number,
  message: string,
  details?: { required?: Permission | Permission[]; [key: string]: unknown }
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...details,
    },
    { status }
  );
}

// Middleware to require authentication
export function requireAuth(handler: ApiHandler): ApiHandler {
  return async (req: Request) => {
    const user = await getCurrentUser();
    
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }
    
    // Add user to request context (via headers for now)
    const headers = new Headers(req.headers);
    headers.set('x-user-id', user.id);
    
    const modifiedReq = new Request(req.url, {
      method: req.method,
      headers,
      body: req.body,
      // @ts-expect-error - duplex is required for Node.js but not in TypeScript types
      duplex: 'half',
    });
    
    return handler(modifiedReq);
  };
}

// Middleware to require a specific permission
export function requirePermission(permission: Permission): MiddlewareFunction {
  return async (req: Request, next: ApiHandler) => {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }
    
    const buildingId = await extractBuildingId(req);
    if (!buildingId) {
      return createErrorResponse(400, 'Building context required');
    }
    
    const hasAccess = await hasPermission(user.id, buildingId, permission);
    if (!hasAccess) {
      return createErrorResponse(403, 'Insufficient permissions', {
        required: permission,
      });
    }
    
    return next(req);
  };
}

// Middleware to require any of the given permissions
export function requireAnyPermission(...permissions: Permission[]): MiddlewareFunction {
  return async (req: Request, next: ApiHandler) => {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }
    
    const buildingId = await extractBuildingId(req);
    if (!buildingId) {
      return createErrorResponse(400, 'Building context required');
    }
    
    const hasAccess = await hasAnyPermission(user.id, buildingId, permissions);
    if (!hasAccess) {
      return createErrorResponse(403, 'Insufficient permissions', {
        required: permissions,
      });
    }
    
    return next(req);
  };
}

// Middleware to require all of the given permissions
export function requireAllPermissions(...permissions: Permission[]): MiddlewareFunction {
  return async (req: Request, next: ApiHandler) => {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }
    
    const buildingId = await extractBuildingId(req);
    if (!buildingId) {
      return createErrorResponse(400, 'Building context required');
    }
    
    const hasAccess = await hasAllPermissions(user.id, buildingId, permissions);
    if (!hasAccess) {
      return createErrorResponse(403, 'Insufficient permissions', {
        required: permissions,
      });
    }
    
    return next(req);
  };
}

// Compose multiple middleware functions
export function compose(...middleware: MiddlewareFunction[]): (handler: ApiHandler) => ApiHandler {
  return (handler: ApiHandler) => {
    return middleware.reduceRight<ApiHandler>(
      (next, mw) => (req) => mw(req, next),
      handler
    );
  };
}

// Helper to create protected API route handlers
export function withAuth(handler: ApiHandler): ApiHandler {
  return requireAuth(handler);
}

export function withPermission(permission: Permission, handler: ApiHandler): ApiHandler {
  return async (req: Request) => {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }
    
    const buildingId = await extractBuildingId(req);
    if (!buildingId) {
      return createErrorResponse(400, 'Building context required');
    }
    
    const hasAccess = await hasPermission(user.id, buildingId, permission);
    if (!hasAccess) {
      return createErrorResponse(403, 'Insufficient permissions', {
        required: permission,
      });
    }
    
    return handler(req);
  };
}

export function withAnyPermission(permissions: Permission[], handler: ApiHandler): ApiHandler {
  return async (req: Request) => {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }
    
    const buildingId = await extractBuildingId(req);
    if (!buildingId) {
      return createErrorResponse(400, 'Building context required');
    }
    
    const hasAccess = await hasAnyPermission(user.id, buildingId, permissions);
    if (!hasAccess) {
      return createErrorResponse(403, 'Insufficient permissions', {
        required: permissions,
      });
    }
    
    return handler(req);
  };
}

export function withAllPermissions(permissions: Permission[], handler: ApiHandler): ApiHandler {
  return async (req: Request) => {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(401, 'Authentication required');
    }
    
    const buildingId = await extractBuildingId(req);
    if (!buildingId) {
      return createErrorResponse(400, 'Building context required');
    }
    
    const hasAccess = await hasAllPermissions(user.id, buildingId, permissions);
    if (!hasAccess) {
      return createErrorResponse(403, 'Insufficient permissions', {
        required: permissions,
      });
    }
    
    return handler(req);
  };
}

// Log permission denials for auditing
export async function logPermissionDenial(
  userId: string,
  buildingId: string,
  permission: Permission,
  endpoint: string
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PERMISSION_DENIED',
      entityType: 'API_ENDPOINT',
      entityId: endpoint,
      metadata: {
        buildingId,
        permission,
        timestamp: new Date().toISOString(),
      },
    },
  });
}