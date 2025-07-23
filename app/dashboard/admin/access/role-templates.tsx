"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Building,
  Wrench,
  Users,
  Briefcase,
  ChevronRight
} from "lucide-react";
import { PERMISSION_GROUPS, PERMISSION_DESCRIPTIONS } from "@/lib/permissions";

interface RoleTemplatesProps {
  buildingId: string;
}

const roleInfo = {
  SUPER_ADMIN: {
    title: "Super Admin",
    description: "Complete control over all platform features",
    icon: Shield,
    color: "text-purple-600",
  },
  BUILDING_MANAGER: {
    title: "Building Manager",
    description: "Manage building operations, tenants, and issues",
    icon: Building,
    color: "text-blue-600",
  },
  OFFICE_STAFF: {
    title: "Office Staff",
    description: "Handle tenant requests and view building information",
    icon: Briefcase,
    color: "text-green-600",
  },
  MAINTENANCE_STAFF: {
    title: "Maintenance Staff",
    description: "Manage and resolve maintenance issues",
    icon: Wrench,
    color: "text-orange-600",
  },
  ASSOCIATION_BOARD: {
    title: "Association Board",
    description: "Manage community features and tenant association",
    icon: Users,
    color: "text-indigo-600",
  },
};

export default function RoleTemplates({ }: RoleTemplatesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Role Templates</h3>
        <p className="text-muted-foreground">
          Pre-configured permission sets for common administrative roles
        </p>
      </div>

      <div className="grid gap-4">
        {Object.entries(PERMISSION_GROUPS).map(([role, permissions]) => {
          const info = roleInfo[role as keyof typeof roleInfo];
          if (!info) return null;
          
          const Icon = info.icon;
          
          return (
            <Card key={role} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${info.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{info.title}</CardTitle>
                      <CardDescription>{info.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {permissions.length} permissions
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Included Permissions:</p>
                    <div className="flex flex-wrap gap-2">
                      {permissions.slice(0, 5).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {PERMISSION_DESCRIPTIONS[permission]?.split(' ').slice(0, 3).join(' ') || permission}
                        </Badge>
                      ))}
                      {permissions.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{permissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View all permissions
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Role templates are starting points. You can customize 
            individual permissions for each administrator after assignment. Permissions can 
            also be set to expire after a specific date for temporary access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}