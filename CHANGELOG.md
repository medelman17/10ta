# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Building Management Dashboard** - Comprehensive overview page with occupancy rates, unit statistics, and recent activity tracking
- **Unit Grid View** - Interactive 10x8 grid visualization showing unit status with color coding for vacant, occupied, and maintenance units
- **Unit Detail Pages** - Full unit information including current tenant, occupancy history, issues, and documents
- **Tenant Directory** - Searchable and filterable list of all building tenants with status indicators
- **Tenant Profiles** - Detailed tenant pages showing contact info, unit history, documents, and communications
- **Unit Assignment Modal** - Streamlined workflow for assigning tenants to vacant units with automatic transfer handling
- **Bulk Operations** - Select multiple tenants for bulk communications or data export
- **CSV Export** - Download tenant data in CSV format for external analysis
- **Occupancy Tracking** - Complete history of unit tenancies with move-in/out dates
- **Audit Logging** - Comprehensive logging of all administrative actions for compliance

### API Endpoints Added
- `GET /api/admin/buildings` - List all buildings
- `GET /api/admin/buildings/[id]` - Get building details  
- `GET /api/admin/buildings/[id]/units` - List units with filters
- `GET /api/admin/buildings/[id]/stats` - Building statistics
- `PUT /api/admin/buildings/[id]` - Update building configuration
- `GET /api/admin/units/[id]` - Get unit details with tenancy
- `GET /api/admin/units/[id]/issues` - List unit-specific issues
- `GET /api/admin/units/[id]/history` - Get occupancy history
- `POST /api/admin/units/[id]/assign` - Assign tenant to unit
- `POST /api/admin/units/[id]/vacate` - Mark unit as vacant
- `GET /api/admin/tenants` - List tenants with filters
- `GET /api/admin/tenants/[id]` - Get tenant profile
- `GET /api/admin/tenants/search` - Search tenants by query
- `PUT /api/admin/tenants/[id]` - Update tenant information
- `GET /api/admin/tenants/export` - Export tenant data as CSV
- `POST /api/admin/tenants/bulk-action` - Perform bulk operations

### Improved
- Permission system now includes building-scoped access control
- Unit management includes visual indicators for issues and vacancy duration
- Search functionality across tenants by name, email, phone, or unit
- Grid and list view options for better data visualization

## [0.2.0] - 2024-01-15

### Added
- **Association Features** - Petitions, meetings, and neighbor directory
- **Document Library** - Centralized document management with file uploads
- **Public Library Portal** - Public-facing pages for tenant resources
- **Landing Site** - Marketing pages and navigation for public visitors

### Improved
- Enhanced permission system with granular controls
- Better mobile responsiveness across all pages

## [0.1.0] - 2024-01-01

### Added
- **Issue Reporting** - Core issue tracking with photo uploads
- **AI Categorization** - Automatic issue classification using Claude Vision API
- **Building Heat Maps** - Visual representation of issue distribution
- **Communication Logging** - Track all landlord interactions
- **Professional Templates** - 9+ tenant advocacy letter templates
- **Analytics Dashboard** - Building-wide insights and trends
- **Authentication** - Clerk integration with role-based access

### Infrastructure
- Next.js 15 with App Router
- Prisma ORM with Neon Postgres
- Vercel deployment with blob storage
- GitHub Actions CI/CD pipeline
- Sentry error tracking