"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Shield, 
  ShieldOff,
  Clock,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { PERMISSION_DESCRIPTIONS } from "@/lib/permissions";

interface AuditLogEntry {
  id: string;
  userId: string;
  buildingId: string;
  permission: string;
  action: string;
  performedBy: string;
  reason: string | null;
  createdAt: string;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  performer?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface PermissionAuditLogProps {
  buildingId: string;
}

export default function PermissionAuditLog({ buildingId }: PermissionAuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId]);

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`/api/admin/permissions/audit?buildingId=${buildingId}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.permission.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const getUserDisplayName = (user?: { email: string; firstName: string | null; lastName: string | null }) => {
    if (!user) return "Unknown User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const getActionIcon = (action: string) => {
    return action === "granted" ? Shield : ShieldOff;
  };

  const getActionColor = (action: string) => {
    return action === "granted" ? "text-green-600" : "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="granted">Permissions Granted</SelectItem>
            <SelectItem value="revoked">Permissions Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredLogs.map((log) => {
          const ActionIcon = getActionIcon(log.action);
          
          return (
            <Card key={log.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${getActionColor(log.action)}`}>
                    <ActionIcon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{getUserDisplayName(log.performer)}</span>
                          <span className="text-muted-foreground"> {log.action} </span>
                          <Badge variant="outline" className="ml-1">
                            {PERMISSION_DESCRIPTIONS[log.permission as keyof typeof PERMISSION_DESCRIPTIONS]?.split(' ').slice(0, 3).join(' ') || log.permission}
                          </Badge>
                        </p>
                        <p className="text-sm mt-1">
                          <span className="text-muted-foreground">for </span>
                          <span className="font-medium">{getUserDisplayName(log.user)}</span>
                        </p>
                        {log.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Reason: {log.reason}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm || actionFilter !== "all" 
                ? "No audit logs found matching your filters." 
                : "No permission changes have been logged yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}