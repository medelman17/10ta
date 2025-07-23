"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  User, 
  AlertCircle, 
  Home, 
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  FileWarning
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Tenant {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

interface Tenancy {
  user: Tenant;
}

interface Unit {
  id: string;
  unitNumber: string;
  floor: number;
  line: string;
  tenancies: Tenancy[];
  _count: {
    issues: number;
  };
}

interface UnitGridProps {
  units: Unit[];
  buildingId: string;
}

export default function UnitGrid({ units, buildingId }: UnitGridProps) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  
  // Group units by floor
  const unitsByFloor = units.reduce((acc, unit) => {
    if (!acc[unit.floor]) {
      acc[unit.floor] = [];
    }
    acc[unit.floor].push(unit);
    return acc;
  }, {} as Record<number, Unit[]>);
  
  // Sort floors in descending order (10 to 1)
  const floors = Object.keys(unitsByFloor)
    .map(Number)
    .sort((a, b) => b - a);
  
  const getUnitStatus = (unit: Unit) => {
    if (unit.tenancies.length === 0) return "vacant";
    if (unit._count.issues > 0) return "has-issues";
    return "occupied";
  };
  
  const getUnitColor = (unit: Unit) => {
    const status = getUnitStatus(unit);
    switch (status) {
      case "vacant":
        return "bg-gray-100 hover:bg-gray-200 border-gray-300";
      case "has-issues":
        return "bg-red-50 hover:bg-red-100 border-red-300";
      case "occupied":
        return "bg-green-50 hover:bg-green-100 border-green-300";
      default:
        return "bg-gray-50 hover:bg-gray-100";
    }
  };
  
  return (
    <>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-300 rounded" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
            <span>Vacant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-300 rounded" />
            <span>Has Issues</span>
          </div>
        </div>
        
        {/* Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Building Units Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {floors.map((floor) => (
                <div key={floor} className="flex gap-2 items-center">
                  <div className="w-16 text-sm font-medium text-muted-foreground">
                    Floor {floor}
                  </div>
                  <div className="flex gap-1 flex-1">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((line) => {
                      const unit = unitsByFloor[floor].find(u => u.line === line);
                      if (!unit) return (
                        <div key={line} className="flex-1 h-12 bg-gray-50 rounded border border-dashed" />
                      );
                      
                      return (
                        <Button
                          key={unit.id}
                          variant="outline"
                          className={cn(
                            "flex-1 h-12 p-0 flex flex-col items-center justify-center transition-all",
                            getUnitColor(unit)
                          )}
                          onClick={() => setSelectedUnit(unit)}
                        >
                          <span className="font-semibold">{unit.unitNumber}</span>
                          {unit._count.issues > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <AlertCircle className="h-3 w-3" />
                              {unit._count.issues}
                            </div>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Home className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{units.length}</p>
                  <p className="text-sm text-muted-foreground">Total Units</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <User className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {units.filter(u => u.tenancies.length > 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Occupied</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Home className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold">
                    {units.filter(u => u.tenancies.length === 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Vacant</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <FileWarning className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {units.filter(u => u._count.issues > 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">With Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Unit Details Sheet */}
      <Sheet open={!!selectedUnit} onOpenChange={() => setSelectedUnit(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedUnit && (
            <>
              <SheetHeader>
                <SheetTitle>Unit {selectedUnit.unitNumber}</SheetTitle>
                <SheetDescription>
                  Floor {selectedUnit.floor}, Line {selectedUnit.line}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Tenant Info */}
                <div>
                  <h3 className="font-semibold mb-3">Current Tenant</h3>
                  {selectedUnit.tenancies.length > 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {selectedUnit.tenancies[0].user.firstName} {selectedUnit.tenancies[0].user.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedUnit.tenancies[0].user.email}</span>
                          </div>
                          {selectedUnit.tenancies[0].user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{selectedUnit.tenancies[0].user.phone}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground text-center py-4">
                          Unit is currently vacant
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* Issues Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Active Issues</h3>
                  <Card>
                    <CardContent className="pt-6">
                      {selectedUnit._count.issues > 0 ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span>{selectedUnit._count.issues} active issues</span>
                          </div>
                          <Button variant="outline" size="sm">
                            View Issues
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">
                          No active issues
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    View Full History
                  </Button>
                  {selectedUnit.tenancies.length === 0 && (
                    <Button className="w-full">
                      Assign Tenant
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}