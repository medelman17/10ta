'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Download, 
  Mail, 
  Phone, 
  UserCheck,
  UserX,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';
import { format } from 'date-fns';

interface TenantData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  shareContactInfo: boolean;
  tenancy: {
    id: string;
    unitId: string;
    unit: {
      unitNumber: string;
      floor: number;
      line: string;
    };
    startDate: string;
    isCurrent: boolean;
  };
  _count: {
    reportedIssues: number;
    communications: number;
  };
}

export default function TenantsDirectoryPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.id as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  const { hasPermission, hasAnyPermission } = usePermissions({ buildingId });
  const canManageTenants = hasAnyPermission(['manage_building', 'manage_tenants']);
  const canViewAllTenants = hasPermission('view_all_tenants');

  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['tenants', buildingId, searchQuery, floorFilter, verificationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (floorFilter !== 'all') params.append('floor', floorFilter);
      if (verificationFilter !== 'all') params.append('verified', verificationFilter);

      const response = await fetch(`/api/admin/buildings/${buildingId}/tenants?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    },
    enabled: !!buildingId && (canManageTenants || canViewAllTenants),
  });

  const handleSelectAll = () => {
    if (selectedTenants.size === tenantsData?.tenants.length) {
      setSelectedTenants(new Set());
    } else {
      setSelectedTenants(new Set(tenantsData?.tenants.map((t: TenantData) => t.id)));
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    const newSelected = new Set(selectedTenants);
    if (newSelected.has(tenantId)) {
      newSelected.delete(tenantId);
    } else {
      newSelected.add(tenantId);
    }
    setSelectedTenants(newSelected);
  };

  const handleBulkEmail = () => {
    if (selectedTenants.size === 0) {
      toast.error('No tenants selected');
      return;
    }
    // Navigate to communication page with selected tenants
    const tenantIds = Array.from(selectedTenants).join(',');
    router.push(`/dashboard/communications/new?recipients=${tenantIds}&type=tenants`);
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/admin/buildings/${buildingId}/tenants/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenantIds: selectedTenants.size > 0 ? Array.from(selectedTenants) : undefined 
        }),
      });

      if (!response.ok) throw new Error('Failed to export tenants');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenants-${buildingId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Tenants exported successfully');
    } catch {
      toast.error('Failed to export tenants');
    }
  };

  const getTenantName = (tenant: TenantData) => {
    if (tenant.firstName || tenant.lastName) {
      return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();
    }
    return 'No name';
  };

  const getVerificationStatus = (tenant: TenantData) => {
    // For now, consider verified if they have a phone number
    return tenant.phone ? 'verified' : 'unverified';
  };

  if (!canManageTenants && !canViewAllTenants) {
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const tenants = tenantsData?.tenants || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Directory</h1>
          <p className="text-muted-foreground">
            {tenantsData?.stats.total || 0} total tenants • {tenantsData?.stats.verified || 0} verified
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {selectedTenants.size > 0 && (
            <DropdownMenu open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
              <DropdownMenuTrigger asChild>
                <Button>
                  Bulk Actions ({selectedTenants.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleBulkEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, email, or unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger id="floor">
                  <SelectValue placeholder="All floors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All floors</SelectItem>
                  {[...Array(10)].map((_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      Floor {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification">Verification</Label>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger id="verification">
                  <SelectValue placeholder="All tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tenants</SelectItem>
                  <SelectItem value="verified">Verified only</SelectItem>
                  <SelectItem value="unverified">Unverified only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setFloorFilter('all');
                  setVerificationFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={tenants.length > 0 && selectedTenants.size === tenants.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Move-in Date</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant: TenantData) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTenants.has(tenant.id)}
                        onCheckedChange={() => handleSelectTenant(tenant.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{getTenantName(tenant)}</p>
                          <p className="text-sm text-muted-foreground">{tenant.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tenant.tenancy.unit.unitNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tenant.shareContactInfo && tenant.phone ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {tenant.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {tenant.shareContactInfo ? 'No phone' : 'Private'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(tenant.tenancy.startDate), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span>{tenant._count.reportedIssues} reported</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getVerificationStatus(tenant) === 'verified' ? (
                        <Badge variant="default" className="gap-1">
                          <UserCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <UserX className="h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => router.push(`/dashboard/admin/tenants/${tenant.id}`)}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/units/${tenant.tenancy.unitId}`)}
                          >
                            View Unit
                          </DropdownMenuItem>
                          {tenant.shareContactInfo && tenant.phone && (
                            <DropdownMenuItem>
                              Call Tenant
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/communications/new?recipient=${tenant.id}`)}
                          >
                            Send Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}