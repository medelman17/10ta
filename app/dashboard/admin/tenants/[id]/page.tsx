'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Home, 
  Phone, 
  Mail, 
  Calendar,
  AlertCircle,
  MessageSquare,
  UserCheck,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';
import { useSuperUser } from '@/hooks/use-super-user';
import { setHeaderAction } from '@/components/dashboard/page-header-context';
import { format } from 'date-fns';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface TenantProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  shareContactInfo: boolean;
  allowNeighborMessages: boolean;
  publicIssuesByDefault: boolean;
  emergencyContacts: EmergencyContact[];
  currentTenancy: {
    id: string;
    unit: {
      id: string;
      unitNumber: string;
      buildingId: string;
      building: {
        name: string;
        address: string;
      };
    };
    startDate: string;
  } | null;
  tenancyHistory: Array<{
    id: string;
    unit: {
      unitNumber: string;
    };
    startDate: string;
    endDate: string | null;
  }>;
  _count: {
    reportedIssues: number;
    communications: number;
    signatures: number;
  };
}

export default function TenantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tenantId = params.id as string;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    phone: '',
    shareContactInfo: false,
    allowNeighborMessages: false,
    publicIssuesByDefault: false,
  });

  // Get building ID from current tenancy for permissions
  const { data: tenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tenants/${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch tenant');
      return response.json() as Promise<TenantProfile>;
    },
  });

  const buildingId = tenant?.currentTenancy?.unit.buildingId;
  const isSuperUser = useSuperUser();
  
  const { hasAnyPermission } = usePermissions({ 
    buildingId: buildingId || '' 
  });
  const canManageTenants = isSuperUser || hasAnyPermission(['manage_building', 'manage_tenants']);

  const handleEditOpen = () => {
    if (tenant) {
      setEditData({
        phone: tenant.phone || '',
        shareContactInfo: tenant.shareContactInfo,
        allowNeighborMessages: tenant.allowNeighborMessages,
        publicIssuesByDefault: tenant.publicIssuesByDefault,
      });
      setEditDialogOpen(true);
    }
  };

  // Set header action for Edit Profile button
  useEffect(() => {
    if (canManageTenants) {
      setHeaderAction(handleEditOpen);
    }
    return () => setHeaderAction(null); // Cleanup on unmount
  }, [canManageTenants, tenant]);

  const { data: issues } = useQuery({
    queryKey: ['tenant-issues', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tenants/${tenantId}/issues`);
      if (!response.ok) throw new Error('Failed to fetch issues');
      return response.json();
    },
    enabled: !!tenantId && canManageTenants,
  });

  const { data: communications } = useQuery({
    queryKey: ['tenant-communications', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/tenants/${tenantId}/communications`);
      if (!response.ok) throw new Error('Failed to fetch communications');
      return response.json();
    },
    enabled: !!tenantId && canManageTenants,
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (data: typeof editData) => {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      toast.success('Tenant updated successfully');
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update tenant');
    },
  });

  const handleSaveEdit = () => {
    updateTenantMutation.mutate(editData);
  };

  const getTenantName = () => {
    if (!tenant) return 'Loading...';
    if (tenant.firstName || tenant.lastName) {
      return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();
    }
    return 'No name';
  };

  const getVerificationStatus = () => {
    return tenant?.phone ? 'verified' : 'unverified';
  };

  if (!tenant) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!canManageTenants) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            You don&apos;t have permission to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Badges */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="px-3 py-2 h-auto flex items-center gap-2">
          <Home className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {tenant.currentTenancy ? tenant.currentTenancy.unit.unitNumber : 'No unit'}
            </span>
            {tenant.currentTenancy && (
              <span className="text-xs text-muted-foreground">
                {tenant.currentTenancy.unit.building.name}
              </span>
            )}
          </div>
        </Badge>

        <Badge variant="outline" className="px-3 py-2 h-auto flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {tenant.currentTenancy ? 
                format(new Date(tenant.currentTenancy.startDate), 'MMM d, yyyy') : 
                'N/A'
              }
            </span>
            {tenant.currentTenancy && (
              <span className="text-xs text-muted-foreground">
                {Math.floor((Date.now() - new Date(tenant.currentTenancy.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
              </span>
            )}
          </div>
        </Badge>

        <Badge variant="outline" className="px-3 py-2 h-auto flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{tenant._count.reportedIssues} issues</span>
            <span className="text-xs text-muted-foreground">
              {issues?.filter((i: { status: string }) => i.status === 'OPEN').length || 0} open
            </span>
          </div>
        </Badge>

        <Badge variant="outline" className="px-3 py-2 h-auto flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{tenant._count.communications} communications</span>
            <span className="text-xs text-muted-foreground">Total interactions</span>
          </div>
        </Badge>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="history">Unit History</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Personal contact details and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.email}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm text-muted-foreground">Phone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{tenant.phone || 'Not provided'}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Share Contact Info</Label>
                    <Badge variant={tenant.shareContactInfo ? 'default' : 'secondary'}>
                      {tenant.shareContactInfo ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Allow Neighbor Messages</Label>
                    <Badge variant={tenant.allowNeighborMessages ? 'default' : 'secondary'}>
                      {tenant.allowNeighborMessages ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Public Issues by Default</Label>
                    <Badge variant={tenant.publicIssuesByDefault ? 'default' : 'secondary'}>
                      {tenant.publicIssuesByDefault ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>
                  Designated contacts for emergencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tenant.emergencyContacts.length > 0 ? (
                  <div className="space-y-3">
                    {tenant.emergencyContacts.map((contact) => (
                      <div key={contact.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">{contact.relationship}</div>
                        <div className="text-sm mt-1">
                          <Phone className="h-3 w-3 inline mr-1" />
                          {contact.phone}
                          {contact.email && (
                            <>
                              {' • '}
                              <Mail className="h-3 w-3 inline mr-1" />
                              {contact.email}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No emergency contacts added</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/communications/new?recipient=${tenantId}`)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              {tenant.currentTenancy && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/admin/buildings/${tenant.currentTenancy!.unit.buildingId}/units/${tenant.currentTenancy!.unit.id}`)}
                >
                  <Home className="h-4 w-4 mr-2" />
                  View Unit
                </Button>
              )}
              {tenant.phone && tenant.shareContactInfo && (
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Tenant
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Unit History</CardTitle>
              <CardDescription>
                Previous and current unit assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenant.tenancyHistory.map((tenancy, index) => (
                  <div key={tenancy.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Unit {tenancy.unit.unitNumber}</span>
                        {index === 0 && !tenancy.endDate && (
                          <Badge variant="default">Current</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(tenancy.startDate), 'MMM d, yyyy')}
                        {' - '}
                        {tenancy.endDate 
                          ? format(new Date(tenancy.endDate), 'MMM d, yyyy')
                          : 'Present'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Reported Issues</CardTitle>
              <CardDescription>
                All issues reported by this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {issues && issues.length > 0 ? (
                <div className="space-y-4">
                  {issues.map((issue: {
                    id: string;
                    title: string;
                    description: string;
                    status: string;
                    createdAt: string;
                  }) => (
                    <div key={issue.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{issue.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {issue.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={
                              issue.status === 'OPEN' ? 'destructive' :
                              issue.status === 'IN_PROGRESS' ? 'default' :
                              'secondary'
                            }>
                              {issue.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/issues/${issue.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No issues reported</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>
                All communications with this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {communications && communications.length > 0 ? (
                <div className="space-y-4">
                  {communications.map((comm: {
                    id: string;
                    subject: string | null;
                    type: string;
                    direction: string;
                    resolved: boolean;
                    createdAt: string;
                  }) => (
                    <div key={comm.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{comm.subject || 'No subject'}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {comm.type} • {comm.direction}
                          </p>
                          <p className="text-sm mt-2">
                            {format(new Date(comm.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <Badge variant={comm.resolved ? 'default' : 'secondary'}>
                          {comm.resolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No communications recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Documents associated with this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Document management will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant Profile</DialogTitle>
            <DialogDescription>
              Update tenant contact information and preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="shareContact">Share Contact Info</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other tenants to see contact details
                  </p>
                </div>
                <Switch
                  id="shareContact"
                  checked={editData.shareContactInfo}
                  onCheckedChange={(checked) => 
                    setEditData({ ...editData, shareContactInfo: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="neighborMessages">Allow Neighbor Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive messages from other tenants
                  </p>
                </div>
                <Switch
                  id="neighborMessages"
                  checked={editData.allowNeighborMessages}
                  onCheckedChange={(checked) => 
                    setEditData({ ...editData, allowNeighborMessages: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="publicIssues">Public Issues by Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Make reported issues visible to other tenants
                  </p>
                </div>
                <Switch
                  id="publicIssues"
                  checked={editData.publicIssuesByDefault}
                  onCheckedChange={(checked) => 
                    setEditData({ ...editData, publicIssuesByDefault: checked })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}