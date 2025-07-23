# Deferred Work Queue

This document tracks all deferred work items for future implementation.

## CI/CD E2E Testing (Future Phases)

### Phase 2: Isolated Testing Environment
- **Set up test database strategy with Neon branching** (Todo #88)
  - Create dedicated Neon branch for testing
  - Automate branch creation/deletion in CI
  - Implement database reset between test runs
  
- **Configure dedicated Clerk test environment** (Todo #89)
  - Set up separate Clerk development instance
  - Use CLERK_TEST_* environment variables
  - Implement test user TTL and cleanup

### Phase 3: Full Integration
- **Integrate Vercel preview deployments for E2E tests** (Todo #94)
  - Use PR preview URLs for testing
  - Wait for deployment before running tests
  - Test against production-like environment
  
- **Set up Browserbase for cloud browser automation** (Todo #95)
  - More reliable than local browsers in CI
  - Better debugging with session recordings
  - Optimized for CI/CD environments
  
- **Implement parallel test execution** (Todo #90)
  - Use GitHub Actions matrix strategy
  - Shard tests by feature area
  - Reduce overall test execution time

### Phase 4: Advanced Features
- **Add visual regression testing** (Todo #96)
  - Screenshot comparisons for UI changes
  - Catch unintended visual regressions
  
- **Implement performance benchmarks in CI** (Todo #97)
  - Track page load times
  - Monitor bundle size changes
  - Alert on performance regressions
  
- **Add automatic PR comments with test results** (Todo #98)
  - Summarize test results in PR
  - Link to failure artifacts
  - Show performance metrics

## API Permission System

- **Apply permissions to remaining endpoints** (Todos #74-77)
  - Issue detail endpoints
  - Communications endpoints
  - Unit management endpoints
  - Analytics endpoints

- **Advanced permission features** (Todos #68, #70)
  - Permission inheritance and cascading
  - Create permission denied error pages

## User Stories (Deferred)

- **Story 6: Build timeline and evidence builder with PDF export** (Todo #26)
- **Story 7: Create collective petition system** (Todo #27)
- **Story 8: Integrate AI categorization with pgvector** (Todo #28)
- **Story 9: Build rights assistant chatbot with Zep memory** (Todo #29)
- **Story 10: Implement AI letter generation feature** (Todo #30)

## Platform Features

### Admin Tools
- **Bulk tenant operations** (Todo #35)
- **Admin analytics dashboard** (Todo #36)
- **Admin notification system** (Todo #37)
- **Comprehensive audit logging** (Todo #38)

### Association Features
- **Association pages** (Todo #40)
  - /dashboard/association/petitions
  - /dashboard/association/meetings
  - /dashboard/association/neighbors

### General Platform
- **Calendar page** (Todo #42)
- **Help & resources page** (Todo #43)
- **Settings page with privacy controls** (Todo #44)
- **Communication templates** (Todo #59)
- **Export functionality for reports** (Todo #24)

## Infrastructure & Performance

- **Redis integration** (Todo #45)
  - Caching layer
  - Real-time updates
  
- **Performance optimization** (Todo #49)
  - Pagination improvements
  - Virtual scrolling
  - Advanced caching strategies

- **Security enhancements** (Todo #50)
  - Security audit
  - Rate limiting implementation

## Future Innovation

### Browser Automation Agents
- **Landlord portal automation** (Todo #82)
  - Navigate to payment portals
  - Extract rent information
  - Document payment history
  
- **Evidence collection automation** (Todo #83)
  - Automated screenshot capture
  - Document archiving
  
- **Automated rent tracking** (Todo #84)
  - Monitor rent changes
  - Track payment patterns
  
- **Rights research agent** (Todo #85)
  - Research tenant rights
  - Find relevant regulations
  - Suggest legal resources

## How to Resume Work

When ready to tackle any of these items:

1. Move the todo from "pending" to "in_progress" status
2. Review the original requirements and context
3. Check for any dependencies or prerequisites
4. Implement incrementally with proper testing
5. Update this document as items are completed

## Priority Guidelines

When resuming work, consider:
- **High Priority**: Items blocking production readiness
- **Medium Priority**: Features enhancing user experience
- **Low Priority**: Nice-to-have features and optimizations

Focus on completing high-priority items first, especially those related to security, permissions, and core functionality.