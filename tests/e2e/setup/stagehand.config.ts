// StageHand configuration for E2E tests
export const testConfig = {
  env: process.env.CI ? 'LOCAL' : 'LOCAL', // Always use local for now
  headless: process.env.CI === 'true' || process.env.HEADLESS === 'true',
  modelName: process.env.STAGEHAND_MODEL || 'gpt-4o',
  modelApiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
};

// Test URLs
export const TEST_URLS = {
  local: 'http://localhost:3000',
  staging: process.env.STAGING_URL || 'https://10ta-staging.vercel.app',
  production: 'https://10ocean.app',
};

export const getTestUrl = () => {
  if (process.env.TEST_ENV === 'staging') return TEST_URLS.staging;
  if (process.env.TEST_ENV === 'production') return TEST_URLS.production;
  return TEST_URLS.local;
};

// Test user credentials
export const TEST_USERS = {
  tenant1: {
    email: 'tenant1@test.com',
    password: 'TestPassword123!',
    unit: '1A',
    role: 'tenant',
  },
  tenant2: {
    email: 'tenant2@test.com',
    password: 'TestPassword123!',
    unit: '1B',
    role: 'tenant',
  },
  admin: {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    unit: '2A',
    role: 'admin',
    permissions: ['VIEW_ALL_ISSUES', 'MANAGE_ISSUES', 'VIEW_ALL_TENANTS', 'MANAGE_TENANTS'],
  },
  maintenance: {
    email: 'maintenance@test.com',
    password: 'TestPassword123!',
    unit: null,
    role: 'maintenance',
    permissions: ['VIEW_ALL_ISSUES', 'MANAGE_ISSUES'],
  },
};

// Reusable test actions
export const commonActions = {
  signIn: async (page: any, userKey: keyof typeof TEST_USERS) => {
    const user = TEST_USERS[userKey];
    await page.goto(`${getTestUrl()}/sign-in`);
    await page.act(`enter ${user.email} in the email field`);
    await page.act(`enter ${user.password} in the password field`);
    await page.act('click the sign in button');
    await page.waitForURL('**/dashboard');
  },
  
  signOut: async (page: any) => {
    await page.act('click on the user menu');
    await page.act('click sign out');
    await page.waitForURL('**/sign-in');
  },
  
  navigateToIssues: async (page: any) => {
    await page.act('click on Issues in the sidebar');
  },
  
  navigateToBuildingIssues: async (page: any) => {
    await page.act('click on Issues in the sidebar');
    await page.act('click on Building Issues');
  },
};

// Test data schemas for extraction
export const extractionSchemas = {
  issueList: {
    instruction: 'extract all visible issues with their details',
    schema: {
      issues: [{
        title: 'string',
        status: 'string',
        severity: 'string',
        isPrivate: 'boolean',
        reporter: 'string',
        unit: 'string',
      }],
      totalCount: 'number',
      privateCount: 'number',
    },
  },
  
  userPermissions: {
    instruction: 'extract the current user permissions displayed',
    schema: {
      permissions: ['string'],
      role: 'string',
    },
  },
};