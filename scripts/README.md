# Test User Management Scripts

These scripts help create and manage test users for testing the permission system.

## Prerequisites

1. Get your Clerk Secret Key from the Clerk Dashboard
2. Set it as an environment variable:
   ```bash
   export CLERK_SECRET_KEY=sk_test_your_secret_key_here
   ```

## Usage

### Create Test Users
```bash
pnpm test-users:create
```

This creates 4 test users in Clerk:
- `tenant1@test.com` - Regular tenant (no permissions)
- `tenant2@test.com` - Another regular tenant
- `admin@test.com` - Will be given admin permissions
- `maintenance@test.com` - Will be given MANAGE_ISSUES permission

All users have the password: `TestPassword123!`

### List Test Users
```bash
pnpm test-users:list
```
Shows which test users exist in Clerk.

### Delete Test Users
```bash
pnpm test-users:delete
```
Removes all test users from Clerk.

## Automated Test Workflow

### Quick Setup (Recommended)

1. **Create test users in Clerk:**
   ```bash
   pnpm test-users:create
   ```

2. **Seed test data (auto-onboards users):**
   ```bash
   pnpm test-data:seed
   ```

This automatically:
- Creates a test building with units
- Onboards all test users
- Assigns them to units (1A, 1B, 2A)
- Grants appropriate permissions
- Creates sample issues

3. **Test permissions:**
   - Sign in as different users
   - Check `/dashboard/issues/building`
   - Verify who can see what based on permissions

### Manual Workflow (Alternative)

If you prefer to manually onboard users:

1. **Create test users:**
   ```bash
   pnpm test-users:create
   ```

2. **Complete onboarding for each user:**
   - Sign in as `tenant1@test.com`
   - Complete onboarding, request unit 1A
   - Sign out
   - Repeat for other users (1B, 2A, etc.)

3. **Approve unit requests:**
   - Sign in as `mike.edelman@gmail.com`
   - Go to `/dashboard/admin/units`
   - Click "Pending Requests" tab
   - Approve all requests

4. **Grant permissions:**
   - Still as mike.edelman@gmail.com
   - Go to `/dashboard/admin/access`
   - Click "Add Administrator"
   - Search for `admin@test.com`
   - Select "Building Manager" role template
   - Add administrator
   - Repeat for `maintenance@test.com` with "Maintenance Staff" role

5. **Create test issues:**
   - Sign in as `tenant1@test.com`
   - Create a public issue
   - Create a private issue
   - Sign out
   - Sign in as `tenant2@test.com`
   - Create a public issue

6. **Test permissions:**
   - Sign in as different users
   - Check `/dashboard/issues/building`
   - Verify who can see what based on permissions

## Test Scenarios

### Scenario 1: No Permissions
- User: `tenant1@test.com`
- Expected: Can only see own issues + public issues in building view

### Scenario 2: VIEW_ALL_ISSUES Permission
- User: `admin@test.com` (after granting permissions)
- Expected: Can see ALL issues including private ones

### Scenario 3: MANAGE_ISSUES Permission
- User: `maintenance@test.com`
- Expected: Can create issues for any unit, update issue status

## Cleanup

When done testing:

1. **Clean test data from database:**
   ```bash
   pnpm test-data:clean
   ```

2. **Delete test users from Clerk:**
   ```bash
   pnpm test-users:delete
   ```

This removes all test data including:
- Test building and units
- Test issues and communications
- Permissions and audit logs
- Test users from Clerk