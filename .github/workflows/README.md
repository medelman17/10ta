# GitHub Actions Workflows

## Required Secrets

The E2E tests workflow requires the following secrets to be configured in your repository:

### 1. DATABASE_URL (Required)
Your Neon database connection string. You can get this from:
- Vercel dashboard → Project Settings → Environment Variables
- Or directly from Neon dashboard

### 2. CLERK_SECRET_KEY (Required)
Your Clerk secret key for backend operations:
- Get from Clerk dashboard → API Keys
- Or from Vercel environment variables

### 3. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (Required)
Your Clerk publishable key:
- Get from Clerk dashboard → API Keys
- Or from Vercel environment variables

### 4. OPENAI_API_KEY (Optional - for AI tests)
OpenAI API key for StageHand AI-powered tests:
- Create at https://platform.openai.com/api-keys
- Can use a test key with lower spending limits

### 5. BROWSERBASE_API_KEY (Optional - future)
For BrowserBase integration (not used yet)

### 6. BROWSERBASE_PROJECT_ID (Optional - future)
For BrowserBase integration (not used yet)

## How to Add Secrets

### Via GitHub UI:
1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the name and value

### Via GitHub CLI:
```bash
# Get values from Vercel
vercel env pull .env.production

# Then add to GitHub (replace with actual values)
gh secret set DATABASE_URL --body "postgresql://..."
gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --body "pk_live_..."
gh secret set CLERK_SECRET_KEY --body "sk_live_..."
gh secret set OPENAI_API_KEY --body "sk-..." # Optional
```

## Temporary Solution

If you want to disable the E2E tests temporarily while setting up secrets, you can comment out the trigger in `.github/workflows/e2e-tests.yml`:

```yaml
on:
  # pull_request:
  #   branches: [main]
  # push:
  #   branches: [main]
  workflow_dispatch:
```

This will only allow manual runs of the workflow.