# Testing Plan: Issues Endpoint Permissions

## Test Environment Setup

1. Create test users:
   - `tenant1@test.com` - Regular tenant with no special permissions
   - `tenant2@test.com` - Another tenant in same building
   - `admin@test.com` - Building admin with all permissions
   - `maintenance@test.com` - User with MANAGE_ISSUES permission only

2. Create test data:
   - Building: "Test Building"
   - Units: 1A (tenant1), 1B (tenant2)
   - Issues:
     - Public issue by tenant1
     - Private issue by tenant1
     - Public issue by tenant2

## Test Cases for GET /api/issues

### 1. Authentication Tests

| Test | Expected Result |
|------|----------------|
| No auth token | 401 Unauthorized |
| Invalid auth token | 401 Unauthorized |
| Valid auth token | 200 OK |

### 2. Scope = 'my' Tests (Default)

| User | Expected Result |
|------|----------------|
| tenant1 | Sees only their own issues (both public and private) |
| tenant2 | Sees only their own issues |
| admin | Sees only their own issues (when scope=my) |

### 3. Scope = 'building' Tests

| User | Has VIEW_ALL_ISSUES | Expected Result |
|------|-------------------|----------------|
| tenant1 | No | Sees: own issues + public issues from others |
| tenant2 | No | Sees: own issues + public issues from others |
| admin | Yes | Sees: ALL issues (public and private) |
| maintenance | No | Sees: own issues + public issues |
| User not in building | No | 403 Forbidden |

### 4. Edge Cases

| Test | Expected Result |
|------|----------------|
| scope=building without buildingId | Redirects with user's building or 400 error |
| Invalid buildingId | 403 Forbidden |
| User with expired permissions | Treated as no permission |

## Test Cases for POST /api/issues

### 1. Basic Creation Tests

| User | Creating for Own Unit | Expected Result |
|------|---------------------|----------------|
| tenant1 | Yes | 200 OK - Issue created |
| tenant1 | No (different unit) | 403 Forbidden |
| admin | No (any unit) | 200 OK - Has MANAGE_ISSUES |

### 2. Validation Tests

| Test | Expected Result |
|------|----------------|
| Missing title | 400 Bad Request with details |
| Missing description | 400 Bad Request with details |
| Photo > 10MB | 400 Bad Request - File too large |
| Non-image file | 400 Bad Request - Invalid file type |

### 3. Building Access Tests

| User | In Building | Expected Result |
|------|------------|----------------|
| tenant1 | Yes | Can create issue |
| External user | No | 403 Forbidden |

## Manual Testing Steps

### Setup
1. Sign in as mike.edelman@gmail.com (superuser)
2. Go to Access Control page
3. Add test users with different permissions

### Test Sequence

1. **Test Authentication**
   ```bash
   # Without auth
   curl http://localhost:3000/api/issues
   # Should return 401
   ```

2. **Test Own Issues**
   - Sign in as tenant1
   - Go to /dashboard/issues/my
   - Should see only your issues

3. **Test Building Issues (No Permission)**
   - Sign in as tenant1
   - Go to /dashboard/issues/building
   - Should see only public issues

4. **Grant Permission**
   - Sign in as admin
   - Go to Access Control
   - Grant VIEW_ALL_ISSUES to tenant1

5. **Test Building Issues (With Permission)**
   - Sign in as tenant1
   - Go to /dashboard/issues/building
   - Should now see ALL issues

6. **Test Issue Creation**
   - Try creating issue for own unit (should work)
   - Try creating issue for different unit (should fail)
   - Upload large photo (should fail)

## Automated Test Example

```typescript
// __tests__/api/issues.test.ts
describe('GET /api/issues', () => {
  beforeEach(async () => {
    // Setup test data
    await createTestUsers();
    await createTestIssues();
  });

  it('requires authentication', async () => {
    const res = await fetch('/api/issues', {
      headers: {}
    });
    expect(res.status).toBe(401);
  });

  it('returns own issues for scope=my', async () => {
    const res = await fetch('/api/issues?scope=my', {
      headers: { Authorization: `Bearer ${tenant1Token}` }
    });
    const issues = await res.json();
    expect(issues).toHaveLength(2); // tenant1's issues
    expect(issues.every(i => i.reporterId === tenant1.id)).toBe(true);
  });

  it('filters private issues without permission', async () => {
    const res = await fetch('/api/issues?scope=building&buildingId=123', {
      headers: { Authorization: `Bearer ${tenant2Token}` }
    });
    const issues = await res.json();
    const privateIssue = issues.find(i => i.id === privateIssueId);
    expect(privateIssue).toBeUndefined();
  });
});
```

## Expected Logs

When testing, check console for these audit logs:
- "User X accessed building issues for Y (canViewAll: true/false)"
- "User X created issue Y in building Z"

## Rollback Plan

If issues arise:
1. Rename `route.ts` to `route.new.ts`
2. Rename `route.backup.ts` to `route.ts`
3. Deploy immediately