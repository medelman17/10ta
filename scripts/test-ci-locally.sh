#!/bin/bash

# Script to test CI workflow locally
# This simulates what happens in GitHub Actions

echo "🧪 Testing CI workflow locally..."
echo ""

# Set a unique test run ID
export TEST_RUN_ID="local-$(date +%s)"
echo "📝 Test Run ID: $TEST_RUN_ID"
echo ""

# 1. Create test users
echo "1️⃣ Creating test users..."
pnpm test-users:create
if [ $? -ne 0 ]; then
    echo "❌ Failed to create test users"
    exit 1
fi
echo ""

# 2. Seed test data
echo "2️⃣ Seeding test data..."
pnpm test-data:seed
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed test data"
    # Clean up users before exiting
    pnpm test-users:delete
    exit 1
fi
echo ""

# 3. Run E2E tests
echo "3️⃣ Running E2E tests..."
export HEADLESS=true
pnpm test:e2e
TEST_RESULT=$?
echo ""

# 4. Clean up test data
echo "4️⃣ Cleaning up test data..."
pnpm test-data:clean
pnpm test-users:delete
echo ""

# Report results
if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ CI tests passed!"
else
    echo "❌ CI tests failed!"
    exit 1
fi