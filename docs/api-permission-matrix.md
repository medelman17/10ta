# API Permission Matrix

This document maps all API endpoints to their required permissions and access rules.

## Legend

- ✅ **Public** - No authentication required
- 🔐 **Auth** - Authentication required (any logged-in user)
- 🔑 **Permission** - Specific permission required
- 👤 **Owner** - Resource owner has access
- 🏢 **Building** - Must be in the same building

## Endpoints by Category

### Authentication & User Management

| Endpoint | Method | Access | Permission | Notes |
|----------|--------|--------|------------|-------|
| `/api/auth/sync` | POST | 🔐 Auth | - | Syncs user with Clerk |
| `/api/webhooks/clerk` | POST | ✅ Public | - | Webhook endpoint |
| `/api/user/profile` | GET | 🔐 Auth | - | Own profile only |
| `/api/users/search` | GET | 🔑 Permission | `MANAGE_ADMINS` | Search users by email |

### Onboarding

| Endpoint | Method | Access | Permission | Notes |
|----------|--------|--------|------------|-------|
| `/api/onboarding` | POST | 🔐 Auth | - | Submit unit request |

### Issues

| Endpoint | Method | Access | Permission | Notes |
|----------|--------|--------|------------|-------|
| `/api/issues` | GET | 🔐 Auth | - | Own issues (scope=my) |
| `/api/issues` | GET | 🔑 Permission | `VIEW_ALL_ISSUES` | Building issues (scope=building) |
| `/api/issues` | POST | 🔐 Auth | - | Create new issue |
| `/api/issues/[id]` | GET | 👤 Owner / 🔑 Permission | `VIEW_ALL_ISSUES` | View specific issue |
| `/api/issues/[id]` | PUT | 👤 Owner / 🔑 Permission | `MANAGE_ISSUES` | Update issue |
| `/api/issues/[id]` | DELETE | 🔑 Permission | `DELETE_ISSUES` | Delete issue |
| `/api/issues/[id]/status` | PUT | 🔑 Permission | `MANAGE_ISSUES` | Change issue status |
| `/api/issues/analyze-photo` | POST | 🔐 Auth | - | AI photo analysis |
| `/api/issues/heatmap` | GET | 🏢 Building | - | Heat map data |
| `/api/issues/statistics` | GET | 🏢 Building | - | Issue statistics |

### Communications

| Endpoint | Method | Access | Permission | Notes |
|----------|--------|--------|------------|-------|
| `/api/communications` | GET | 🔐 Auth | - | Own communications |
| `/api/communications` | GET | 🔑 Permission | `VIEW_ALL_COMMUNICATIONS` | All communications (with filter) |
| `/api/communications` | POST | 🔐 Auth | - | Create communication |
| `/api/communications/[id]` | GET | 👤 Owner / 🔑 Permission | `VIEW_ALL_COMMUNICATIONS` | View communication |
| `/api/communications/[id]` | DELETE | 🔑 Permission | `MODERATE_COMMUNICATIONS` | Delete communication |

### Unit Management

| Endpoint | Method | Access | Permission | Notes |
|----------|--------|--------|------------|-------|
| `/api/units` | GET | 🔑 Permission | `MANAGE_BUILDING` | List all units |
| `/api/units/[id]` | GET | 👤 Tenant / 🔑 Permission | `VIEW_ALL_TENANTS` | View unit details |
| `/api/units/[id]` | PUT | 🔑 Permission | `MANAGE_BUILDING` | Update unit |
| `/api/unit-requests` | GET | 🔑 Permission | `MANAGE_UNIT_REQUESTS` | List requests |
| `/api/unit-requests/[id]/approve` | POST | 🔑 Permission | `MANAGE_UNIT_REQUESTS` | Approve request |
| `/api/unit-requests/[id]/reject` | POST | 🔑 Permission | `MANAGE_UNIT_REQUESTS` | Reject request |

### Admin Functions

| Endpoint | Method | Access | Permission | Notes |
|----------|--------|--------|------------|-------|
| `/api/admin/permissions/grant` | POST | 🔑 Permission | `MANAGE_PERMISSIONS` | Grant permissions |
| `/api/admin/permissions/revoke` | POST | 🔑 Permission | `MANAGE_PERMISSIONS` | Revoke permissions |
| `/api/admin/permissions/audit` | GET | 🔑 Permission | `VIEW_AUDIT_LOGS` | View audit logs |
| `/api/admin/roles/grant` | POST | 🔑 Permission | `MANAGE_ADMINS` | Grant roles |
| `/api/permissions` | GET | 🔐 Auth | - | Get own permissions |

### Analytics & Reporting

| Endpoint | Method | Access | Permission | Notes |
|----------|--------|--------|------------|-------|
| `/api/analytics/issues` | GET | 🔑 Permission | `VIEW_BUILDING_ANALYTICS` | Issue analytics |
| `/api/analytics/tenants` | GET | 🔑 Permission | `VIEW_BUILDING_ANALYTICS` | Tenant analytics |
| `/api/export/issues` | GET | 🔑 Permission | `EXPORT_ISSUES` | Export issues |

### Association Features (Future)

| Endpoint | Method | Access | Permission | Notes |
|----------|--------|--------|------------|-------|
| `/api/petitions` | GET | 🏢 Building | - | View petitions |
| `/api/petitions` | POST | 🔑 Permission | `MANAGE_PETITIONS` | Create petition |
| `/api/petitions/[id]/sign` | POST | 🏢 Building | - | Sign petition |
| `/api/meetings` | GET | 🏢 Building | - | View meetings |
| `/api/meetings` | POST | 🔑 Permission | `MANAGE_MEETINGS` | Schedule meeting |

## Implementation Status

### ✅ Implemented with Permissions
- `/api/admin/permissions/*`
- `/api/users/search`

### 🚧 Needs Permission Implementation
- `/api/issues/*` - Currently only checks authentication
- `/api/communications/*` - Currently only checks authentication
- `/api/unit-requests/*` - Has basic role check, needs permission check

### 📝 Not Yet Implemented
- Analytics endpoints
- Export endpoints
- Association endpoints

## Access Control Patterns

### Pattern 1: Owner Access
```typescript
// User can always access their own resources
if (resource.userId === currentUser.id) {
  return allow();
}
```

### Pattern 2: Building Membership
```typescript
// User must be in the same building
if (await isUserInBuilding(currentUser.id, resource.buildingId)) {
  return allow();
}
```

### Pattern 3: Permission Check
```typescript
// User must have specific permission
if (await hasPermission(currentUser.id, buildingId, PERMISSIONS.VIEW_ALL_ISSUES)) {
  return allow();
}
```

### Pattern 4: Combined Access
```typescript
// Owner OR has permission
if (resource.userId === currentUser.id || 
    await hasPermission(currentUser.id, buildingId, PERMISSIONS.MANAGE_ISSUES)) {
  return allow();
}
```

## Migration Plan

1. **Phase 1**: Add permission checks in report-only mode
2. **Phase 2**: Review logs and adjust permissions
3. **Phase 3**: Enable enforcement for read endpoints
4. **Phase 4**: Enable enforcement for write endpoints
5. **Phase 5**: Add rate limiting and additional security

## Notes

- All permission checks should happen at the API level
- UI should hide/disable features based on permissions
- Always fail closed (deny by default)
- Log permission denials for security auditing
- Consider caching permission checks within request lifecycle