"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Building {
  id: string;
  name: string;
}

interface TenantActionsProps {
  tenantId?: string;
  tenantName?: string;
  hasIssues?: boolean;
  buildings?: Building[];
}

export default function TenantActions({ tenantId, tenantName, hasIssues, buildings = [] }: TenantActionsProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    buildingId: "",
    unitId: ""
  });
  
  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          phone: formData.phone || undefined,
          buildingId: formData.buildingId,
          unitId: formData.unitId || undefined
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tenant");
      }
      
      toast.success("Tenant created", {
        description: `${formData.email} has been added as a tenant.`,
      });
      
      setCreateOpen(false);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        buildingId: "",
        unitId: ""
      });
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to create tenant",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDelete = async () => {
    if (!tenantId) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete tenant");
      }
      
      toast.success("Tenant removed", {
        description: `${tenantName} has been removed from the platform.`,
      });
      
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to delete tenant",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // If no tenantId, show create button
  if (!tenantId) {
    return (
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
            <DialogDescription>
              Create a new tenant account. They will receive an invitation to join the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tenant@example.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buildingId">Building *</Label>
              <Select
                value={formData.buildingId}
                onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a building" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              * Required fields. Unit assignment can be done later.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !formData.email || !formData.buildingId}
            >
              {isCreating ? "Creating..." : "Create Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  // If tenantId provided, show dropdown menu
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={hasIssues}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Tenant
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Tenant</DialogTitle>
            <DialogDescription className="space-y-2">
              <span>Are you sure you want to remove {tenantName} from the platform?</span>
              {hasIssues && (
                <span className="block text-destructive">
                  This tenant has active issues and cannot be removed. Resolve all issues first.
                </span>
              )}
              {!hasIssues && (
                <span className="block text-destructive">
                  This will remove their access and delete their account. This action cannot be undone.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || hasIssues}
            >
              {isDeleting ? "Removing..." : "Remove Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}