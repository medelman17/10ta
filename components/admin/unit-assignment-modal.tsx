'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User, Calendar, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface UnitAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  unitNumber: string;
  buildingId: string;
}

interface TenantSearchResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  currentUnit: {
    unitNumber: string;
  } | null;
  hasActiveRequest: boolean;
}

export function UnitAssignmentModal({
  open,
  onOpenChange,
  unitId,
  unitNumber,
  buildingId,
}: UnitAssignmentModalProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [moveInDate, setMoveInDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Search for tenants
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['tenant-search', searchQuery, buildingId],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const params = new URLSearchParams({ 
        q: searchQuery,
        buildingId,
        includeExternal: 'true' 
      });
      const response = await fetch(`/api/admin/tenants/search?${params}`);
      if (!response.ok) throw new Error('Failed to search tenants');
      return response.json() as Promise<TenantSearchResult[]>;
    },
    enabled: searchQuery.length >= 2,
  });

  // Assign tenant mutation
  const assignTenantMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/units/${unitId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          moveInDate,
          notes,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign tenant');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit', unitId] });
      queryClient.invalidateQueries({ queryKey: ['units', buildingId] });
      queryClient.invalidateQueries({ queryKey: ['tenants', buildingId] });
      toast.success('Tenant assigned successfully');
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSearchQuery('');
    setSelectedTenantId(null);
    setMoveInDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleAssign = () => {
    if (!selectedTenantId) {
      toast.error('Please select a tenant');
      return;
    }
    assignTenantMutation.mutate();
  };

  const getTenantName = (tenant: TenantSearchResult) => {
    if (tenant.firstName || tenant.lastName) {
      return `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();
    }
    return 'No name';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Tenant to Unit {unitNumber}</DialogTitle>
          <DialogDescription>
            Search for and assign a tenant to this unit. You can search for existing tenants or new applicants.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Tenants</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <div className="space-y-2">
              <Label>Select a Tenant</Label>
              <ScrollArea className="h-64 border rounded-md p-2">
                {isSearching ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <RadioGroup
                    value={selectedTenantId || ''}
                    onValueChange={setSelectedTenantId}
                  >
                    <div className="space-y-2">
                      {searchResults.map((tenant) => (
                        <Card key={tenant.id} className="p-3">
                          <label
                            htmlFor={tenant.id}
                            className="flex items-start gap-3 cursor-pointer"
                          >
                            <RadioGroupItem
                              value={tenant.id}
                              id={tenant.id}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {getTenantName(tenant)}
                                </span>
                                {tenant.phone && (
                                  <span className="text-sm text-muted-foreground">
                                    • {tenant.phone}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {tenant.email}
                              </p>
                              {tenant.currentUnit && (
                                <p className="text-sm text-amber-600">
                                  Currently in Unit {tenant.currentUnit.unitNumber}
                                </p>
                              )}
                              {tenant.hasActiveRequest && (
                                <p className="text-sm text-blue-600">
                                  Has active unit request
                                </p>
                              )}
                            </div>
                          </label>
                        </Card>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No tenants found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Move-in Date */}
          <div className="space-y-2">
            <Label htmlFor="moveInDate">Move-in Date</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="moveInDate"
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
                className="pl-8"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Any special notes about this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Warning for existing tenants */}
          {selectedTenantId && searchResults?.find(t => t.id === selectedTenantId)?.currentUnit && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This tenant is currently assigned to another unit. Assigning them here will 
                automatically end their current tenancy and create a transfer record.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedTenantId || assignTenantMutation.isPending}
            >
              {assignTenantMutation.isPending ? 'Assigning...' : 'Assign Tenant'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}