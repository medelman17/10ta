"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Home, Mail, Phone, Calendar, Search } from "lucide-react";
import type { User, BuildingRole, Building, Tenancy, Unit } from "@prisma/client";
import TenantActions from "./tenant-actions";
import Link from "next/link";

type TenantWithRelations = User & {
  buildingRoles: (BuildingRole & { building: Building })[];
  tenancies: (Tenancy & { unit: Unit })[];
};

interface TenantTableProps {
  tenants: TenantWithRelations[];
  isSuperUser?: boolean;
}

export default function TenantTable({ tenants, isSuperUser }: TenantTableProps) {
  const [search, setSearch] = useState("");
  
  const filteredTenants = tenants.filter((tenant) => {
    const searchLower = search.toLowerCase();
    return (
      tenant.email.toLowerCase().includes(searchLower) ||
      `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(searchLower) ||
      tenant.tenancies.some((t) => t.unit.unitNumber.toLowerCase().includes(searchLower))
    );
  });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Tenant</th>
              <th className="text-left p-4">Unit</th>
              <th className="text-left p-4">Building</th>
              <th className="text-left p-4">Contact</th>
              <th className="text-left p-4">Joined</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-muted-foreground">
                  No tenants found
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b hover:bg-accent/50">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">
                        {tenant.firstName} {tenant.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{tenant.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      {tenant.tenancies[0]?.unit.unitNumber || "Not assigned"}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {tenant.buildingRoles[0]?.building.name || "N/A"}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {tenant.email}
                      </div>
                      {tenant.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {tenant.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/admin/tenants/${tenant.id}`}>
                          View
                        </Link>
                      </Button>
                      {isSuperUser && (
                        <TenantActions
                          tenantId={tenant.id}
                          tenantName={`${tenant.firstName || ''} ${tenant.lastName || tenant.email}`}
                          hasIssues={false} // TODO: Check if tenant has issues
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Showing {filteredTenants.length} of {tenants.length} tenants
      </div>
    </div>
  );
}