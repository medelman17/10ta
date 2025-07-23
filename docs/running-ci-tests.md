# Running CI E2E Tests

## Prerequisites

1. Set up GitHub Secrets (see `scripts/setup-github-secrets.md`)
2. Ensure your GitHub Actions are enabled

## Running Tests Manually

### Via GitHub UI:
1. Go to the Actions tab in your repository
2. Click on "E2E Tests (Simple)" workflow
3. Click "Run workflow" button
4. Select the branch (usually `main`)
5. Click "Run workflow"

### Via GitHub CLI:
```bash
gh workflow run e2e-tests-simple.yml
```

### View Results:
```bash
# List recent workflow runs
gh run list --workflow=e2e-tests-simple.yml

# View a specific run
gh run view <run-id>

# Watch a run in progress
gh run watch <run-id>
```

## Testing Locally

Before pushing to CI, test locally:

```bash
# Run the local CI test script
./scripts/test-ci-locally.sh

# Or manually:
export TEST_RUN_ID="local-test-$(date +%s)"
pnpm test-users:create
pnpm test-data:seed
pnpm test:e2e
pnpm test-data:clean
pnpm test-users:delete
```

## Workflow Configuration

The workflow is currently set to manual trigger only. To enable automatic runs:

1. Edit `.github/workflows/e2e-tests-simple.yml`
2. Uncomment the `pull_request` trigger:
   ```yaml
   on:
     workflow_dispatch:
     pull_request:
       types: [opened, synchronize]
   ```

## Troubleshooting

### Tests Fail to Find Elements
- Check if Clerk is loading properly
- Verify test user creation succeeded
- Look at screenshots in workflow artifacts

### Database Conflicts
- Each run uses unique test data with TEST_RUN_ID
- If cleanup fails, manually delete test data:
  ```bash
  export TEST_RUN_ID="<the-run-id>"
  pnpm test-data:clean
  pnpm test-users:delete
  ```

### API Key Issues
- Verify OpenAI API key is set in GitHub secrets
- Check rate limits on test API key

## Next Steps

1. Set up dedicated test database (Neon branch)
2. Configure Clerk test instance
3. Enable Vercel preview deployments
4. Add parallel test execution

See `docs/ci-e2e-strategy.md` for the full roadmap.