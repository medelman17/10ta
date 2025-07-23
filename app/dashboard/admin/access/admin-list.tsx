"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Shield, 
  MoreVertical, 
  UserPlus, 
  Search,
  Clock,
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { PERMISSION_DESCRIPTIONS } from "@/lib/permissions";
import PermissionDialog from "./permission-dialog";
import AddAdminDialog from "./add-admin-dialog";

interface Admin {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  buildingRoles: Array<{
    role: string;
  }>;
  permissions: Array<{
    permission: string;
    grantedAt: Date;
    expiresAt: Date | null;
  }>;
}

interface AdminListProps {
  admins: Admin[];
  buildingId: string;
  currentUserId: string;
}

export default function AdminList({ admins, buildingId, currentUserId }: AdminListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);

  const filteredAdmins = admins.filter(admin => {
    const fullName = `${admin.firstName || ""} ${admin.lastName || ""} ${admin.email}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const getUserDisplayName = (admin: Admin) => {
    if (admin.firstName && admin.lastName) {
      return `${admin.firstName} ${admin.lastName}`;
    }
    return admin.email;
  };

  const isExpiringSoon = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search administrators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button onClick={() => setShowAddAdminDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Administrator
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredAdmins.map((admin) => {
            const isSuperAdmin = admin.buildingRoles.some(role => role.role === "BUILDING_ADMIN");
            const hasTemporaryPermissions = admin.permissions.some(p => p.expiresAt);
            const hasExpiringPermissions = admin.permissions.some(p => isExpiringSoon(p.expiresAt));
            
            return (
              <Card key={admin.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {getUserDisplayName(admin)}
                        {admin.id === currentUserId && (
                          <Badge variant="secondary" className="ml-2">You</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{admin.email}</CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isSuperAdmin && (
                        <Badge className="gap-1">
                          <Shield className="h-3 w-3" />
                          Building Admin
                        </Badge>
                      )}
                      {hasTemporaryPermissions && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Temporary
                        </Badge>
                      )}
                      {hasExpiringPermissions && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Expiring Soon
                        </Badge>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowPermissionDialog(true);
                            }}
                          >
                            Manage Permissions
                          </DropdownMenuItem>
                          {admin.id !== currentUserId && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Remove Admin Access
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                
                {admin.permissions.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Permissions ({admin.permissions.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {admin.permissions.slice(0, 5).map((perm) => (
                          <Badge 
                            key={perm.permission} 
                            variant="secondary"
                            className="text-xs"
                          >
                            {PERMISSION_DESCRIPTIONS[perm.permission as keyof typeof PERMISSION_DESCRIPTIONS]?.split(' ').slice(0, 3).join(' ') || perm.permission}
                            {perm.expiresAt && (
                              <span className="ml-1 opacity-70">
                                (expires {format(new Date(perm.expiresAt), "MMM d")})
                              </span>
                            )}
                          </Badge>
                        ))}
                        {admin.permissions.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{admin.permissions.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filteredAdmins.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "No administrators found matching your search." : "No administrators found."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedAdmin && (
        <PermissionDialog
          open={showPermissionDialog}
          onOpenChange={setShowPermissionDialog}
          admin={selectedAdmin}
          buildingId={buildingId}
          onUpdate={() => {
            // Refresh the page to get updated data
            window.location.reload();
          }}
        />
      )}

      <AddAdminDialog
        open={showAddAdminDialog}
        onOpenChange={setShowAddAdminDialog}
        buildingId={buildingId}
        onAdd={() => {
          // Refresh the page to get updated data
          window.location.reload();
        }}
      />
    </>
  );
}