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
- **Real-time**: Redis for updates and caching

## Key Architecture Patterns

### Unit Structure
Buildings follow a 1A-10H format where:
- Number (1-10): Floor number
- Letter (A-H): Unit line on that floor

### Data Privacy Model
- Tenants can opt-in to share contact info and issues
- Issues can be marked public/private
- Anonymous reporting options available
- Granular privacy controls throughout

### Role-Based Access
- **Tenants**: Can report issues, view building-wide data, participate in petitions
- **Association Admins**: Can manage meetings, create petitions, access analytics
- **Building Admins**: Full access to all building data and administrative functions

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run Prisma migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# Open Prisma Studio
pnpm prisma studio

# Run tests
pnpm test

# Run specific test file
pnpm test -- path/to/test.spec.ts
```

## Core Features Implementation Order

1. **Authentication & Unit Assignment** - Set up Clerk, create user/unit relationships
2. **Issue Reporting** - Basic CRUD with photo uploads via Vercel Blob
3. **Building Visualization** - Heat maps and issue distribution views
4. **Communication Tracking** - Log landlord interactions with evidence
5. **AI Features** - Categorization, rights assistant, letter generation
6. **Community Features** - Petitions, meetings, neighbor connections

## Database Schema Highlights

Key models to implement:
- User (via Clerk, extended with local profile)
- Unit (floor + line structure)
- Issue (with categories, severity, media attachments)
- Communication (linked to issues)
- Petition (with signatures)
- Meeting (with minutes and action items)

## API Design Patterns

- Use tRPC or API routes with Zod validation
- Implement proper error handling with descriptive messages
- Rate limiting for AI features and file uploads
- Audit logging for sensitive operations

## Testing Strategy

- Unit tests for utility functions and data transformations
- Integration tests for API endpoints
- E2E tests for critical user flows (issue reporting, petition signing)
- Accessibility testing for all UI components

## Performance Considerations

- Implement pagination for issue lists
- Use Redis caching for analytics and frequently accessed data
- Lazy load images with proper optimization
- Implement virtual scrolling for long lists
- Use database indexes on frequently queried fields (unit, category, status)

## Security Best Practices

- All routes protected by Clerk middleware
- Role-based permissions enforced at API level
- File uploads validated and scanned
- Rate limiting on all public endpoints
- Audit trails for all data modifications