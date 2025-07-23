"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OnboardingFormProps {
  buildings: Building[];
  userId: string;
}

export default function OnboardingForm({ buildings }: OnboardingFormProps) {
  const router = useRouter();
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedLine, setSelectedLine] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBuilding || !selectedFloor || !selectedLine) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildingId: selectedBuilding,
          floor: parseInt(selectedFloor),
          line: selectedLine,
        }),
      });
      
      if (response.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const error = await response.text();
        alert(`Error: ${error}`);
      }
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBuildingData = buildings.find(b => b.id === selectedBuilding);
  const floors = selectedBuildingData 
    ? Array.from({ length: selectedBuildingData.floors }, (_, i) => i + 1)
    : [];
  const lines = selectedBuildingData
    ? Array.from({ length: selectedBuildingData.unitsPerFloor }, (_, i) => 
        String.fromCharCode(65 + i) // A, B, C, etc.
      )
    : [];

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Select Your Unit
        </CardTitle>
        <CardDescription>
          Choose your building and apartment unit to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="building" className="text-base font-medium">
              Building
            </Label>
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger id="building" className="w-full h-12">
                <SelectValue placeholder="Choose your building" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={building.id} className="py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{building.name}</span>
                      <span className="text-sm text-muted-foreground">{building.address}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBuilding && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="floor" className="text-base font-medium">
                  Floor
                </Label>
                <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                  <SelectTrigger id="floor" className="w-full h-12">
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((floor) => (
                      <SelectItem key={floor} value={floor.toString()} className="py-2">
                        <span className="font-medium">Floor {floor}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="line" className="text-base font-medium">
                  Unit
                </Label>
                <Select value={selectedLine} onValueChange={setSelectedLine} disabled={!selectedFloor}>
                  <SelectTrigger id="line" className="w-full h-12">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {lines.map((line) => (
                      <SelectItem key={line} value={line} className="py-2">
                        <span className="font-medium">Unit {selectedFloor}{line}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {selectedBuilding && selectedFloor && selectedLine && (
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <p className="font-medium">
                  Selected Unit
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {selectedFloor}{selectedLine}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  at {selectedBuildingData?.name}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                An admin will review and approve your request.
              </p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full h-12"
            disabled={!selectedBuilding || !selectedFloor || !selectedLine || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              "Request Access"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}