'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, AlertCircle, Settings, UserPlus, UserX, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';
import { format } from 'date-fns';

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const buildingId = params.id as string;
  const unitId = params.unitId as string;

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { hasAnyPermission, hasPermission } = usePermissions({ buildingId });
  const canManageUnits = hasAnyPermission(['manage_building', 'manage_unit_requests']);
  const canViewIssues = hasPermission('view_all_issues');

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/units/${unitId}`);
      if (!response.ok) throw new Error('Failed to fetch unit');
      return response.json();
    },
    enabled: !!unitId && canManageUnits,
  });

  const { data: issues } = useQuery({
    queryKey: ['unit-issues', unitId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/units/${unitId}/issues`);
      if (!response.ok) throw new Error('Failed to fetch issues');
      return response.json();
    },
    enabled: !!unitId && canViewIssues,
  });

  const { data: history } = useQuery({
    queryKey: ['unit-history', unitId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/units/${unitId}/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    },
    enabled: !!unitId && canManageUnits,
  });

  const vacateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/units/${unitId}/vacate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to vacate unit');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Unit vacated successfully');
      queryClient.invalidateQueries({ queryKey: ['unit', unitId] });
    },
    onError: () => {
      toast.error('Failed to vacate unit');
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Unit not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeTenancy = unit.tenancies?.find((t: { status: string }) => t.status === 'ACTIVE');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unit {unit.unitNumber}</h1>
            <p className="text-muted-foreground">{unit.building.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/units/${unitId}/settings`)}>
          <Settings className="mr-2 h-4 w-4" />
          Unit Settings
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Unit Number</p>
                <p className="text-lg">{unit.unitNumber}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Floor</p>
                <p className="text-lg">{unit.floor}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Line</p>
                <p className="text-lg">{unit.line}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Status</p>
                {activeTenancy ? (
                  <Badge variant="outline" className="border-green-500 text-green-700">Occupied</Badge>
                ) : (
                  <Badge variant="secondary">Vacant</Badge>
                )}
              </div>
            </div>

            {!activeTenancy && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  This unit is currently vacant
                </p>
                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign Tenant
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Tenant to Unit {unit.unitNumber}</DialogTitle>
                      <DialogDescription>
                        Search for a tenant to assign to this unit.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground">
                        Tenant assignment workflow coming soon...
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTenancy ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{activeTenancy.user.name || 'No name provided'}</p>
                    <p className="text-sm text-muted-foreground">{activeTenancy.user.email}</p>
                    {activeTenancy.user.phoneNumber && (
                      <p className="text-sm text-muted-foreground">{activeTenancy.user.phoneNumber}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/admin/tenants/${activeTenancy.user.id}`)}
                  >
                    View Profile
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Move-in Date</span>
                    <span>{format(new Date(activeTenancy.startDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tenancy Duration</span>
                    <span>
                      {Math.floor((Date.now() - new Date(activeTenancy.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                  {activeTenancy.verifiedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verified</span>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {format(new Date(activeTenancy.verifiedAt), 'MMM d, yyyy')}
                      </Badge>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/units/${unitId}/transfer`)}
                  >
                    Transfer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      if (confirm('Are you sure you want to vacate this unit? This will end the current tenancy.')) {
                        vacateMutation.mutate();
                      }
                    }}
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Vacate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="mx-auto h-12 w-12 mb-3 opacity-20" />
                <p>No tenant assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Unit Issues</CardTitle>
              <CardDescription>All issues reported for this unit</CardDescription>
            </CardHeader>
            <CardContent>
              {issues && issues.length > 0 ? (
                <div className="space-y-4">
                  {issues.map((issue: { id: string; title: string; severity: string; status: string; description: string; createdAt: string }) => (
                    <div key={issue.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{issue.title}</p>
                          <Badge variant={issue.severity === 'CRITICAL' ? 'destructive' : 'outline'}>
                            {issue.severity}
                          </Badge>
                          <Badge variant="secondary">{issue.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Reported {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/issues/${issue.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No issues reported for this unit</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy History</CardTitle>
              <CardDescription>Past and current tenants of this unit</CardDescription>
            </CardHeader>
            <CardContent>
              {history && history.tenancies && history.tenancies.length > 0 ? (
                <div className="space-y-4">
                  {history.tenancies.map((tenancy: { id: string; user: { name: string | null; email: string }; status: string; startDate: string; endDate?: string }) => (
                    <div key={tenancy.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tenancy.user.name || 'No name'}</p>
                          {tenancy.status === 'ACTIVE' && (
                            <Badge variant="outline" className="border-green-500 text-green-700">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tenancy.user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tenancy.startDate), 'MMM d, yyyy')} - 
                          {tenancy.endDate ? format(new Date(tenancy.endDate), 'MMM d, yyyy') : 'Present'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No occupancy history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Unit Documents</CardTitle>
              <CardDescription>Documents specific to this unit</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Unit document management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Records</CardTitle>
              <CardDescription>Maintenance history for this unit</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Maintenance tracking coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}