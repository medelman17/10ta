import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';
import { testConfig, TEST_USERS, getTestUrl } from './setup/stagehand.config';

describe('Login and Permission Test', () => {
  let stagehand: Stagehand;
  
  beforeEach(async () => {
    stagehand = new Stagehand({
      ...testConfig,
      headless: false, // Show browser for debugging
    });
    await stagehand.init();
  });

  afterEach(async () => {
    if (stagehand) {
      try {
        await stagehand.close();
      } catch (error) {
        // Ignore close errors
      }
    }
  });

  test('tenant can login and see only their issues', async () => {
    const page = stagehand.page;
    const user = TEST_USERS.tenant1;
    
    // Navigate to sign in
    console.log('Navigating to sign-in page...');
    await page.goto(`${getTestUrl()}/sign-in`);
    await page.waitForLoadState('networkidle');
    
    // Sign in using StageHand's act method
    console.log('Signing in as tenant1...');
    await page.act(`type ${user.email} into the email field`);
    await page.act(`type ${user.password} into the password field`);
    await page.act('click the sign in button');
    
    // Wait for dashboard
    console.log('Waiting for dashboard...');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    
    // Navigate to issues
    console.log('Navigating to issues...');
    await page.act('click on Issues in the sidebar navigation');
    await page.waitForLoadState('networkidle');
    
    // Go to building issues
    console.log('Going to building issues...');
    await page.act('click on the Building Issues link or tab');
    await page.waitForLoadState('networkidle');
    
    // Extract issues data
    console.log('Extracting issue data...');
    const issueData = await page.extract({
      instruction: 'Find all issue cards on the page and extract their titles, checking if any contain the word "Private:"',
      schema: z.object({
        issues: z.array(z.object({
          title: z.string().describe('The title of the issue'),
          hasPrivateLabel: z.boolean().describe('true if the title contains "Private:"'),
        })),
        totalCount: z.number().describe('Total number of issues visible'),
      }),
    });
    
    console.log('Extracted issue data:', JSON.stringify(issueData, null, 2));
    
    // Verify tenant can see public issues and only their own private issues
    const privateIssues = issueData.issues.filter(issue => issue.hasPrivateLabel);
    console.log(`Found ${privateIssues.length} private issues`);
    
    // Tenant1 should see their own private issue ("Private: Noisy Neighbors")
    expect(privateIssues.length).toBe(1);
    expect(issueData.totalCount).toBeGreaterThanOrEqual(2); // At least 2 issues (their own)
  });

  test('admin can see all issues including private ones', async () => {
    const page = stagehand.page;
    const user = TEST_USERS.admin;
    
    // Navigate and sign in
    console.log('Signing in as admin...');
    await page.goto(`${getTestUrl()}/sign-in`);
    await page.waitForLoadState('networkidle');
    
    await page.act(`type ${user.email} into the email field`);
    await page.act(`type ${user.password} into the password field`);
    await page.act('click the sign in button');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    
    // Navigate to building issues
    console.log('Navigating to building issues...');
    await page.act('navigate to the building issues page');
    await page.waitForLoadState('networkidle');
    
    // Extract admin view
    console.log('Extracting admin view data...');
    const adminData = await page.extract({
      instruction: 'Count all issues, especially noting how many have "Private:" in their title',
      schema: z.object({
        totalIssues: z.number().describe('Total count of all issues'),
        privateIssues: z.number().describe('Count of issues with "Private:" in title'),
        uniqueUnits: z.array(z.string()).describe('List of unique unit numbers seen in issues'),
      }),
    });
    
    console.log('Admin view data:', JSON.stringify(adminData, null, 2));
    
    // Admin should see multiple private issues from different units
    expect(adminData.privateIssues).toBeGreaterThanOrEqual(1);
    expect(adminData.totalIssues).toBeGreaterThanOrEqual(3); // All test issues
  });
});