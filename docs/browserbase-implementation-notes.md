# BrowserBase Implementation Notes for 10 Ocean

Based on the comprehensive BrowserBase guide, here are specific implementation notes for when we're ready to integrate BrowserBase into our E2E testing pipeline.

## Current State vs. BrowserBase Integration

### Current Setup (Phase 1)
- Using local Playwright with StageHand
- OpenAI API for AI-powered interactions
- Manual test user creation via Clerk
- Running against production database (temporary)

### BrowserBase Benefits for Our Use Case
1. **Session Recording**: Debug tenant permission issues visually
2. **Parallel Execution**: Test all permission combinations efficiently
3. **Stealth Mode**: Test landlord portal automation features
4. **Cost Efficiency**: $0.10/browser hour vs. maintaining CI infrastructure

## Implementation Roadmap

### Step 1: Basic Integration
Replace our current StageHand setup with BrowserBase's native Stagehand:

```typescript
// From current setup:
const stagehand = new Stagehand({
  env: 'LOCAL',
  headless: true,
  modelName: 'gpt-4o',
  modelApiKey: process.env.OPENAI_API_KEY,
});

// To BrowserBase:
const stagehand = new Stagehand({
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
});
```

### Step 2: Update GitHub Actions
Modify `.github/workflows/e2e-tests-simple.yml`:

```yaml
env:
  BROWSERBASE_API_KEY: ${{ secrets.BROWSERBASE_API_KEY }}
  BROWSERBASE_PROJECT_ID: ${{ secrets.BROWSERBASE_PROJECT_ID }}
  # Remove local browser installation steps
```

### Step 3: Leverage Context for Test Users
Use BrowserBase contexts to maintain authenticated sessions:

```typescript
// Create contexts for each test role
const contexts = {
  tenant1: await bb.contexts.create({ projectId }),
  tenant2: await bb.contexts.create({ projectId }),
  admin: await bb.contexts.create({ projectId }),
};

// Reuse authenticated state across tests
const session = await bb.sessions.create({
  projectId,
  browserSettings: {
    context: {
      id: contexts.admin.id,
      persist: true,
    },
  },
});
```

## Cost Optimization Strategies

### For 10 Ocean's Test Suite
Based on our current tests:
- ~50 permission tests × 2 min average = 100 minutes
- Cost: ~$0.17 per full test run
- With parallel execution (4 workers): ~$0.04 per run

### Optimization Techniques
1. **Group Related Tests**: Run permission tests in same session
2. **Skip Visual Tests**: Disable image loading for API tests
3. **Regional Deployment**: Use US regions for Vercel/Neon

## Specific Test Scenarios

### 1. Permission Testing
```typescript
test.describe('Building Admin Permissions', () => {
  let adminContext: Context;
  
  beforeAll(async () => {
    adminContext = await createAuthenticatedContext('admin@test.com');
  });
  
  test('can view all tenant issues', async ({ page }) => {
    await page.goto('/dashboard/issues/building', {
      context: adminContext
    });
    // Test visibility of private issues
  });
});
```

### 2. Multi-Tenant Scenarios
```typescript
test('tenant privacy is maintained', async () => {
  const [tenant1Session, tenant2Session] = await Promise.all([
    createTenantSession('1A'),
    createTenantSession('1B'),
  ]);
  
  // Verify tenant1 cannot see tenant2's private issues
});
```

### 3. Future: Landlord Portal Automation
```typescript
test('extract rent payment history', async ({ page }) => {
  // Use stealth mode for third-party sites
  const session = await bb.sessions.create({
    projectId,
    browserSettings: {
      fingerprint: { devices: ['desktop'] },
      proxy: true, // For landlord portal access
    },
  });
  
  await page.goto('https://landlord-portal.com');
  await page.act('login with saved credentials');
  await page.act('navigate to payment history');
  const payments = await page.extract('payment records');
});
```

## Migration Checklist

When ready to implement:

- [ ] Create BrowserBase account and get API credentials
- [ ] Add secrets to GitHub: `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`
- [ ] Update `tests/e2e/setup/stagehand.config.ts` for BrowserBase
- [ ] Remove Playwright browser installation from CI
- [ ] Update test scripts to use BrowserBase session management
- [ ] Configure parallel execution with sharding
- [ ] Set up debugging workflows with Session Inspector
- [ ] Monitor costs and optimize as needed

## Estimated Timeline

- Basic integration: 2-3 hours
- Full migration with optimizations: 1-2 days
- Cost optimization and monitoring setup: 2-3 hours

## Next Steps

1. Start with free tier to validate integration
2. Run cost analysis on full test suite
3. Implement session reuse patterns
4. Set up cost alerts and monitoring