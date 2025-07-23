"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { 
  PERMISSIONS, 
  PERMISSION_CATEGORIES, 
  PERMISSION_DESCRIPTIONS,
  Permission 
} from "@/lib/permissions";
import { toast } from "sonner";

interface Admin {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  permissions: Array<{
    permission: string;
    grantedAt: Date;
    expiresAt: Date | null;
  }>;
}

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: Admin;
  buildingId: string;
  onUpdate: () => void;
}

export default function PermissionDialog({
  open,
  onOpenChange,
  admin,
  buildingId,
  onUpdate,
}: PermissionDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(
    new Set(admin.permissions.map(p => p.permission as Permission))
  );
  const [setExpiration, setSetExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  const getUserDisplayName = () => {
    if (admin.firstName && admin.lastName) {
      return `${admin.firstName} ${admin.lastName}`;
    }
    return admin.email;
  };

  const handlePermissionToggle = (permission: Permission) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permission)) {
      newSet.delete(permission);
    } else {
      newSet.add(permission);
    }
    setSelectedPermissions(newSet);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentPermissions = new Set(admin.permissions.map(p => p.permission));
      
      // Find permissions to grant and revoke
      const toGrant = Array.from(selectedPermissions).filter(p => !currentPermissions.has(p));
      const toRevoke = Array.from(currentPermissions).filter(p => !selectedPermissions.has(p as Permission));

      // Grant new permissions
      if (toGrant.length > 0) {
        const response = await fetch("/api/admin/permissions/grant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: admin.id,
            buildingId,
            permissions: toGrant,
            expiresAt: setExpiration ? expirationDate?.toISOString() : null,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to grant permissions");
        }
      }

      // Revoke removed permissions
      if (toRevoke.length > 0) {
        const response = await fetch("/api/admin/permissions/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: admin.id,
            buildingId,
            permissions: toRevoke,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to revoke permissions");
        }
      }

      toast.success("Permissions updated successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update permissions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const permissionCount = selectedPermissions.size;
  const isModified = permissionCount !== admin.permissions.length ||
    !admin.permissions.every(p => selectedPermissions.has(p.permission as Permission));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Configure permissions for {getUserDisplayName()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Selected Permissions</p>
              <p className="text-2xl font-bold">{permissionCount}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="expiration"
                  checked={setExpiration}
                  onCheckedChange={setSetExpiration}
                />
                <Label htmlFor="expiration">Set expiration</Label>
              </div>
              {setExpiration && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !expirationDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expirationDate ? format(expirationDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expirationDate}
                      onSelect={setExpirationDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <Tabs defaultValue={Object.keys(PERMISSION_CATEGORIES)[0]} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              {Object.keys(PERMISSION_CATEGORIES).slice(0, 4).map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <ScrollArea className="h-[350px] mt-4">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                <TabsContent key={category} value={category} className="space-y-4 pr-4">
                  {permissions.map((permission) => {
                    const isSelected = selectedPermissions.has(permission);
                    const existingPerm = admin.permissions.find(p => p.permission === permission);
                    
                    return (
                      <div
                        key={permission}
                        className={cn(
                          "flex items-start space-x-3 p-3 rounded-lg border",
                          isSelected && "bg-muted/50"
                        )}
                      >
                        <Checkbox
                          id={permission}
                          checked={isSelected}
                          onCheckedChange={() => handlePermissionToggle(permission)}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={permission}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {permission.replace(/_/g, " ").toLowerCase()}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {PERMISSION_DESCRIPTIONS[permission]}
                          </p>
                          {existingPerm?.expiresAt && (
                            <Badge variant="outline" className="text-xs">
                              Expires {format(new Date(existingPerm.expiresAt), "PPP")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || !isModified}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}