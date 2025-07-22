# Database Schema Design

## Overview

The 10ta database schema is designed to support a multi-building tenant association platform with a focus on issue tracking, communication logging, and community organizing. The schema prioritizes data integrity, privacy controls, and audit trails for potential legal use.

## Key Design Decisions

### 1. Multi-Building Support
- The `Building` model allows the platform to scale beyond a single building
- Each building has configurable floors and units per floor (defaulting to 10 floors, A-H units)
- Building-specific roles ensure proper access control

### 2. Unit Naming Convention
- Units follow the pattern: `[floor][line]` (e.g., "5B" for 5th floor, B line)
- Separate storage of floor (Int) and line (String) enables:
  - Vertical analysis (water damage cascading down B line)
  - Floor-based grouping (all 5th floor units)
  - Flexible querying patterns

### 3. Temporal Tenancy Tracking
- The `Tenancy` model tracks historical occupancy
- Supports multiple tenants per unit (roommates)
- Maintains history when tenants move between units
- `isCurrent` flag for quick active tenant queries

### 4. Privacy-First Design
- User-level privacy settings:
  - `shareContactInfo`: Opt-in contact sharing
  - `allowNeighborMessages`: Control neighbor communications
  - `publicIssuesByDefault`: Default visibility for new issues
- Issue-level privacy with `isPublic` flag
- Petition visibility control for public advocacy

### 5. Role-Based Access Control
- Three role levels: `TENANT`, `ASSOCIATION_ADMIN`, `BUILDING_ADMIN`
- Roles are scoped to buildings (a user can have different roles in different buildings)
- Separate from Clerk authentication for flexibility

### 6. Comprehensive Issue Tracking
- Rich metadata: category, severity, status
- AI-ready with vector embeddings for semantic search
- Issue relationships for "me too" functionality and pattern detection
- Full audit trail with timestamps

### 7. Communication Documentation
- Tracks all landlord interactions with type and direction
- Response tracking for measuring landlord responsiveness
- Linked to specific issues for context
- Media attachments for evidence

### 8. Polymorphic Media Storage
- Single `Media` table with polymorphic associations
- Can attach to issues, communications, or comments
- Stores metadata for legal documentation
- References Vercel Blob Storage URLs

### 9. Community Features
- **Petitions**: Digital signature collection with deadlines
- **Meetings**: RSVP tracking, minutes, and action items
- **Comments**: Threaded discussions on issues

### 10. Audit Trail
- Generic `AuditLog` for tracking all significant actions
- Stores user, action, entity type/ID, and metadata
- Critical for legal proceedings and accountability

## Indexing Strategy

Indexes are placed on:
- Foreign keys for join performance
- Frequently filtered columns (status, category, severity)
- Timestamp fields for chronological queries
- Unique constraints for data integrity

## Future Considerations

### AI/Vector Search
- `embedding` field on Issue model for semantic search
- Prepared for pgvector extension
- AI-suggested categorization fields

### Scalability
- Building-scoped queries prevent cross-tenant data access
- Efficient indexes for common query patterns
- Soft delete pattern can be added if needed

### Legal Compliance
- Comprehensive audit logging
- Immutable communication records
- Timestamp tracking on all entities
- Evidence chain preservation

## Data Integrity Rules

1. **Units must belong to buildings**
2. **Issues must have a reporter and be linked to a unit**
3. **Tenancies cannot overlap for the same user/unit**
4. **One signature per user per petition**
5. **One RSVP per user per meeting**

## Privacy Model

```
User Level:
├── shareContactInfo (default: false)
├── allowNeighborMessages (default: false)
└── publicIssuesByDefault (default: false)

Content Level:
├── Issue.isPublic (default: true)
└── Petition.isPublic (default: false)
```

## Query Patterns

Common queries the schema optimizes for:
1. All current tenants in a building
2. Issues by unit/floor/line/category/severity
3. Communication response times
4. Pattern detection (vertical line issues)
5. Petition signature counts
6. Meeting attendance tracking
7. User activity history