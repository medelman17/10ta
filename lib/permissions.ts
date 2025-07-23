// Permission definitions for the tenant association platform

export const PERMISSIONS = {
  // Issue Management
  VIEW_ALL_ISSUES: 'view_all_issues', // View all issues including private ones
  MANAGE_ISSUES: 'manage_issues', // Change status, assign, moderate
  DELETE_ISSUES: 'delete_issues', // Delete any issue
  EXPORT_ISSUES: 'export_issues', // Export issue data
  
  // Tenant Management
  VIEW_ALL_TENANTS: 'view_all_tenants', // Access full tenant directory
  MANAGE_TENANTS: 'manage_tenants', // Approve/reject requests, transfer units
  MANAGE_UNIT_REQUESTS: 'manage_unit_requests', // Handle unit assignment requests
  CONTACT_TENANTS: 'contact_tenants', // Send messages to tenants
  
  // Building Management
  MANAGE_BUILDING: 'manage_building', // Edit building info, units, policies
  VIEW_BUILDING_ANALYTICS: 'view_building_analytics', // Access detailed analytics
  MANAGE_BUILDING_SETTINGS: 'manage_building_settings', // Configure building-wide settings
  
  // Communication Management
  VIEW_ALL_COMMUNICATIONS: 'view_all_communications', // See all tenant communications
  MODERATE_COMMUNICATIONS: 'moderate_communications', // Edit/delete communications
  
  // Admin Management
  MANAGE_ADMINS: 'manage_admins', // Grant/revoke admin access
  VIEW_AUDIT_LOGS: 'view_audit_logs', // Access security audit logs
  MANAGE_PERMISSIONS: 'manage_permissions', // Modify permission assignments
  
  // Association Features
  MANAGE_PETITIONS: 'manage_petitions', // Create/edit/delete petitions
  MANAGE_MEETINGS: 'manage_meetings', // Schedule and manage meetings
  MANAGE_ASSOCIATION: 'manage_association', // Overall association management
  
  // System Features
  VIEW_SYSTEM_HEALTH: 'view_system_health', // System monitoring
  MANAGE_INTEGRATIONS: 'manage_integrations', // Third-party integrations
  BULK_OPERATIONS: 'bulk_operations', // Perform bulk actions
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  
  BUILDING_MANAGER: [
    PERMISSIONS.VIEW_ALL_ISSUES,
    PERMISSIONS.MANAGE_ISSUES,
    PERMISSIONS.VIEW_ALL_TENANTS,
    PERMISSIONS.MANAGE_TENANTS,
    PERMISSIONS.MANAGE_UNIT_REQUESTS,
    PERMISSIONS.MANAGE_BUILDING,
    PERMISSIONS.VIEW_BUILDING_ANALYTICS,
    PERMISSIONS.VIEW_ALL_COMMUNICATIONS,
    PERMISSIONS.MANAGE_PETITIONS,
    PERMISSIONS.MANAGE_MEETINGS,
  ],
  
  OFFICE_STAFF: [
    PERMISSIONS.VIEW_ALL_ISSUES,
    PERMISSIONS.VIEW_ALL_TENANTS,
    PERMISSIONS.MANAGE_UNIT_REQUESTS,
    PERMISSIONS.VIEW_BUILDING_ANALYTICS,
    PERMISSIONS.CONTACT_TENANTS,
  ],
  
  MAINTENANCE_STAFF: [
    PERMISSIONS.VIEW_ALL_ISSUES,
    PERMISSIONS.MANAGE_ISSUES,
    PERMISSIONS.VIEW_ALL_TENANTS,
  ],
  
  ASSOCIATION_BOARD: [
    PERMISSIONS.VIEW_ALL_ISSUES,
    PERMISSIONS.VIEW_ALL_TENANTS,
    PERMISSIONS.MANAGE_PETITIONS,
    PERMISSIONS.MANAGE_MEETINGS,
    PERMISSIONS.MANAGE_ASSOCIATION,
    PERMISSIONS.VIEW_BUILDING_ANALYTICS,
  ],
} as const;

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [PERMISSIONS.VIEW_ALL_ISSUES]: 'View all issues in the building, including private ones',
  [PERMISSIONS.MANAGE_ISSUES]: 'Change issue status, assign to staff, and moderate content',
  [PERMISSIONS.DELETE_ISSUES]: 'Permanently delete issues',
  [PERMISSIONS.EXPORT_ISSUES]: 'Export issue data to CSV or PDF',
  
  [PERMISSIONS.VIEW_ALL_TENANTS]: 'Access the complete tenant directory',
  [PERMISSIONS.MANAGE_TENANTS]: 'Approve tenant requests, transfer units, and manage accounts',
  [PERMISSIONS.MANAGE_UNIT_REQUESTS]: 'Handle unit assignment and transfer requests',
  [PERMISSIONS.CONTACT_TENANTS]: 'Send direct messages to tenants',
  
  [PERMISSIONS.MANAGE_BUILDING]: 'Edit building information, units, and policies',
  [PERMISSIONS.VIEW_BUILDING_ANALYTICS]: 'Access detailed building analytics and reports',
  [PERMISSIONS.MANAGE_BUILDING_SETTINGS]: 'Configure building-wide settings and preferences',
  
  [PERMISSIONS.VIEW_ALL_COMMUNICATIONS]: 'View all tenant-landlord communications',
  [PERMISSIONS.MODERATE_COMMUNICATIONS]: 'Edit or delete inappropriate communications',
  
  [PERMISSIONS.MANAGE_ADMINS]: 'Grant or revoke administrative access',
  [PERMISSIONS.VIEW_AUDIT_LOGS]: 'View security audit logs and admin actions',
  [PERMISSIONS.MANAGE_PERMISSIONS]: 'Modify permission assignments for users',
  
  [PERMISSIONS.MANAGE_PETITIONS]: 'Create, edit, and manage tenant petitions',
  [PERMISSIONS.MANAGE_MEETINGS]: 'Schedule and manage association meetings',
  [PERMISSIONS.MANAGE_ASSOCIATION]: 'Overall tenant association management',
  
  [PERMISSIONS.VIEW_SYSTEM_HEALTH]: 'Monitor system health and performance',
  [PERMISSIONS.MANAGE_INTEGRATIONS]: 'Configure third-party integrations',
  [PERMISSIONS.BULK_OPERATIONS]: 'Perform bulk operations on data',
};

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = {
  'Issue Management': [
    PERMISSIONS.VIEW_ALL_ISSUES,
    PERMISSIONS.MANAGE_ISSUES,
    PERMISSIONS.DELETE_ISSUES,
    PERMISSIONS.EXPORT_ISSUES,
  ],
  'Tenant Management': [
    PERMISSIONS.VIEW_ALL_TENANTS,
    PERMISSIONS.MANAGE_TENANTS,
    PERMISSIONS.MANAGE_UNIT_REQUESTS,
    PERMISSIONS.CONTACT_TENANTS,
  ],
  'Building Management': [
    PERMISSIONS.MANAGE_BUILDING,
    PERMISSIONS.VIEW_BUILDING_ANALYTICS,
    PERMISSIONS.MANAGE_BUILDING_SETTINGS,
  ],
  'Communications': [
    PERMISSIONS.VIEW_ALL_COMMUNICATIONS,
    PERMISSIONS.MODERATE_COMMUNICATIONS,
  ],
  'Administration': [
    PERMISSIONS.MANAGE_ADMINS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_PERMISSIONS,
  ],
  'Association': [
    PERMISSIONS.MANAGE_PETITIONS,
    PERMISSIONS.MANAGE_MEETINGS,
    PERMISSIONS.MANAGE_ASSOCIATION,
  ],
  'System': [
    PERMISSIONS.VIEW_SYSTEM_HEALTH,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.BULK_OPERATIONS,
  ],
} as const;