// Jest setup for E2E tests

// Increase timeout for browser-based tests
jest.setTimeout(60000);

// Global setup
beforeAll(async () => {
  console.log('🚀 Starting E2E test suite...');
  console.log('📍 Test URL:', process.env.TEST_URL || 'http://localhost:3001');
  
  // Verify environment
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  No AI API key found. Tests may fail.');
    console.warn('   Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
  }
});

// Global teardown
afterAll(async () => {
  console.log('✅ E2E test suite completed');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});