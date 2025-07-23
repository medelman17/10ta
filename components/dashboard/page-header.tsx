"use client";

import { usePathname } from "next/navigation";

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
};

export function PageHeader() {
  const pathname = usePathname();
  const info = pageInfo[pathname] || { title: "", subtitle: "" };

  return (
    <div className="flex-1">
      <h1 className="text-lg font-semibold">{info.title}</h1>
      {info.subtitle && (
        <p className="text-sm text-muted-foreground">{info.subtitle}</p>
      )}
    </div>
  );
}