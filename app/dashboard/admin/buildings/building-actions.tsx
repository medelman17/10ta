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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BuildingActionsProps {
  buildingId?: string;
  buildingName?: string;
}

export default function BuildingActions({ buildingId, buildingName }: BuildingActionsProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    floors: "10",
    unitsPerFloor: "8"
  });
  
  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch("/api/admin/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          floors: parseInt(formData.floors),
          unitsPerFloor: parseInt(formData.unitsPerFloor)
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create building");
      }
      
      toast.success("Building created", {
        description: `${formData.name} has been created with ${parseInt(formData.floors) * parseInt(formData.unitsPerFloor)} units.`,
      });
      
      setCreateOpen(false);
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        floors: "10",
        unitsPerFloor: "8"
      });
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to create building",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDelete = async () => {
    if (!buildingId) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/admin/buildings/${buildingId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete building");
      }
      
      toast.success("Building deleted", {
        description: `${buildingName} has been deleted.`,
      });
      
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to delete building",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // If no buildingId, show create button
  if (!buildingId) {
    return (
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Building
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Building</DialogTitle>
            <DialogDescription>
              Add a new building to the platform. Units will be created automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Building Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sunset Apartments"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Brooklyn"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="NY"
                  maxLength={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zipCode">ZIP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="11201"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="floors">Floors</Label>
                <Input
                  id="floors"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.floors}
                  onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitsPerFloor">Units per Floor</Label>
                <Input
                  id="unitsPerFloor"
                  type="number"
                  min="1"
                  max="26"
                  value={formData.unitsPerFloor}
                  onChange={(e) => setFormData({ ...formData, unitsPerFloor: e.target.value })}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will create {parseInt(formData.floors || "0") * parseInt(formData.unitsPerFloor || "0")} units
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !formData.name || !formData.address || !formData.city || !formData.state || !formData.zipCode}
            >
              {isCreating ? "Creating..." : "Create Building"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  // If buildingId provided, show dropdown menu
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Building
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Building</DialogTitle>
            <DialogDescription className="space-y-2">
              <span>Are you sure you want to delete {buildingName}?</span>
              <span className="block text-destructive">
                This action cannot be undone. The building can only be deleted if it has no active tenants.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Building"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}