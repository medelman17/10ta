# 10ta - Tenant Association Platform

A modern tenant association platform built to help tenants document issues, coordinate responses, and advocate for better living conditions. 10ta empowers tenants with professional tools for issue tracking, communication logging, and collective action.

## 🏢 Overview

10ta provides tenants with a comprehensive platform to:
- **Document Issues**: Report and track maintenance problems with photo evidence and AI-powered categorization
- **Log Communications**: Record all interactions with landlords and property management with professional templates
- **Building Insights**: View building-wide issue patterns through interactive heat maps and analytics
- **Document Library**: Organize and share tenant rights resources, legal documents, and building information
- **Community Features**: Connect with neighbors, create petitions, and organize meetings
- **Advocacy Tools**: Access professional communication templates and comprehensive tenant resources

## 🚀 Features

### Issue Management
- **Smart Issue Reporting**: Upload photos with AI-powered analysis using Claude Vision API
- **Admin Issue Creation**: Building administrators can report issues for any unit
- **Categorization & Severity**: Automatic issue classification and severity detection
- **Building Heat Maps**: Interactive 10x8 grid visualization showing issue distribution by unit
- **Personal & Building Views**: Track your issues and see building-wide patterns
- **Evidence Collection**: Photo uploads with Vercel Blob Storage integration

### Communication Tracking
- **Professional Templates**: 9+ tenant advocacy letter templates for common scenarios
- **Communication Logging**: Track all interactions with landlords, property managers, and staff
- **Evidence Attachments**: Link documents, photos, and correspondence to communications
- **Follow-up Management**: Set reminders and track outstanding communications
- **Template Preview**: See how professional letters look with your information pre-filled

### Analytics & Insights
- **Building Analytics**: Issue trends, category breakdowns, and resolution metrics
- **Heat Map Visualization**: Color-coded building grid showing issue concentration
- **Time Series Charts**: Track issue patterns over time
- **Export Capabilities**: Generate reports for advocacy and legal purposes

### Association & Community
- **Petition System**: Create and sign petitions for building improvements
- **Meeting Management**: Schedule meetings, track RSVPs, and view minutes
- **Neighbor Directory**: Privacy-controlled neighbor discovery and messaging
- **Community Dashboard**: Stats overview and recent association activity
- **Privacy Controls**: Opt-in contact sharing and communication preferences

### Admin & Permissions
- **Granular Permissions**: Role-based access control with 15+ permission types
- **Unit Management**: Admin tools for tenant verification and unit assignments
- **Access Control**: Building-scoped permissions with inheritance
- **Audit Logging**: Track all permission changes and admin actions
- **Multi-Role Support**: Tenant, association admin, and building admin roles

## 🛠 Tech Stack

### Frontend
- **Next.js 15+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **ShadCN/UI** component library
- **Lucide React** for icons

### Backend & Database
- **Neon Postgres** with connection pooling
- **Prisma ORM** with type-safe queries
- **Vercel Blob Storage** for file uploads
- **Redis** for caching and real-time updates

### Authentication & Security
- **Clerk** for authentication with custom roles
- **Granular permissions** system
- **API middleware** for route protection
- **Rate limiting** and security headers

### AI & Analytics
- **Anthropic Claude API** for image analysis and categorization
- **Vercel AI SDK** for AI integrations
- **pgvector** for semantic search (future)
- **Professional templates** for tenant advocacy

### DevOps & Monitoring
- **Vercel** deployment platform
- **GitHub Actions** CI/CD pipeline
- **Sentry** error tracking and performance monitoring
- **StageHand + Browserbase** for E2E testing

## 🏗 Architecture

### Database Schema
```
Users → Tenancies → Units → Buildings
Issues → Communications → Templates
AdminPermissions → AuditLogs
```

### Unit Structure
Buildings follow a standardized **1A-10H format**:
- **Numbers (1-10)**: Floor levels
- **Letters (A-H)**: Unit lines per floor
- **Total**: 80 units per building maximum

### Privacy Model
- **Opt-in sharing** for contact information and issues
- **Public/private** issue visibility controls
- **Anonymous reporting** options available
- **Granular privacy** controls throughout platform

## 🚦 Getting Started

### Prerequisites
- **Node.js 18+**
- **pnpm** (recommended package manager)
- **PostgreSQL database** (Neon recommended)
- **Clerk account** for authentication
- **Vercel account** for deployment

### Environment Variables
Create `.env.local` file:
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# Monitoring
SENTRY_DSN="https://..."
SENTRY_AUTH_TOKEN="sntrys_..."

# Testing (optional)
BROWSERBASE_API_KEY="..."
BROWSERBASE_PROJECT_ID="..."
```

### Installation & Setup

1. **Clone and install dependencies:**
```bash
git clone https://github.com/your-org/10ta.git
cd 10ta
pnpm install
```

2. **Set up database:**
```bash
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
```

3. **Create test users:**
```bash
pnpm test-users:create
pnpm test-data:seed
```

4. **Start development server:**
```bash
pnpm dev
```

5. **Open browser:** http://localhost:3000

### Development Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint

# Database
pnpm prisma generate        # Generate Prisma client
pnpm prisma migrate dev     # Run migrations
pnpm prisma studio          # Open database GUI
pnpm db:seed               # Seed initial data

# Testing
pnpm test:e2e              # Run E2E tests
pnpm test:e2e:watch        # Watch mode E2E tests
pnpm test:setup            # Set up test data

# Test Data Management
pnpm test-users:create     # Create test users
pnpm test-users:delete     # Delete test users
pnpm test-users:list       # List test users
pnpm test-data:seed        # Seed test data
pnpm test-data:clean       # Clean test data
```

## 📱 Key User Flows

### For Tenants
1. **Sign up** and verify unit assignment
2. **Report issues** with photos and descriptions
3. **View building insights** through heat maps
4. **Log communications** with professional templates
5. **Track follow-ups** and resolution progress

### For Admins
1. **Approve tenant** unit requests
2. **Manage permissions** and access control
3. **View building analytics** and trends
4. **Coordinate responses** to building-wide issues
5. **Generate reports** for advocacy efforts

## 🔐 Permission System

### Role Hierarchy
- **Tenant**: Basic issue reporting and communication logging
- **Association Admin**: Building analytics, petition management, meeting coordination
- **Building Admin**: Full access to all building data and administrative functions

### Key Permissions
- `VIEW_ALL_ISSUES` - See all building issues
- `MANAGE_TENANTS` - Approve/reject tenant requests
- `VIEW_BUILDING_ANALYTICS` - Access analytics dashboard
- `MANAGE_UNIT_REQUESTS` - Handle unit assignment requests
- `VIEW_ALL_COMMUNICATIONS` - See all tenant communications
- And 10+ more granular permissions

## 🚀 Deployment

### Vercel Deployment
1. **Connect GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on push to main branch
4. **Database migrations** run automatically via postbuild hook

### CI/CD Pipeline
- **GitHub Actions** for automated testing
- **E2E tests** with StageHand and Browserbase
- **Type checking** and linting on every PR
- **Sentry integration** for error tracking
- **Automatic deployments** to production

## 📊 Analytics & Monitoring

### Built-in Analytics
- **Issue trends** over time
- **Category breakdowns** (maintenance, noise, security, etc.)
- **Resolution rates** and average response times
- **Building heat maps** for spatial issue analysis
- **Communication tracking** and follow-up management

### Monitoring Stack
- **Sentry** for error tracking and performance monitoring
- **Vercel** analytics for page views and Core Web Vitals
- **Database monitoring** through Neon dashboard
- **API rate limiting** and usage tracking

## 🤝 Contributing

### Development Workflow
1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make changes** and add tests
4. **Run linting** (`pnpm lint`)
5. **Test changes** (`pnpm test:e2e`)
6. **Commit changes** (`git commit -m 'Add amazing feature'`)
7. **Push to branch** (`git push origin feature/amazing-feature`)
8. **Open Pull Request**

### Code Standards
- **TypeScript** for all new code
- **ESLint** and **Prettier** for formatting
- **Conventional commits** for commit messages
- **Component documentation** with JSDoc
- **API documentation** with OpenAPI/Swagger

## 📚 API Documentation

### Core Endpoints
- `GET /api/issues` - List issues with filters
- `POST /api/issues` - Create new issue with photos
- `GET /api/communications` - List communications
- `POST /api/communications` - Log new communication
- `GET /api/communication-templates` - List templates
- `POST /api/communication-templates/[id]/preview` - Preview template
- `GET /api/issues/heatmap` - Building heat map data
- `GET /api/issues/statistics` - Analytics data
- `GET /api/documents` - List documents with permissions
- `POST /api/documents` - Upload document files
- `GET /api/admin/units` - List units for admin access

### Authentication
All API endpoints require authentication via Clerk session tokens. Role-based permissions are enforced at the API level.

## 🛣 Roadmap

### Completed ✅
- ✅ Issue reporting with AI-powered categorization
- ✅ Building heat maps and analytics dashboard
- ✅ Communication logging with professional templates
- ✅ Granular permission system
- ✅ E2E testing with CI/CD pipeline
- ✅ Template preview and application system

### In Progress 🚧
- 🚧 Admin template management interface
- 🚧 Permission inheritance and cascading

### Completed ✅
- ✅ Issue reporting with AI-powered categorization
- ✅ Building heat maps and analytics dashboard
- ✅ Communication logging with professional templates
- ✅ Granular permission system
- ✅ E2E testing with CI/CD pipeline
- ✅ Template preview and application system
- ✅ Document library with file management
- ✅ Association pages (petitions, meetings, neighbors)

### Planned 📅
- 📅 AI-powered rights assistant chatbot
- 📅 PDF export for legal documentation
- 📅 Mobile app with React Native

### Future Vision 🔮
- 🔮 AI interview system for template completion
- 🔮 Dynamic form generation from templates
- 🔮 Browser automation for landlord portals
- 🔮 Evidence collection automation
- 🔮 Automated rent tracking
- 🔮 Rights research agent

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support@10ta.org for urgent issues

### Common Issues
- **Database connection**: Ensure DATABASE_URL is correctly set
- **Authentication**: Verify Clerk keys and webhook configuration
- **File uploads**: Check BLOB_READ_WRITE_TOKEN permissions
- **Build errors**: Run `pnpm prisma generate` after schema changes

---

**10ta** - Empowering tenants through technology and collective action. 🏠✊

*Built with ❤️ for tenant advocates everywhere.*