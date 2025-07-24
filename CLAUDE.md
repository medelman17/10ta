# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

10ta is a tenant association platform built to help tenants document issues, coordinate responses, and advocate for better living conditions. The platform uses a modern tech stack with NextJS 15+, TypeScript, Prisma, and AI-powered features.

## Tech Stack

- **Frontend**: NextJS 15+ (App Router), TypeScript, Tailwind CSS 4, ShadCN/UI
- **Database**: Neon Postgres with Prisma ORM
- **Authentication**: Clerk (with roles: tenant, association_admin, building_admin)
- **Storage**: Vercel Blob Storage for media files
- **AI**: Anthropic Claude API (via Vercel AI SDK), pgvector for semantic search
- **Deployment**: Vercel
- **Testing**: Jest + Playwright + Stagehand (Browserbase) for E2E
- **Monitoring**: Sentry for error tracking

## Development Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
pnpm typecheck              # Run TypeScript type checking

# Database
pnpm prisma generate        # Generate Prisma client
pnpm prisma migrate dev     # Run migrations
pnpm prisma studio          # Open database GUI
pnpm prisma db push         # Push schema changes without migration
pnpm db:seed               # Seed initial data

# Testing
pnpm test:e2e              # Run E2E tests
pnpm test:e2e:watch        # Watch mode E2E tests
pnpm test:setup            # Set up test data (users + data)

# Test Data Management
pnpm test-users:create     # Create test users in Clerk
pnpm test-users:delete     # Delete test users
pnpm test-users:list       # List test users
pnpm test-data:seed        # Seed test data in DB
pnpm test-data:clean       # Clean test data

# Library Management
pnpm library:seed          # Seed public documents

# Environment
vercel env pull .env.local # Pull environment variables from Vercel
```

## Project Structure

### Key Routes
- `/` - Public landing page
- `/sign-in`, `/sign-up` - Authentication
- `/onboarding` - New user unit assignment
- `/dashboard` - Main tenant dashboard
- `/dashboard/issues` - Issue management
- `/dashboard/communications` - Communication tracking
- `/dashboard/documents` - Document library
- `/dashboard/analytics` - Building analytics
- `/dashboard/association/*` - Association features (petitions, meetings, neighbors)
- `/dashboard/admin/*` - Admin features (access control, tenants, units)
- `/library` - Public document library

### API Routes Pattern
All API routes follow REST conventions:
- `/api/issues` - Issue CRUD + heatmap/statistics
- `/api/communications` - Communication CRUD
- `/api/communication-templates` - Template management
- `/api/documents` - Document management
- `/api/documents/folders` - Folder operations
- `/api/admin/*` - Admin operations (permissions, roles, unit requests)
- `/api/upload/analyze-image` - AI image analysis
- `/api/unit-requests` - Tenant unit requests
- `/api/user` - User profile management

### Key Libraries
- `/lib/db.ts` - Prisma client singleton
- `/lib/auth.ts` - Clerk authentication helpers
- `/lib/permissions.ts` - Permission system and checks
- `/lib/ai.ts` - AI integration (Claude API)
- `/lib/utils.ts` - Common utilities
- `/lib/unit-utils.ts` - Unit naming/validation
- `/lib/validations/*` - Zod schemas

### Important Hooks
- `usePermissions()` - Check user permissions
- `useBuilding()` - Get current building context
- `useSuperUser()` - Check superuser status

## Key Architecture Patterns

### Unit Structure
Buildings follow a format where units are numbered by floor + line:
- Example: "5B" = 5th floor, B line
- Floors: 1-10
- Lines: A-H
- Total: 80 units per building maximum

### Data Privacy Model
- Tenants can opt-in to share contact info and issues
- Issues can be marked public/private
- Anonymous reporting options available
- Granular privacy controls throughout

### Role-Based Access
- **Tenants**: Can report issues, view building-wide data, participate in petitions
- **Association Admins**: Can manage meetings, create petitions, access analytics
- **Building Admins**: Full access to all building data and administrative functions
- **Superusers**: Hardcoded emails in NEXT_PUBLIC_SUPER_USER_EMAILS env var

### Permission System
The platform uses a granular permission system (`/lib/permissions.ts`):
- 15+ distinct permissions (e.g., `view_all_issues`, `manage_tenants`)
- Permissions are granted per building with optional expiry
- Permission templates for common roles
- Audit logging for all permission changes
- Cached in React Query for performance

### API Protection Pattern
```typescript
// Standard API route protection
import { protectedRoute } from '@/lib/api-middleware';
import { checkPermission } from '@/lib/permissions';

export async function GET(req: Request) {
  return protectedRoute(req, async (userId, userRole) => {
    // Check specific permission
    const hasPermission = await checkPermission(userId, 'view_all_issues', buildingId);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Route logic here
  });
}
```

## Environment Variables

Required for development:
```bash
# Database
DATABASE_URL
DIRECT_DATABASE_URL

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Storage
BLOB_READ_WRITE_TOKEN

# AI
ANTHROPIC_API_KEY

# Testing
NEXT_PUBLIC_TEST_USER_PASSWORD
BROWSERBASE_API_KEY
BROWSERBASE_PROJECT_ID

# Monitoring
SENTRY_DSN
SENTRY_AUTH_TOKEN

# Superusers
NEXT_PUBLIC_SUPER_USER_EMAILS="email1@example.com,email2@example.com"
```

## Testing Setup

E2E tests use Jest + Playwright + Stagehand:
- Tests in `__tests__/e2e/`
- Configuration in `jest.config.e2e.js`
- Requires Browserbase account for cloud browser testing
- Tests create real Clerk users and clean up after
- AI features require valid Anthropic API key

## Common Development Patterns

### Adding a New Admin Feature
1. Create route in `/app/dashboard/admin/`
2. Add permission check using `checkPermission()`
3. Create API route with `protectedRoute` wrapper
4. Add to admin navigation in `/app/dashboard/admin/page.tsx`

### Creating a New Issue Category
1. Update `IssueCategory` enum in Prisma schema
2. Run `pnpm prisma generate`
3. Update category mappings in components
4. Add icon/color in issue display components

### Adding a New Document Category
1. Update `DocumentCategory` enum in Prisma schema
2. Run `pnpm prisma generate`
3. Update document upload/display components

### Implementing AI Features
1. Use `/lib/ai.ts` for Claude API integration
2. Follow pattern in `/api/upload/analyze-image`
3. Add appropriate error handling for API failures
4. Consider rate limiting for cost control

## Performance Considerations

- React Query caches all data fetches with 5-minute default
- Images served via Vercel Blob with CDN
- Database queries optimized with proper indexes
- Permission checks cached per request
- Building data loaded once per session

## Security Best Practices

- All routes protected by Clerk middleware
- Role-based permissions enforced at API level
- File uploads validated (type, size) before storage
- Rate limiting on AI endpoints
- Audit trails for all data modifications
- Superuser access restricted to hardcoded emails
- CORS configured for production domains only