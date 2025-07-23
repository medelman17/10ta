# GitHub Secrets Setup for E2E Tests

To run the E2E tests in GitHub Actions, you need to set up the following secrets in your repository:

## Required Secrets

1. **DATABASE_URL**
   - Your Neon database connection string
   - Get from Vercel environment variables

2. **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
   - Clerk publishable key
   - Get from Clerk dashboard or Vercel env

3. **CLERK_SECRET_KEY**
   - Clerk secret key for backend operations
   - Get from Clerk dashboard or Vercel env

4. **OPENAI_API_KEY**
   - OpenAI API key for StageHand AI
   - Create a test key with lower spending limits

## How to Add Secrets

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the name and value

## GitHub CLI Method

If you have the GitHub CLI installed:

```bash
# Example (replace with your actual values)
gh secret set DATABASE_URL --body "postgresql://..."
gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --body "pk_test_..."
gh secret set CLERK_SECRET_KEY --body "sk_test_..."
gh secret set OPENAI_API_KEY --body "sk-..."
```

## Triggering the Workflow

After setting up secrets:

1. Go to Actions tab in your repository
2. Select "E2E Tests (Simple)" workflow
3. Click "Run workflow" → "Run workflow"

Or use GitHub CLI:
```bash
gh workflow run e2e-tests-simple.yml
```

## Monitoring the Run

- Watch the workflow progress in the Actions tab
- Download artifacts if tests fail
- Check logs for detailed output