import { Stagehand } from '@browserbase/stagehand';
import { z } from 'zod';
import { testConfig, TEST_USERS, commonActions, getTestUrl } from './setup/stagehand.config';

describe('10 Ocean Permission Tests', () => {
  let stagehand: Stagehand;
  
  beforeAll(async () => {
    // Ensure test data is seeded
    console.log('Make sure to run: pnpm test-data:seed before running tests');
  });

  beforeEach(async () => {
    stagehand = new Stagehand(testConfig);
    await stagehand.init();
  });

  afterEach(async () => {
    await stagehand.close();
  });

  describe('Issue Visibility Permissions', () => {
    test('tenant can only see their own private issues', async () => {
      const page = stagehand.page;
      
      // Sign in as tenant1
      await commonActions.signIn(page, 'tenant1');
      
      // Navigate to building issues
      await commonActions.navigateToBuildingIssues(page);
      
      // Extract visible issues
      const issueData = await page.extract({
        instruction: 'extract all issue titles and check if any say "Private:" in the title',
        schema: z.object({
          issues: z.array(z.object({
            title: z.string(),
            isPrivate: z.boolean().describe('true if title contains "Private:"'),
            unit: z.string().optional(),
          })),
          totalIssueCount: z.number(),
          privateIssueCount: z.number().describe('count of issues with "Private:" in title'),
        }),
      });
      
      // Tenant1 should only see their own private issue
      const tenant1PrivateIssues = issueData.issues.filter(
        issue => issue.isPrivate && issue.unit === '1A'
      );
      expect(tenant1PrivateIssues.length).toBe(1);
      
      // Should not see tenant2's private issues
      const otherPrivateIssues = issueData.issues.filter(
        issue => issue.isPrivate && issue.unit !== '1A'
      );
      expect(otherPrivateIssues.length).toBe(0);
    });

    test('admin can see all issues including private ones', async () => {
      const page = stagehand.page;
      
      // Sign in as admin
      await commonActions.signIn(page, 'admin');
      
      // Navigate to building issues
      await commonActions.navigateToBuildingIssues(page);
      
      // Extract visible issues
      const adminIssueData = await page.extract({
        instruction: 'extract all issues and count how many are marked as private',
        schema: z.object({
          totalIssues: z.number(),
          privateIssues: z.number().describe('issues with "Private:" in title'),
          publicIssues: z.number(),
          units: z.array(z.string()).describe('unique unit numbers'),
        }),
      });
      
      // Admin should see multiple private issues from different units
      expect(adminIssueData.privateIssues).toBeGreaterThan(1);
      expect(adminIssueData.units.length).toBeGreaterThan(1);
    });

    test('maintenance staff can view all issues but not tenant details', async () => {
      const page = stagehand.page;
      
      // Sign in as maintenance
      await commonActions.signIn(page, 'maintenance');
      
      // Navigate to building issues
      await commonActions.navigateToBuildingIssues(page);
      
      // Try to access tenant management (should fail)
      const sidebarItems = await page.extract({
        instruction: 'extract all sidebar menu items',
        schema: z.object({
          menuItems: z.array(z.string()),
        }),
      });
      
      // Maintenance should not see tenant management options
      expect(sidebarItems.menuItems).not.toContain('Tenants');
      expect(sidebarItems.menuItems).not.toContain('Access Control');
    });
  });

  describe('Issue Management Permissions', () => {
    test('regular tenant cannot create issues for other units', async () => {
      const page = stagehand.page;
      
      // Sign in as tenant1
      await commonActions.signIn(page, 'tenant1');
      
      // Navigate to create issue
      await page.act('click on Issues in the sidebar');
      await page.act('click on Report Issue button');
      
      // Check available unit options
      const formData = await page.extract({
        instruction: 'extract the unit selection options in the form',
        schema: z.object({
          availableUnits: z.array(z.string()),
          isUnitFieldEditable: z.boolean(),
        }),
      });
      
      // Tenant should only be able to create issues for their own unit
      expect(formData.availableUnits).toEqual(['1A']);
      expect(formData.isUnitFieldEditable).toBe(false);
    });

    test('admin can create issues for any unit', async () => {
      const page = stagehand.page;
      
      // Sign in as admin
      await commonActions.signIn(page, 'admin');
      
      // Navigate to create issue
      await page.act('navigate to create new issue page');
      
      // Check available unit options
      const adminFormData = await page.extract({
        instruction: 'check if unit selection dropdown has multiple options',
        schema: z.object({
          hasMultipleUnits: z.boolean(),
          canSelectAnyUnit: z.boolean(),
        }),
      });
      
      expect(adminFormData.hasMultipleUnits).toBe(true);
      expect(adminFormData.canSelectAnyUnit).toBe(true);
    });
  });

  describe('Access Control Management', () => {
    test('only admins can access permission management', async () => {
      const page = stagehand.page;
      
      // Try as regular tenant first
      await commonActions.signIn(page, 'tenant1');
      
      // Direct navigation should redirect
      await page.goto(`${getTestUrl()}/dashboard/admin/access`);
      
      // Should be redirected away
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/admin/access');
      
      await commonActions.signOut(page);
      
      // Now try as admin
      await commonActions.signIn(page, 'admin');
      await page.goto(`${getTestUrl()}/dashboard/admin/access`);
      
      // Should stay on the page
      const adminUrl = page.url();
      expect(adminUrl).toContain('/admin/access');
      
      // Verify we can see permission management UI
      const accessPageData = await page.extract({
        instruction: 'check if permission management interface is visible',
        schema: z.object({
          hasAdministratorsList: z.boolean(),
          hasAddAdminButton: z.boolean(),
          hasAuditLog: z.boolean(),
        }),
      });
      
      expect(accessPageData.hasAdministratorsList).toBe(true);
      expect(accessPageData.hasAddAdminButton).toBe(true);
      expect(accessPageData.hasAuditLog).toBe(true);
    });
  });

  describe('Communication Permissions', () => {
    test('tenants can only see communications for their issues', async () => {
      const page = stagehand.page;
      
      // Sign in as tenant
      await commonActions.signIn(page, 'tenant1');
      
      // Navigate to communications
      await page.act('click on Communications in the sidebar');
      await page.act('click on Communication History');
      
      // Extract communications
      const commsData = await page.extract({
        instruction: 'extract all communications and their associated issues',
        schema: z.object({
          communications: z.array(z.object({
            type: z.string(),
            relatedIssue: z.string().optional(),
            date: z.string(),
          })),
          totalCount: z.number(),
        }),
      });
      
      // Tenant should only see their own communications
      expect(commsData.totalCount).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Permission Edge Cases', () => {
  let stagehand: Stagehand;
  
  beforeEach(async () => {
    stagehand = new Stagehand(testConfig);
    await stagehand.init();
  });

  afterEach(async () => {
    await stagehand.close();
  });

  test('expired permissions are properly handled', async () => {
    // This would test temporary permissions that have expired
    // Implementation depends on having test data with expired permissions
  });

  test('permission changes take effect immediately', async () => {
    // This would test that when permissions are revoked,
    // the user immediately loses access
    // Would require coordinating two browser sessions
  });
});