# Permission System Architecture

## Overview

This document outlines the architecture and implementation patterns for API endpoint protection in the 10 Ocean tenant association platform. The goal is to maintain clean, consistent, and maintainable permission checks across all endpoints.

## Core Principles

1. **Explicit Over Implicit** - Every protected endpoint must explicitly declare its permission requirements
2. **Fail Secure** - Default to denying access when permissions are unclear
3. **Context-Aware** - Permissions should consider the relationship between user and resource
4. **Consistent Patterns** - Use the same patterns across all endpoints
5. **Easy to Audit** - It should be obvious what permissions an endpoint requires

## Permission Check Levels

### 1. Resource Ownership
Users can always access their own resources, regardless of permissions:
- Their own issues
- Their own communications
- Their own profile

### 2. Building Context
Most permissions are scoped to a specific building:
- A user might be admin in Building A but not Building B
- Permissions are checked against the building context of the resource

### 3. Global Permissions
Some actions might require platform-wide permissions (future consideration):
- Platform administration
- Cross-building analytics

## Implementation Patterns

### Pattern 1: Middleware Approach (Recommended)

Create permission middleware that can be composed:

```typescript
// lib/api-middleware.ts
export function requirePermission(permission: Permission) {
  return async (req: Request, handler: Function) => {
    const user = await getCurrentUser();
    const buildingId = await extractBuildingId(req);
    
    if (!await hasPermission(user.id, buildingId, permission)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    return handler(req);
  };
}

// Usage in API route
export const GET = requirePermission(PERMISSIONS.VIEW_ALL_ISSUES)(
  async (req: Request) => {
    // Handler code
  }
);
```

### Pattern 2: Resource-Based Permissions

For endpoints that deal with specific resources:

```typescript
// lib/api-helpers.ts
export async function canAccessIssue(
  userId: string, 
  issueId: string,
  requiredPermission?: Permission
): Promise<boolean> {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { reporter: true }
  });
  
  // Owner can always access
  if (issue.reporterId === userId) return true;
  
  // Public issues can be seen by building members
  if (issue.isPublic && await isInBuilding(userId, issue.buildingId)) {
    return true;
  }
  
  // Check specific permission if required
  if (requiredPermission) {
    return hasPermission(userId, issue.buildingId, requiredPermission);
  }
  
  return false;
}
```

### Pattern 3: Composite Permissions

Some endpoints might require multiple permissions or any of several:

```typescript
export function requireAnyPermission(...permissions: Permission[]) {
  return async (req: Request, handler: Function) => {
    const user = await getCurrentUser();
    const buildingId = await extractBuildingId(req);
    
    if (!await hasAnyPermission(user.id, buildingId, permissions)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    return handler(req);
  };
}
```

## Endpoint Classification

### Public Endpoints (No Auth Required)
- `GET /` - Landing page
- `GET /sign-in` - Sign in page
- `GET /sign-up` - Sign up page

### Authenticated Endpoints (Login Required, No Special Permissions)
- `GET /api/user/profile` - Own profile
- `GET /api/issues/my` - Own issues
- `POST /api/issues` - Create own issue
- `GET /api/communications/my` - Own communications

### Permission-Protected Endpoints

#### Issue Management
- `GET /api/issues` (scope=building) → `VIEW_ALL_ISSUES`
- `PUT /api/issues/[id]/status` → `MANAGE_ISSUES`
- `DELETE /api/issues/[id]` → `DELETE_ISSUES`
- `GET /api/issues/export` → `EXPORT_ISSUES`

#### Tenant Management
- `GET /api/tenants` → `VIEW_ALL_TENANTS`
- `GET /api/unit-requests` → `MANAGE_UNIT_REQUESTS`
- `POST /api/unit-requests/[id]/approve` → `MANAGE_UNIT_REQUESTS`
- `POST /api/tenants/[id]/transfer` → `MANAGE_TENANTS`

#### Building Management
- `GET /api/building/analytics` → `VIEW_BUILDING_ANALYTICS`
- `PUT /api/building/settings` → `MANAGE_BUILDING_SETTINGS`
- `PUT /api/building/units` → `MANAGE_BUILDING`

#### Admin Functions
- `GET /api/admin/permissions` → `MANAGE_PERMISSIONS`
- `POST /api/admin/permissions/grant` → `MANAGE_PERMISSIONS`
- `GET /api/admin/audit-logs` → `VIEW_AUDIT_LOGS`

## Error Handling

### Standard Error Responses

```typescript
// 401 Unauthorized - Not logged in
{ error: "Authentication required" }

// 403 Forbidden - Logged in but lacks permission
{ error: "Insufficient permissions", required: "VIEW_ALL_ISSUES" }

// 404 Not Found - Resource doesn't exist or user can't access
{ error: "Resource not found" }
```

### Error Page Flow
1. API returns 403 with required permission
2. Client redirects to `/error/forbidden?required=PERMISSION_NAME`
3. Error page shows friendly message and suggests contacting admin

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create permission middleware functions
- [ ] Create resource access check helpers
- [ ] Implement building context extraction
- [ ] Create error response standards

### Phase 2: Protect Existing Endpoints
- [ ] Audit all existing API routes
- [ ] Add permission checks to each endpoint
- [ ] Update error handling
- [ ] Test permission denials

### Phase 3: Client-Side Handling
- [ ] Create permission-aware UI components
- [ ] Add loading states for permission checks
- [ ] Implement error boundaries
- [ ] Create forbidden/error pages

### Phase 4: Documentation
- [ ] Document required permissions for each endpoint
- [ ] Create permission matrix
- [ ] Add API documentation
- [ ] Create admin guide

## Best Practices

1. **Always Check at API Level** - Never rely solely on UI hiding
2. **Log Permission Denials** - For security auditing
3. **Cache Permission Checks** - Within request lifecycle
4. **Graceful Degradation** - Show what users can access
5. **Clear Error Messages** - Help users understand why access was denied

## Migration Strategy

To add permissions to existing endpoints without breaking functionality:

1. Add permission checks in "report only" mode
2. Log what would be denied
3. Review logs and adjust permissions
4. Enable enforcement mode
5. Monitor for issues

## Future Considerations

1. **Permission Delegation** - Admins granting specific permissions to others
2. **Time-Based Access** - Permissions that activate/deactivate on schedule
3. **Conditional Permissions** - Based on resource state or other factors
4. **Permission Templates** - Beyond roles, custom permission sets
5. **Cross-Building Permissions** - For property management companies

## Example: Protecting Issues Endpoints

```typescript
// app/api/issues/route.ts
import { withPermission } from '@/lib/api-middleware';
import { PERMISSIONS } from '@/lib/permissions';

export const GET = withPermission(
  async (req: Request) => {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope');
    
    if (scope === 'building') {
      // Requires VIEW_ALL_ISSUES permission
      return await getbuildingIssues(req);
    } else {
      // No special permission needed for own issues
      return await getOwnIssues(req);
    }
  },
  {
    building: PERMISSIONS.VIEW_ALL_ISSUES,
    my: null, // No permission needed
  }
);

export const POST = withPermission(
  async (req: Request) => {
    // Any authenticated user can create issues
    return await createIssue(req);
  },
  null // No special permission needed
);
```

## Conclusion

By following these patterns, we can maintain a clean, secure, and maintainable permission system that:
- Is easy to understand and audit
- Fails securely by default
- Provides good user experience
- Scales with the application