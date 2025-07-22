"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Building2, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface UnitData {
  unitId: string;
  floor: number;
  line: string;
  totalIssues: number;
  openIssues: number;
  severityScore: number;
  categories: Record<string, number>;
  lastReportedAt?: string;
}

interface HeatMapData {
  buildingId: string;
  buildingName: string;
  floors: number;
  unitsPerFloor: number;
  units: Record<string, UnitData>;
  summary: {
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    averageSeverityScore: number;
    topCategories: Array<{ category: string; count: number }>;
    mostAffectedUnits: Array<{ unitNumber: string; issueCount: number }>;
  };
}

interface BuildingHeatMapProps {
  buildingId?: string;
  timeRange?: string;
  categories?: string[];
  severities?: string[];
  onUnitClick?: (unitNumber: string) => void;
}

export default function BuildingHeatMap({
  buildingId,
  timeRange = "30d",
  categories = [],
  severities = [],
  onUnitClick,
}: BuildingHeatMapProps) {
  const router = useRouter();
  const [heatMapData, setHeatMapData] = useState<HeatMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (buildingId) params.append("buildingId", buildingId);
        params.append("timeRange", timeRange);
        categories.forEach(cat => params.append("category", cat));
        severities.forEach(sev => params.append("severity", sev));

        const response = await fetch(`/api/issues/heatmap?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setHeatMapData(data);
        }
      } catch (error) {
        console.error("Error fetching heat map data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [buildingId, timeRange, categories, severities]);


  const getHeatColor = (unit: UnitData): string => {
    if (unit.totalIssues === 0) {
      return "bg-gray-100 hover:bg-gray-200";
    }
    
    // Calculate intensity based on severity score and issue count
    const intensity = unit.severityScore / Math.max(unit.totalIssues, 1);
    
    if (intensity >= 3) {
      return "bg-red-500 hover:bg-red-600 text-white";
    } else if (intensity >= 2) {
      return "bg-orange-500 hover:bg-orange-600 text-white";
    } else if (intensity >= 1.5) {
      return "bg-yellow-500 hover:bg-yellow-600 text-white";
    } else if (unit.totalIssues > 0) {
      return "bg-blue-500 hover:bg-blue-600 text-white";
    }
    
    return "bg-gray-100 hover:bg-gray-200";
  };

  const handleUnitClick = (unitNumber: string) => {
    setSelectedUnit(unitNumber);
    if (onUnitClick) {
      onUnitClick(unitNumber);
    } else {
      // Navigate to issues filtered by this unit
      router.push(`/dashboard/issues/building?unit=${unitNumber}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading heat map...</p>
        </CardContent>
      </Card>
    );
  }

  if (!heatMapData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Generate floor and unit grid
  const floors = Array.from({ length: heatMapData.floors }, (_, i) => heatMapData.floors - i);
  const lines = Array.from({ length: heatMapData.unitsPerFloor }, (_, i) => String.fromCharCode(65 + i));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {heatMapData.buildingName} Heat Map
        </CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{heatMapData.summary.totalIssues} total issues</span>
          <span>{heatMapData.summary.openIssues} open</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Heat Map Legend */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded" />
            <span>No Issues</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span>Critical</span>
          </div>
        </div>

        {/* Building Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${lines.length}, 1fr)` }}>
              {/* Header row with unit lines */}
              <div className="p-2 text-center font-semibold text-sm">Floor</div>
              {lines.map(line => (
                <div key={line} className="p-2 text-center font-semibold text-sm">
                  {line}
                </div>
              ))}

              {/* Floor rows */}
              {floors.map(floor => (
                <>
                  <div key={`floor-${floor}`} className="p-2 text-center font-semibold text-sm">
                    {floor}
                  </div>
                  {lines.map(line => {
                    const unitNumber = `${floor}${line}`;
                    const unit = heatMapData.units[unitNumber];
                    
                    if (!unit) {
                      return (
                        <div key={unitNumber} className="p-1">
                          <div className="h-12 bg-gray-50 rounded" />
                        </div>
                      );
                    }

                    return (
                      <TooltipProvider key={unitNumber}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="p-1">
                              <Button
                                variant="ghost"
                                className={cn(
                                  "h-12 w-full p-0 relative transition-all",
                                  getHeatColor(unit),
                                  selectedUnit === unitNumber && "ring-2 ring-offset-2 ring-primary"
                                )}
                                onClick={() => handleUnitClick(unitNumber)}
                              >
                                <span className="font-semibold">{unitNumber}</span>
                                {unit.openIssues > 0 && (
                                  <Badge 
                                    variant="secondary" 
                                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                                  >
                                    {unit.openIssues}
                                  </Badge>
                                )}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-2">
                              <p className="font-semibold">Unit {unitNumber}</p>
                              <div className="text-sm space-y-1">
                                <p>Total Issues: {unit.totalIssues}</p>
                                <p>Open Issues: {unit.openIssues}</p>
                                <p>Severity Score: {unit.severityScore.toFixed(1)}</p>
                              </div>
                              {Object.entries(unit.categories).length > 0 && (
                                <div className="text-sm pt-1 border-t">
                                  <p className="font-medium mb-1">Categories:</p>
                                  {Object.entries(unit.categories)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([category, count]) => (
                                      <p key={category} className="text-xs">
                                        {category}: {count}
                                      </p>
                                    ))}
                                </div>
                              )}
                              {unit.lastReportedAt && (
                                <p className="text-xs text-muted-foreground pt-1 border-t">
                                  Last report: {new Date(unit.lastReportedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          {/* Top Categories */}
          <div>
            <h4 className="font-medium mb-2">Top Issue Categories</h4>
            <div className="space-y-1">
              {heatMapData.summary.topCategories.map((cat, index) => (
                <div key={cat.category} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {index + 1}. {cat.category}
                  </span>
                  <span className="font-medium">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Most Affected Units */}
          <div>
            <h4 className="font-medium mb-2">Most Affected Units</h4>
            <div className="space-y-1">
              {heatMapData.summary.mostAffectedUnits.slice(0, 5).map((unit, index) => (
                <div key={unit.unitNumber} className="flex justify-between text-sm">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                    onClick={() => handleUnitClick(unit.unitNumber)}
                  >
                    {index + 1}. Unit {unit.unitNumber}
                  </Button>
                  <span className="font-medium">{unit.issueCount} issues</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}