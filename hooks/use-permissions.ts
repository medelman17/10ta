'use client';

import { useState, useEffect } from 'react';
import { Permission } from '@/lib/permissions';

interface UsePermissionsOptions {
  buildingId: string;
  permissions?: Permission[];
}

interface UsePermissionsResult {
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  loading: boolean;
}

export function usePermissions({ buildingId, permissions: requiredPermissions }: UsePermissionsOptions): UsePermissionsResult {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const response = await fetch(`/api/permissions?buildingId=${buildingId}`);
        if (response.ok) {
          const data = await response.json();
          setPermissions(data.permissions);
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoading(false);
      }
    }

    if (buildingId) {
      fetchPermissions();
    }
  }, [buildingId]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(perm => permissions.includes(perm));
  };

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(perm => permissions.includes(perm));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
  };
}

// Hook to check a single permission
export function useHasPermission(buildingId: string, permission: Permission): boolean {
  const { hasPermission, loading } = usePermissions({ buildingId });
  return !loading && hasPermission(permission);
}

// Hook to check if user has any of the given permissions
export function useHasAnyPermission(buildingId: string, permissions: Permission[]): boolean {
  const { hasAnyPermission, loading } = usePermissions({ buildingId });
  return !loading && hasAnyPermission(permissions);
}