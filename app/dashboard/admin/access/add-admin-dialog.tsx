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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { PERMISSION_GROUPS } from "@/lib/permissions";

interface AddAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  onAdd: () => void;
}

export default function AddAdminDialog({
  open,
  onOpenChange,
  buildingId,
  onAdd,
}: AddAdminDialogProps) {
  const [email, setEmail] = useState("");
  const [roleTemplate, setRoleTemplate] = useState<string>("");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [foundUser, setFoundUser] = useState<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null>(null);

  const handleSearch = async () => {
    if (!email) return;

    setSearching(true);
    try {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("No user found with this email address");
        } else {
          throw new Error("Failed to search for user");
        }
        return;
      }

      const user = await response.json();
      setFoundUser(user);
    } catch (error) {
      toast.error("Failed to search for user");
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!foundUser || !roleTemplate) return;

    setAdding(true);
    try {
      // First, grant building admin role if needed
      if (roleTemplate === "BUILDING_MANAGER" || roleTemplate === "SUPER_ADMIN") {
        await fetch("/api/admin/roles/grant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: foundUser.id,
            buildingId,
            role: "BUILDING_ADMIN",
          }),
        });
      }

      // Then grant permissions based on role template
      const permissions = PERMISSION_GROUPS[roleTemplate as keyof typeof PERMISSION_GROUPS];
      if (permissions && permissions.length > 0) {
        const response = await fetch("/api/admin/permissions/grant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: foundUser.id,
            buildingId,
            permissions,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to grant permissions");
        }
      }

      toast.success("Administrator added successfully");
      onAdd();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add administrator");
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setRoleTemplate("");
      setFoundUser(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Administrator</DialogTitle>
          <DialogDescription>
            Search for a user by email and assign them administrative permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <Button 
                onClick={handleSearch} 
                disabled={!email || searching}
                size="icon"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {foundUser && (
            <>
              <div className="p-4 bg-muted rounded-lg space-y-1">
                <p className="font-medium">
                  {foundUser.firstName && foundUser.lastName
                    ? `${foundUser.firstName} ${foundUser.lastName}`
                    : "User found"}
                </p>
                <p className="text-sm text-muted-foreground">{foundUser.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role Template</Label>
                <Select value={roleTemplate} onValueChange={setRoleTemplate}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUILDING_MANAGER">
                      Building Manager (Full building management)
                    </SelectItem>
                    <SelectItem value="OFFICE_STAFF">
                      Office Staff (View and manage requests)
                    </SelectItem>
                    <SelectItem value="MAINTENANCE_STAFF">
                      Maintenance Staff (Issue management only)
                    </SelectItem>
                    <SelectItem value="ASSOCIATION_BOARD">
                      Association Board (Community features)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This will grant a predefined set of permissions. You can customize them later.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdd} 
              disabled={!foundUser || !roleTemplate || adding}
            >
              {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Administrator
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}