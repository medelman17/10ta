"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, Edit, Plus } from "lucide-react";
import { getHeaderAction, subscribeToHeaderAction } from "./page-header-context";
import { useState, useEffect } from "react";

interface PageInfo {
  title: string;
  subtitle?: string;
}

const pageInfo: Record<string, PageInfo> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Welcome to your tenant association platform",
  },
  "/dashboard/issues": {
    title: "Issues",
    subtitle: "Report and track maintenance issues in your building",
  },
  "/dashboard/issues/new": {
    title: "Report New Issue",
    subtitle: "Document a problem with your unit or building",
  },
  "/dashboard/issues/my": {
    title: "My Issues",
    subtitle: "View and manage issues you've reported",
  },
  "/dashboard/issues/building": {
    title: "Building Issues",
    subtitle: "View all public issues in your building",
  },
  "/dashboard/communications": {
    title: "Communications",
    subtitle: "Track interactions with landlords and management",
  },
  "/dashboard/communications/new": {
    title: "Log Communication",
    subtitle: "Document your interactions with landlords and management",
  },
  "/dashboard/communications/history": {
    title: "Communication History",
    subtitle: "View all logged communications",
  },
  "/dashboard/analytics": {
    title: "Analytics",
    subtitle: "View building-wide trends and insights",
  },
  "/dashboard/admin": {
    title: "Administration",
    subtitle: "Manage building settings and permissions",
  },
  "/dashboard/admin/units": {
    title: "Unit Management",
    subtitle: "Manage units and tenant assignments",
  },
  "/dashboard/admin/access": {
    title: "Access Control",
    subtitle: "Manage user permissions and access levels",
  },
  "/dashboard/association/meetings": {
    title: "Association Meetings",
    subtitle: "Participate in tenant meetings, view minutes, and stay involved in community decisions",
  },
};

export function PageHeader() {
  const pathname = usePathname();
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    // Subscribe to header action changes
    const unsubscribe = subscribeToHeaderAction(() => {
      forceUpdate({});
    });
    
    return unsubscribe;
  }, []);
  
  // Check if this is a tenant profile page
  const tenantMatch = pathname.match(/^\/dashboard\/admin\/tenants\/(.+)$/);
  const tenantId = tenantMatch?.[1];
  
  // Fetch tenant data if on tenant profile page
  const { data: tenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tenants/${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch tenant');
      return response.json();
    },
    enabled: !!tenantId,
  });
  
  // If this is a tenant profile page and we have tenant data, show tenant info
  if (tenantId && tenant) {
    const getTenantName = () => {
      if (tenant.firstName || tenant.lastName) {
        return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();
      }
      return 'No name';
    };
    
    const getVerificationStatus = () => {
      return tenant.phone ? 'verified' : 'unverified';
    };
    
    const headerAction = getHeaderAction();
    
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            {getTenantName()}
            {getVerificationStatus() === 'verified' ? (
              <Badge variant="default">
                <UserCheck className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary">Unverified</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">{tenant.email}</p>
        </div>
        {headerAction && (
          typeof headerAction === 'function' ? (
            <Button onClick={headerAction}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            headerAction
          )
        )}
      </div>
    );
  }
  
  // Get header action - check if it's a custom component or a function
  const headerAction = getHeaderAction();
  const isCustomHeader = headerAction && typeof headerAction !== 'function';
  
  // If we have a custom header component, render it directly
  if (isCustomHeader) {
    return headerAction;
  }
  
  // Otherwise, show regular page info
  const info = pageInfo[pathname] || { title: "", subtitle: "" };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{info.title}</h1>
        {info.subtitle && (
          <p className="text-sm text-muted-foreground">{info.subtitle}</p>
        )}
      </div>
      {headerAction && (pathname === '/dashboard/issues/building' || pathname === '/dashboard/issues/my') && (
        typeof headerAction === 'function' ? (
          <Button onClick={headerAction}>
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        ) : (
          headerAction
        )
      )}
    </div>
  );
}