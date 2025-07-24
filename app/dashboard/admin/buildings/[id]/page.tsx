'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Users, Home, FileText, AlertCircle, Settings, BarChart3, Shield } from 'lucide-react';
import { Card as UICard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePermissions } from '@/hooks/use-permissions';

export default function BuildingAdminPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.id as string;

  const { hasPermission, loading: permissionsLoading } = usePermissions({ buildingId });
  const canManageBuilding = hasPermission('manage_building');
  const canViewAnalytics = hasPermission('view_building_analytics');

  const { data: building, isLoading: buildingLoading } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/buildings/${buildingId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch building data');
      }
      return response.json();
    },
    enabled: !!buildingId && canManageBuilding,
  });

  const { data: stats } = useQuery({
    queryKey: ['building-stats', buildingId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/buildings/${buildingId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch building statistics');
      }
      return response.json();
    },
    enabled: !!buildingId && canViewAnalytics,
  });

  if (permissionsLoading || buildingLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!canManageBuilding) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have permission to manage this building.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{building?.name || 'Building Management'}</h1>
          <p className="text-muted-foreground">{building?.address}</p>
        </div>
        <Button onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/settings`)}>
          <Settings className="mr-2 h-4 w-4" />
          Building Settings
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UICard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUnits || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.occupiedUnits || 0} occupied ({Math.round((stats?.occupiedUnits / stats?.totalUnits) * 100) || 0}%)
            </p>
          </CardContent>
        </UICard>

        <UICard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.verifiedTenants || 0} verified
            </p>
          </CardContent>
        </UICard>

        <UICard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeIssues || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.criticalIssues || 0} critical
            </p>
          </CardContent>
        </UICard>

        <UICard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgResponseTime || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </UICard>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {canViewAnalytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <UICard>
              <CardHeader>
                <CardTitle>Building Information</CardTitle>
                <CardDescription>Basic building details and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">Address:</span>
                  <span>{building?.address}</span>
                  <span className="font-medium">City:</span>
                  <span>{building?.city}, {building?.state} {building?.zipCode}</span>
                  <span className="font-medium">Floors:</span>
                  <span>{building?.floors}</span>
                  <span className="font-medium">Units per Floor:</span>
                  <span>{building?.unitsPerFloor}</span>
                  <span className="font-medium">Created:</span>
                  <span>{new Date(building?.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </UICard>

            <UICard>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/units`)}>
                  <Home className="mr-2 h-4 w-4" />
                  Manage Units
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/announcements`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Send Announcement
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/documents`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/access`)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Manage Permissions
                </Button>
              </CardContent>
            </UICard>
          </div>

          {/* Recent Activity */}
          <UICard>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest building events and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Activity feed will be implemented here
              </div>
            </CardContent>
          </UICard>
        </TabsContent>

        <TabsContent value="units">
          <UICard>
            <CardHeader>
              <CardTitle>Unit Management</CardTitle>
              <CardDescription>View and manage all building units</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/units`)}>
                View All Units
              </Button>
            </CardContent>
          </UICard>
        </TabsContent>

        <TabsContent value="tenants">
          <UICard>
            <CardHeader>
              <CardTitle>Tenant Directory</CardTitle>
              <CardDescription>Manage tenant information and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/tenants`)}>
                View All Tenants
              </Button>
            </CardContent>
          </UICard>
        </TabsContent>

        <TabsContent value="issues">
          <UICard>
            <CardHeader>
              <CardTitle>Issue Management</CardTitle>
              <CardDescription>Track and resolve building issues</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/issues`)}>
                View All Issues
              </Button>
            </CardContent>
          </UICard>
        </TabsContent>

        <TabsContent value="communications">
          <UICard>
            <CardHeader>
              <CardTitle>Communication Center</CardTitle>
              <CardDescription>Building-wide communications and announcements</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/communications`)}>
                View Communications
              </Button>
            </CardContent>
          </UICard>
        </TabsContent>

        <TabsContent value="documents">
          <UICard>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
              <CardDescription>Building documents and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/documents`)}>
                Manage Documents
              </Button>
            </CardContent>
          </UICard>
        </TabsContent>

        {canViewAnalytics && (
          <TabsContent value="analytics">
            <UICard>
              <CardHeader>
                <CardTitle>Building Analytics</CardTitle>
                <CardDescription>Detailed insights and reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/analytics`)}>
                  View Analytics Dashboard
                </Button>
              </CardContent>
            </UICard>
          </TabsContent>
        )}

        <TabsContent value="access">
          <UICard>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Manage roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/access`)}>
                Manage Access
              </Button>
            </CardContent>
          </UICard>
        </TabsContent>
      </Tabs>
    </div>
  );
}