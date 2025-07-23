# CI E2E Testing Strategy for 10 Ocean

## Overview

Running E2E tests in CI presents unique challenges that need careful consideration. This document outlines our strategy for reliable, efficient E2E testing in GitHub Actions.

## Key Challenges & Solutions

### 1. Test Database Strategy

**Challenge**: We need an isolated database for tests that won't affect production data.

**Options**:
1. **Separate Test Database** (Recommended)
   - Create a dedicated Neon branch for testing
   - Reset before each test run
   - Parallel test runs get isolated schemas
   
2. **Database Per PR**
   - Use Neon's branching feature
   - Create branch from main for each PR
   - Delete after tests complete

**Implementation**:
```yaml
- name: Create Test Database
  run: |
    # Use Neon API to create a branch
    curl -X POST https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches \
      -H "Authorization: Bearer $NEON_API_KEY" \
      -d '{"branch_name": "test-${{ github.run_id }}"}'
```

### 2. Clerk Test Environment

**Challenge**: Test users need to be isolated from production users.

**Solutions**:
1. **Dedicated Test Instance**
   - Set up separate Clerk development instance for CI
   - Use `CLERK_TEST_*` environment variables
   - Test users exist only in test instance

2. **User Cleanup Strategy**
   - Delete test users after each run
   - Use unique email prefixes per test run
   - Implement TTL on test users

**Implementation**:
```yaml
env:
  CLERK_SECRET_KEY: ${{ secrets.CLERK_TEST_SECRET_KEY }}
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_TEST_PUBLISHABLE_KEY }}
```

### 3. Application Deployment

**Challenge**: Tests need a running application instance.

**Options**:
1. **Vercel Preview Deployments** (Recommended)
   - Use Vercel's PR preview URLs
   - Automatic deployment on push
   - Isolated environment per PR
   
2. **Local Server in CI**
   - Build and run locally in GitHub Actions
   - Faster but less production-like
   - Good for unit/integration tests

**Implementation**:
```yaml
- name: Wait for Vercel Preview
  uses: patrickedqvist/wait-for-vercel-preview@v1.3.1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    max_timeout: 600

- name: Get Preview URL
  id: preview
  run: echo "url=${{ steps.waitForVercel.outputs.url }}" >> $GITHUB_OUTPUT
```

### 4. API Keys & Secrets

**Challenge**: StageHand needs OpenAI/Anthropic API keys.

**Solutions**:
1. **Dedicated Test API Keys**
   - Lower rate limits acceptable
   - Monitor usage and costs
   - Rotate regularly

2. **Mock Mode for Some Tests**
   - Record interactions once
   - Replay for deterministic tests
   - Real API for critical paths only

### 5. Browser Automation

**Challenge**: Running browsers in CI can be flaky.

**Solutions**:
1. **Browserbase Cloud** (Recommended for CI)
   - More reliable than local browsers
   - Built for CI/CD environments
   - Better debugging with recordings

2. **Optimized Local Browsers**
   - Use specific Chrome/Chromium versions
   - Disable unnecessary features
   - Increase timeouts for CI

### 6. Test Data Management

**Challenge**: Tests need consistent data state.

**Solutions**:
1. **Seed Before Each Test Suite**
   ```yaml
   - name: Seed Test Data
     run: |
       pnpm test-users:create
       pnpm test-data:seed
   ```

2. **Parallel Test Isolation**
   - Use unique tenant/building per test
   - Prefix all test data with run ID
   - Clean up after completion

## Optimized CI Workflow

```yaml
name: E2E Tests

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      # 1. Setup
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      
      # 2. Create test database branch
      - name: Setup Test Database
        run: |
          # Create Neon branch
          # Run migrations
          
      # 3. Wait for Vercel preview
      - name: Get Preview URL
        id: preview_url
        run: |
          # Get Vercel preview URL
          
      # 4. Create test users
      - name: Setup Test Users
        env:
          CLERK_SECRET_KEY: ${{ secrets.CLERK_TEST_SECRET_KEY }}
        run: |
          pnpm test-users:create
          
      # 5. Run E2E tests
      - name: Run Tests
        env:
          TEST_URL: ${{ steps.preview_url.outputs.url }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_TEST_API_KEY }}
          BROWSERBASE_API_KEY: ${{ secrets.BROWSERBASE_API_KEY }}
        run: |
          pnpm test:e2e:ci
          
      # 6. Cleanup
      - name: Cleanup
        if: always()
        run: |
          pnpm test-users:delete
          # Delete database branch
```

## Performance Optimization

### 1. Parallel Execution
- Run tests in parallel with isolated data
- Use GitHub Actions matrix strategy
- Shard tests by feature area

### 2. Smart Test Selection
- Run only affected tests based on changes
- Tag tests by priority (smoke, critical, full)
- Skip E2E for documentation changes

### 3. Caching Strategy
- Cache node_modules
- Cache Playwright browsers
- Cache build artifacts

### 4. Test Segmentation
```yaml
strategy:
  matrix:
    test-suite: [auth, permissions, issues, communications]
```

## Cost Management

### 1. API Usage
- Set spending limits on test API keys
- Use mocks for expensive operations
- Monitor usage in CI

### 2. Database Costs
- Clean up test branches immediately
- Use smallest compute size for tests
- Schedule periodic cleanup jobs

### 3. CI Minutes
- Optimize build times
- Use concurrency limits
- Cancel outdated workflows

## Monitoring & Debugging

### 1. Test Artifacts
```yaml
- uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: test-results
    path: |
      test-results/
      screenshots/
      logs/
```

### 2. Browserbase Session Recordings
- Automatically saved for failed tests
- Link in PR comments
- 7-day retention

### 3. Flaky Test Detection
- Track test success rates
- Automatically retry flaky tests
- Alert on persistent failures

## Environment Variables

### Required for CI:
```env
# Test Database
NEON_TEST_PROJECT_ID=
NEON_TEST_API_KEY=
DATABASE_TEST_URL=

# Test Clerk Instance  
CLERK_TEST_SECRET_KEY=
CLERK_TEST_PUBLISHABLE_KEY=
CLERK_TEST_WEBHOOK_SECRET=

# API Keys for Testing
OPENAI_TEST_API_KEY=
BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=

# Vercel
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```

## Migration Path

### Phase 1: Basic CI (Current)
- Run tests against local server
- Use production database (risky)
- Manual cleanup

### Phase 2: Isolated Testing
- Separate test database
- Dedicated Clerk instance
- Automated cleanup

### Phase 3: Full Integration
- Vercel preview deployments
- Browserbase for reliability
- Parallel test execution

### Phase 4: Advanced Features
- Visual regression testing
- Performance benchmarks
- Automatic PR comments with results

## Best Practices

1. **Keep Tests Fast**
   - Target < 10 min for PR tests
   - Run full suite nightly
   - Optimize critical path

2. **Make Tests Reliable**
   - Retry flaky operations
   - Use explicit waits
   - Clean state between tests

3. **Provide Good Feedback**
   - Clear error messages
   - Screenshots on failure
   - Link to debug sessions

4. **Secure Test Data**
   - Never use production data
   - Rotate test credentials
   - Audit test user permissions

## Example Test Configuration

```typescript
// tests/e2e/ci.config.ts
export const ciConfig = {
  baseURL: process.env.TEST_URL || process.env.VERCEL_URL,
  testIdPrefix: `ci-${process.env.GITHUB_RUN_ID}`,
  browserbase: {
    projectId: process.env.BROWSERBASE_TEST_PROJECT_ID,
    apiKey: process.env.BROWSERBASE_API_KEY,
  },
  clerk: {
    apiUrl: 'https://api.clerk.test', // Test instance
    secretKey: process.env.CLERK_TEST_SECRET_KEY,
  },
  database: {
    url: process.env.DATABASE_TEST_URL,
    schema: `test_${process.env.GITHUB_RUN_ID}`,
  },
};
```

## Conclusion

A robust CI strategy for E2E tests requires:
- Isolated test environments
- Reliable browser automation
- Smart test data management
- Cost-conscious execution
- Great debugging tools

Start with Phase 1 and progressively enhance as the test suite grows.