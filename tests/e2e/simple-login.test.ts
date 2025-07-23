import { Stagehand } from '@browserbasehq/stagehand';
import { testConfig, TEST_USERS, getTestUrl } from './setup/stagehand.config';

describe('Simple Login Test', () => {
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
        console.error('Error closing stagehand:', error);
      }
    }
  });

  test('can login as tenant', async () => {
    const page = stagehand.page;
    const user = TEST_USERS.tenant1;
    
    console.log('1. Navigating to sign-in page...');
    await page.goto(`${getTestUrl()}/sign-in`);
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what we're working with
    await page.screenshot({ path: 'login-page.png' });
    console.log('Screenshot saved as login-page.png');
    
    console.log('2. Looking for email input...');
    // Try to observe what actions are available
    const emailActions = await page.observe('find the email input field');
    console.log('Email field actions:', emailActions);
    
    if (emailActions && emailActions.length > 0) {
      console.log('3. Clicking on email field...');
      await page.act(emailActions[0]);
      
      console.log('4. Typing email...');
      await page.keyboard.type(user.email);
      
      console.log('5. Looking for password field...');
      const passwordActions = await page.observe('find the password input field');
      console.log('Password field actions:', passwordActions);
      
      if (passwordActions && passwordActions.length > 0) {
        console.log('6. Clicking on password field...');
        await page.act(passwordActions[0]);
        
        console.log('7. Typing password...');
        await page.keyboard.type(user.password);
        
        console.log('8. Looking for sign in button...');
        const signInActions = await page.observe('find the sign in button');
        console.log('Sign in button actions:', signInActions);
        
        if (signInActions && signInActions.length > 0) {
          console.log('9. Clicking sign in button...');
          await page.act(signInActions[0]);
          
          console.log('10. Waiting for navigation...');
          try {
            await page.waitForURL('**/dashboard', { timeout: 30000 });
            console.log('Successfully logged in and reached dashboard!');
            
            // Take a screenshot of the dashboard
            await page.screenshot({ path: 'dashboard.png' });
            console.log('Dashboard screenshot saved');
            
            expect(page.url()).toContain('/dashboard');
          } catch (error) {
            console.error('Failed to reach dashboard:', error);
            await page.screenshot({ path: 'login-failed.png' });
            throw error;
          }
        }
      }
    }
  });
});