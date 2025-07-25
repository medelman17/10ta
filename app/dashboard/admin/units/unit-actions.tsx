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

interface UnitActionsProps {
  unitId?: string;
  unitNumber?: string;
  buildingId: string;
  hasTenants?: boolean;
}

export default function UnitActions({ unitId, unitNumber, buildingId, hasTenants }: UnitActionsProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    unitNumber: "",
    floor: "",
    line: ""
  });
  
  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      const response = await fetch("/api/admin/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingId,
          unitNumber: formData.unitNumber,
          floor: parseInt(formData.floor),
          line: formData.line.toUpperCase()
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create unit");
      }
      
      toast.success("Unit created", {
        description: `Unit ${formData.unitNumber} has been created.`,
      });
      
      setCreateOpen(false);
      setFormData({
        unitNumber: "",
        floor: "",
        line: ""
      });
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to create unit",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDelete = async () => {
    if (!unitId) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/admin/units/${unitId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete unit");
      }
      
      toast.success("Unit deleted", {
        description: `Unit ${unitNumber} has been deleted.`,
      });
      
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to delete unit",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Auto-fill unit number when floor and line are entered
  const updateUnitNumber = (floor: string, line: string) => {
    if (floor && line) {
      setFormData(prev => ({
        ...prev,
        unitNumber: `${floor}${line.toUpperCase()}`
      }));
    }
  };
  
  // If no unitId, show create button
  if (!unitId) {
    return (
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Unit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Unit</DialogTitle>
            <DialogDescription>
              Add a new unit to the building. The unit number will be automatically generated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.floor}
                  onChange={(e) => {
                    setFormData({ ...formData, floor: e.target.value });
                    updateUnitNumber(e.target.value, formData.line);
                  }}
                  placeholder="5"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="line">Line (A-Z)</Label>
                <Input
                  id="line"
                  value={formData.line}
                  onChange={(e) => {
                    const line = e.target.value.toUpperCase().slice(0, 1);
                    if (!line || /^[A-Z]$/.test(line)) {
                      setFormData({ ...formData, line });
                      updateUnitNumber(formData.floor, line);
                    }
                  }}
                  placeholder="B"
                  maxLength={1}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitNumber">Unit Number</Label>
              <Input
                id="unitNumber"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                placeholder="5B"
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Unit number is automatically generated from floor and line
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !formData.floor || !formData.line}
            >
              {isCreating ? "Creating..." : "Create Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  // If unitId provided, show dropdown menu
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
            disabled={hasTenants}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Unit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription className="space-y-2">
              <span>Are you sure you want to delete unit {unitNumber}?</span>
              {hasTenants && (
                <span className="block text-destructive">
                  This unit has tenants and cannot be deleted. Remove all tenants first.
                </span>
              )}
              {!hasTenants && (
                <span className="block text-destructive">
                  This action cannot be undone.
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
              disabled={isDeleting || hasTenants}
            >
              {isDeleting ? "Deleting..." : "Delete Unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}