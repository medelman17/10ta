import { TEST_USERS } from '../setup/stagehand.config';

/**
 * Generate unique test data for CI runs
 */
export function generateUniqueTestData(runId: string) {
  const uniqueUsers = Object.entries(TEST_USERS).reduce((acc, [key, user]) => {
    return {
      ...acc,
      [key]: {
        ...user,
        email: user.email.replace('@test.com', `-${runId}@test.com`),
      },
    };
  }, {});

  return {
    users: uniqueUsers,
    buildingName: `Test Building ${runId}`,
    buildingAddress: `${runId} Test Street`,
  };
}

/**
 * Wait for a URL to be available
 */
export async function waitForUrl(url: string, maxAttempts = 30, delayMs = 2000) {
  console.log(`Waiting for ${url} to be available...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✓ ${url} is ready`);
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    if (i < maxAttempts - 1) {
      console.log(`Attempt ${i + 1}/${maxAttempts} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error(`${url} did not become available after ${maxAttempts} attempts`);
}

/**
 * Clean up test data for a specific run
 */
export async function cleanupTestData(runId: string) {
  // This would be implemented to clean up database records
  // For now, we rely on the test scripts
  console.log(`Cleaning up test data for run ${runId}`);
}