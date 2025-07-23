import { Stagehand } from '@browserbasehq/stagehand';
import { testConfig, getTestUrl } from './setup/stagehand.config';

describe('Simple StageHand Test', () => {
  let stagehand: Stagehand;
  
  test('can navigate to sign-in page', async () => {
    console.log('Creating StageHand instance...');
    stagehand = new Stagehand({
      ...testConfig,
      headless: false, // Show browser for debugging
    });
    
    console.log('Initializing StageHand...');
    await stagehand.init();
    
    console.log('Getting page object...');
    const page = stagehand.page;
    
    console.log('Navigating to:', `${getTestUrl()}/sign-in`);
    await page.goto(`${getTestUrl()}/sign-in`);
    
    console.log('Waiting for page to load...');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('Checking page title...');
    const title = await page.title();
    console.log('Page title:', title);
    
    expect(title).toContain('10 Ocean');
    
    console.log('Closing StageHand...');
    await stagehand.close();
  });
});