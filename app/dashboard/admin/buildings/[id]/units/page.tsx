'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Home, Users, AlertCircle, Search, ChevronRight, UserX, UserPlus, Clock, ArrowLeft, User, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { UnitAssignmentModal } from '@/components/admin/unit-assignment-modal';

interface UnitData {
  id: string;
  unitNumber: string;
  floor: number;
  line: string;
  status: 'OCCUPIED' | 'VACANT' | 'MAINTENANCE';
  tenancy?: {
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
    moveInDate: string;
  };
  issues: {
    open: number;
    inProgress: number;
    critical: number;
  };
  lastActivity?: string;
}

export default function UnitsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const buildingId = params.id as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [assignModalState, setAssignModalState] = useState<{
    open: boolean;
    unitId?: string;
    unitNumber?: string;
  }>({ open: false });

  const { hasAnyPermission } = usePermissions({ buildingId });
  const canManageUnits = hasAnyPermission(['manage_building', 'manage_unit_requests']);

  const { data: building } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/buildings/${buildingId}`);
      if (!response.ok) throw new Error('Failed to fetch building');
      return response.json();
    },
    enabled: !!buildingId && canManageUnits,
  });

  const { data: units, isLoading } = useQuery({
    queryKey: ['units', buildingId, searchQuery, floorFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (floorFilter !== 'all') params.set('floor', floorFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/admin/buildings/${buildingId}/units?${params}`);
      if (!response.ok) throw new Error('Failed to fetch units');
      return response.json();
    },
    enabled: !!buildingId && canManageUnits,
  });

  const getUnitStatusColor = (unit: UnitData) => {
    if (unit.status === 'VACANT') return 'bg-gray-100 hover:bg-gray-200 border-gray-300';
    if (unit.status === 'MAINTENANCE') return 'bg-orange-50 hover:bg-orange-100 border-orange-300';
    if (unit.issues.critical > 0) return 'bg-red-50 hover:bg-red-100 border-red-300';
    if (unit.issues.open > 0 || unit.issues.inProgress > 0) return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-300';
    return 'bg-green-50 hover:bg-green-100 border-green-300';
  };

  const getUnitStatusBadge = (unit: UnitData) => {
    if (unit.status === 'VACANT') return <Badge variant="secondary">Vacant</Badge>;
    if (unit.status === 'MAINTENANCE') return <Badge variant="outline" className="border-orange-500 text-orange-700">Maintenance</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-700">Occupied</Badge>;
  };

  if (!canManageUnits) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have permission to manage units.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Unit Management</h1>
        <p className="text-muted-foreground">{building?.name} - {building?.address}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units?.stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units?.stats?.occupied || 0}</div>
            <p className="text-xs text-muted-foreground">
              {units?.stats?.total ? Math.round((units.stats.occupied / units.stats.total) * 100) : 0}% occupancy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacant</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units?.stats?.vacant || 0}</div>
            <p className="text-xs text-muted-foreground">
              {units?.stats?.longestVacant || 0} days longest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units with Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units?.stats?.withIssues || 0}</div>
            <p className="text-xs text-muted-foreground">
              {units?.stats?.criticalIssues || 0} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Units</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by unit number or tenant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All floors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All floors</SelectItem>
                {Array.from({ length: building?.floors || 10 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Floor {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="issues">Has Issues</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units Display */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {units?.units?.map((unit: UnitData) => (
            <Card
              key={unit.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md border-2 relative',
                getUnitStatusColor(unit)
              )}
              onClick={(e) => {
                // Prevent navigation if clicking on the assign button
                if ((e.target as HTMLElement).closest('button')) {
                  return;
                }
                router.push(`/dashboard/admin/buildings/${buildingId}/units/${unit.id}`);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{unit.unitNumber}</CardTitle>
                  {unit.issues.critical > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unit.issues.critical} critical
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {getUnitStatusBadge(unit)}
                {unit.tenancy && (
                  <div className="text-sm">
                    <p className="font-medium truncate">
                      {unit.tenancy.user.firstName || unit.tenancy.user.lastName
                        ? `${unit.tenancy.user.firstName || ''} ${unit.tenancy.user.lastName || ''}`.trim()
                        : 'No name'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Since {new Date(unit.tenancy.moveInDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {unit.status === 'VACANT' && (
                  <>
                    {unit.lastActivity && (
                      <p className="text-xs text-muted-foreground">
                        Vacant {Math.floor((Date.now() - new Date(unit.lastActivity).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignModalState({
                          open: true,
                          unitId: unit.id,
                          unitNumber: unit.unitNumber,
                        });
                      }}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                  </>
                )}
                {(unit.issues.open > 0 || unit.issues.inProgress > 0) && (
                  <p className="text-xs text-muted-foreground">
                    {unit.issues.open + unit.issues.inProgress} active issues
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Unit</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Tenant</th>
                  <th className="text-left p-4">Issues</th>
                  <th className="text-left p-4">Move-in Date</th>
                  <th className="text-left p-4"></th>
                </tr>
              </thead>
              <tbody>
                {units?.units?.map((unit: UnitData) => (
                  <tr
                    key={unit.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/admin/buildings/${buildingId}/units/${unit.id}`)}
                  >
                    <td className="p-4 font-medium">{unit.unitNumber}</td>
                    <td className="p-4">{getUnitStatusBadge(unit)}</td>
                    <td className="p-4">
                      {unit.tenancy ? (
                        <div>
                          <p className="font-medium">
                            {unit.tenancy.user.firstName || unit.tenancy.user.lastName
                              ? `${unit.tenancy.user.firstName || ''} ${unit.tenancy.user.lastName || ''}`.trim()
                              : 'No name'}
                          </p>
                          <p className="text-sm text-muted-foreground">{unit.tenancy.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {unit.issues.critical > 0 && (
                        <Badge variant="destructive" className="mr-2">{unit.issues.critical} critical</Badge>
                      )}
                      {(unit.issues.open > 0 || unit.issues.inProgress > 0) && (
                        <Badge variant="outline">{unit.issues.open + unit.issues.inProgress} active</Badge>
                      )}
                      {unit.issues.critical === 0 && unit.issues.open === 0 && unit.issues.inProgress === 0 && (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-4">
                      {unit.tenancy ? (
                        new Date(unit.tenancy.moveInDate).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {unit.status === 'VACANT' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignModalState({
                              open: true,
                              unitId: unit.id,
                              unitNumber: unit.unitNumber,
                            });
                          }}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Assign
                        </Button>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Assignment Modal */}
      {assignModalState.unitId && assignModalState.unitNumber && (
        <UnitAssignmentModal
          open={assignModalState.open}
          onOpenChange={(open) => setAssignModalState({ open })}
          unitId={assignModalState.unitId}
          unitNumber={assignModalState.unitNumber}
          buildingId={buildingId}
        />
      )}
    </div>
  );
}