# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

10ta is a tenant association platform built to help tenants document issues, coordinate responses, and advocate for better living conditions. The platform uses a modern tech stack with NextJS 15+, TypeScript, Prisma, and AI-powered features.

**IMPORTANT**: This is a platform for TENANT EMPOWERMENT and COLLECTIVE ACTION, not property management. Every feature should help tenants organize and advocate for their rights, not be managed from above.

## User Personas

Every feature we build should serve one or more of these personas:

### 🏠 The Affected Tenant ("Sarah")
**Who**: A tenant experiencing issues who needs help documenting and resolving them
**Needs**: Document issues with evidence, see if neighbors have similar problems, learn rights, get templates, track landlord responses
**Features**: Issue reporting, anonymous options, rights resources, communication templates, building heat maps

### 🔥 The Tenant Organizer ("Marcus")  
**Who**: Proactive tenant who coordinates with neighbors and organizes collective action
**Needs**: Create petitions, schedule meetings, build evidence, coordinate actions, connect tenants
**Features**: Petition tools, meeting management, analytics, neighbor messaging, campaign planning

### 📋 The Association Leader ("Diana")
**Who**: Elected/volunteer leader who interfaces with landlords, media, and legal advocates
**Needs**: Formal communications, generate reports, track membership, coordinate with advocates
**Features**: Association dashboard, member directory, document library, report generation, audit trails

### 🆕 The New Tenant ("Alex")
**Who**: Recently moved in, wants to understand building issues and connect safely
**Needs**: Learn building history, connect with neighbors, find resources, join association
**Features**: Public heat map, neighbor introductions, resource library, association onboarding

### 🤝 The Supportive Neighbor ("Rita")
**Who**: Wants to help but not lead - signs petitions, attends meetings, offers support
**Needs**: Stay informed, support efforts, easy participation, anonymous options
**Features**: Quick petition signing, meeting RSVP, issue verification, digest notifications

### ⚖️ The External Advocate ("James")
**Who**: Legal aid lawyer, housing activist, or volunteer helping with expertise
**Needs**: Access building data, generate reports, provide resources, track history
**Features**: Analytics access, export capabilities, document access, anonymous aggregation

## Key Principles

1. **Empowerment, not management**: Features help tenants organize and advocate, not be managed
2. **Privacy-first**: Tenants control their information and visibility
3. **Collective action**: Features facilitate group coordination
4. **Documentation for advocacy**: Everything logged can build legal cases
5. **Accessible to all**: From tech-savvy organizers to elderly neighbors

## Feature Alignment

✅ **Do build**: 
- Tools for documenting and sharing issues
- Organizing and coordination features
- Rights education and resources
- Collective action tools
- Privacy-respecting communication

❌ **Don't build**:
- Top-down management tools
- Landlord-serving features
- Mandatory verification systems
- Features that expose tenant data
- Anything that could be used against tenants

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
- **Tenants**: Can report issues, view building-wide data, participate in petitions, connect with neighbors
- **Association Leaders**: Elected/appointed by tenants to manage meetings, create petitions, access analytics, coordinate with external advocates
- **Building Organizers**: Trusted tenants who help onboard neighbors, moderate content, and support the association
- **External Advocates**: Read-only access to anonymized data for legal/advocacy support
- **Superusers**: Platform maintainers (hardcoded emails in NEXT_PUBLIC_SUPER_USER_EMAILS)

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

## Reframing Existing Features

When working with existing "admin" features, reframe them for tenant empowerment:

- **"Building Admin" → "Association Leader"**: Elected by tenants, not imposed
- **"Unit Assignment" → "Neighbor Verification"**: Tenants verify each other
- **"Tenant Directory" → "Association Members"**: Opt-in directory
- **"Unit Management" → "Building Visualization"**: For organizing, not managing
- **"Tenant Profiles" → "Member Profiles"**: Self-managed, privacy-first

## Common Development Patterns

### Adding a New Association Feature
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