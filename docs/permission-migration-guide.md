# Permission Migration Guide

This guide explains how to add permission checks to existing API endpoints.

## Step-by-Step Migration Process

### 1. Identify Endpoint Requirements

First, determine what access pattern the endpoint needs:

- **Public**: No authentication needed (rare)
- **Authenticated**: Any logged-in user
- **Owner Access**: User accessing their own resources
- **Permission-Based**: Requires specific permissions
- **Combined**: Owner OR permission (common pattern)

### 2. Update Imports

Add the necessary imports:

```typescript
import { withAuth, withPermission, createErrorResponse } from '@/lib/api-middleware';
import { PERMISSIONS } from '@/lib/permissions';
import { canAccessIssue, getAccessibleIssueIds } from '@/lib/api-access-helpers';
```

### 3. Wrap Handler Functions

Replace direct exports with wrapped versions:

#### Before:
```typescript
export async function GET(req: Request) {
  // handler code
}
```

#### After (Authenticated only):
```typescript
export const GET = withAuth(async (req: Request) => {
  // handler code
});
```

#### After (With specific permission):
```typescript
export const GET = withPermission(
  PERMISSIONS.VIEW_ALL_ISSUES,
  async (req: Request) => {
    // handler code
  }
);
```

### 4. Update Error Handling

Replace generic error responses with standardized ones:

#### Before:
```typescript
return new NextResponse('Unauthorized', { status: 401 });
```

#### After:
```typescript
return createErrorResponse(401, 'Authentication required');
```

## Common Migration Patterns

### Pattern 1: Simple Authentication Check

```typescript
// Before
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  // ... rest of handler
}

// After
export const GET = withAuth(async (req: Request) => {
  const user = await getCurrentUser();
  // User is guaranteed to exist here
  // ... rest of handler
});
```

### Pattern 2: Owner-Only Access

```typescript
// Before
export async function GET(req: Request) {
  const user = await getCurrentUser();
  const resource = await prisma.resource.findUnique({ where: { id } });
  
  if (resource.userId !== user.id) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  // ... rest of handler
}

// After
export const GET = withAuth(async (req: Request) => {
  const user = await getCurrentUser();
  const resource = await prisma.resource.findUnique({ where: { id } });
  
  if (resource.userId !== user.id) {
    return createErrorResponse(403, 'You can only access your own resources');
  }
  // ... rest of handler
});
```

### Pattern 3: Permission-Based Access

```typescript
// Before
export async function GET(req: Request) {
  const user = await getCurrentUser();
  // No permission check - security issue!
  const allIssues = await prisma.issue.findMany();
  return NextResponse.json(allIssues);
}

// After
export const GET = withPermission(
  PERMISSIONS.VIEW_ALL_ISSUES,
  async (req: Request) => {
    const allIssues = await prisma.issue.findMany();
    return NextResponse.json(allIssues);
  }
);
```

### Pattern 4: Mixed Access (Owner OR Permission)

```typescript
export const GET = withAuth(async (req: Request) => {
  const user = await getCurrentUser();
  const { id } = await params;
  
  // Use helper function for complex access logic
  const canAccess = await canAccessIssue(
    user.id,
    id,
    PERMISSIONS.VIEW_ALL_ISSUES
  );
  
  if (!canAccess) {
    return createErrorResponse(403, 'Cannot access this issue', {
      required: PERMISSIONS.VIEW_ALL_ISSUES
    });
  }
  
  const issue = await prisma.issue.findUnique({ where: { id } });
  return NextResponse.json(issue);
});
```

## Endpoint-Specific Examples

### Issues Endpoint

```typescript
// GET /api/issues
export const GET = withAuth(async (req: Request) => {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope');
  
  if (scope === 'building') {
    // Check permission for building-wide access
    const buildingId = searchParams.get('buildingId');
    const hasPermission = await hasPermission(
      user.id,
      buildingId,
      PERMISSIONS.VIEW_ALL_ISSUES
    );
    
    if (!hasPermission) {
      // Fall back to accessible issues only
      const accessibleIds = await getAccessibleIssueIds(user.id, buildingId);
      // Query with accessible IDs
    }
  } else {
    // User's own issues - no special permission needed
  }
});
```

### Unit Requests Endpoint

```typescript
// POST /api/unit-requests/[id]/approve
export const POST = withPermission(
  PERMISSIONS.MANAGE_UNIT_REQUESTS,
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    // Permission is already checked by middleware
    // Proceed with approval logic
  }
);
```

### Communications Endpoint

```typescript
// GET /api/communications
export const GET = withAuth(async (req: Request) => {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const viewAll = searchParams.get('all') === 'true';
  
  if (viewAll) {
    // Need permission to view all communications
    const buildingId = await extractBuildingId(req);
    const hasPermission = await hasPermission(
      user.id,
      buildingId,
      PERMISSIONS.VIEW_ALL_COMMUNICATIONS
    );
    
    if (!hasPermission) {
      return createErrorResponse(403, 'Cannot view all communications', {
        required: PERMISSIONS.VIEW_ALL_COMMUNICATIONS
      });
    }
    // Return all communications
  } else {
    // Return user's own communications
  }
});
```

## Testing Permissions

### 1. Unit Tests

```typescript
describe('Issues API', () => {
  it('should deny access without authentication', async () => {
    const response = await GET(mockRequest);
    expect(response.status).toBe(401);
  });
  
  it('should allow owner to access their issue', async () => {
    mockGetCurrentUser.mockResolvedValue(owner);
    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
  });
  
  it('should require permission for building-wide access', async () => {
    mockHasPermission.mockResolvedValue(false);
    const response = await GET(mockRequest);
    expect(response.status).toBe(403);
  });
});
```

### 2. Integration Tests

```typescript
// Test with actual permission setup
beforeEach(async () => {
  await grantPermission(
    testUser.id,
    testBuilding.id,
    PERMISSIONS.VIEW_ALL_ISSUES,
    adminUser.id
  );
});
```

### 3. Manual Testing Checklist

- [ ] Test endpoint without authentication
- [ ] Test endpoint with authentication but no permissions
- [ ] Test endpoint with correct permissions
- [ ] Test endpoint with expired permissions
- [ ] Test owner access (if applicable)
- [ ] Test error messages and status codes

## Rollback Plan

If permissions cause issues in production:

1. **Quick Disable**: Set environment variable `SKIP_PERMISSION_CHECKS=true`
2. **Selective Disable**: Add endpoint to bypass list
3. **Full Rollback**: Deploy previous version

## Monitoring

Add logging for permission denials:

```typescript
if (!hasPermission) {
  await logPermissionDenial(
    user.id,
    buildingId,
    PERMISSIONS.VIEW_ALL_ISSUES,
    '/api/issues'
  );
  // Return error
}
```

## Common Pitfalls

1. **Forgetting Owner Access**: Many endpoints should allow owners to access their own resources
2. **Missing Building Context**: Some endpoints need buildingID from request body or params
3. **Over-Permissioning**: Don't require admin permissions for basic features
4. **Under-Permissioning**: Don't forget to protect sensitive endpoints
5. **Inconsistent Errors**: Use `createErrorResponse` for consistency

## Checklist for Each Endpoint

- [ ] Identify access pattern (public/auth/owner/permission)
- [ ] Add appropriate middleware wrapper
- [ ] Update error responses to use `createErrorResponse`
- [ ] Test all access scenarios
- [ ] Document required permissions
- [ ] Update API permission matrix
- [ ] Add audit logging if needed