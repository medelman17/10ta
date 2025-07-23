# E2E Testing with StageHand

This directory contains end-to-end tests for 10 Ocean using StageHand, an AI-powered browser automation framework.

## Prerequisites

1. **Install Dependencies**
   ```bash
   pnpm add -D @browserbase/stagehand playwright jest @types/jest ts-jest
   ```

2. **Set Environment Variables**
   ```bash
   # For local testing
   export OPENAI_API_KEY=your_openai_key
   
   # For CI/CD with Browserbase
   export BROWSERBASE_API_KEY=your_browserbase_key
   export BROWSERBASE_PROJECT_ID=your_project_id
   ```

3. **Prepare Test Data**
   ```bash
   # Create test users
   pnpm test-users:create
   
   # Seed test data
   pnpm test-data:seed
   ```

## Running Tests

### Local Development
```bash
# Start the development server
pnpm dev

# In another terminal, run tests
pnpm test:e2e
```

### Debug Mode
```bash
# Run with browser visible and debug output
DEBUG=true pnpm test:e2e
```

### Specific Test Suite
```bash
# Run only permission tests
pnpm test:e2e permissions
```

### CI/CD Environment
```bash
# Tests will run headless with Browserbase
CI=true pnpm test:e2e
```

## Test Structure

### `setup/stagehand.config.ts`
- StageHand configuration
- Test user credentials
- Common actions (sign in, navigation)
- Extraction schemas

### `permissions.test.ts`
- Issue visibility permissions
- Issue management permissions
- Access control permissions
- Communication permissions
- Edge cases

## Writing New Tests

1. **Use Natural Language Actions**
   ```typescript
   await page.act('click on the Issues link in the sidebar');
   ```

2. **Extract Structured Data**
   ```typescript
   const data = await page.extract({
     instruction: 'extract all issue titles',
     schema: z.object({
       issues: z.array(z.string())
     })
   });
   ```

3. **Leverage Common Actions**
   ```typescript
   await commonActions.signIn(page, 'admin');
   ```

## Best Practices

1. **Cache Repeated Actions**
   - Use `observe()` to preview actions
   - Cache login sequences
   - Reuse navigation patterns

2. **Keep Actions Atomic**
   - One action per `act()` call
   - Be specific: "click sign in button" not "log in"

3. **Use Descriptive Schemas**
   - Add `.describe()` to schema fields
   - Be explicit about what to extract

4. **Handle Dynamic Content**
   - Use `waitForURL()` after navigation
   - Allow time for data to load
   - Use retries for flaky elements

## Debugging Tips

1. **Enable Debug Mode**
   ```bash
   DEBUG=true pnpm test:e2e
   ```

2. **Take Screenshots**
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

3. **Log Extracted Data**
   ```typescript
   console.log('Extracted:', JSON.stringify(data, null, 2));
   ```

4. **Use Browser DevTools**
   - Run with `headless: false`
   - Pause execution with `await page.pause()`

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  env:
    CI: true
    BROWSERBASE_API_KEY: ${{ secrets.BROWSERBASE_API_KEY }}
    BROWSERBASE_PROJECT_ID: ${{ secrets.BROWSERBASE_PROJECT_ID }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: |
    pnpm test-users:create
    pnpm test-data:seed
    pnpm test:e2e
```

## Troubleshooting

### "Cannot find element" errors
- Ensure the page has loaded: `await page.waitForLoadState()`
- Use more specific descriptions
- Check if element is in viewport

### Flaky tests
- Add explicit waits: `await page.waitForSelector()`
- Use retry logic for dynamic content
- Ensure test data is consistent

### Performance issues
- Cache login sequences
- Run tests in parallel where possible
- Use `headless: true` in CI

## Future Enhancements

- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Cross-browser testing
- [ ] Mobile viewport testing
- [ ] Accessibility testing