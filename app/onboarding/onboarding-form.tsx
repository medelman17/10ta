"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="building">Select Your Building</Label>
        <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
          <SelectTrigger id="building">
            <SelectValue placeholder="Choose a building" />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                {building.name} - {building.address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedBuilding && (
        <div className="space-y-2">
          <Label htmlFor="floor">Floor</Label>
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger id="floor">
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              {floors.map((floor) => (
                <SelectItem key={floor} value={floor.toString()}>
                  Floor {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedFloor && (
        <div className="space-y-2">
          <Label htmlFor="line">Unit Line</Label>
          <Select value={selectedLine} onValueChange={setSelectedLine}>
            <SelectTrigger id="line">
              <SelectValue placeholder="Select unit line" />
            </SelectTrigger>
            <SelectContent>
              {lines.map((line) => (
                <SelectItem key={line} value={line}>
                  Unit {selectedFloor}{line}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedBuilding && selectedFloor && selectedLine && (
        <div className="rounded-lg border p-4 bg-muted/50">
          <p className="text-sm">
            You&apos;re requesting access to unit{" "}
            <span className="font-semibold">
              {selectedFloor}{selectedLine}
            </span>{" "}
            in {selectedBuildingData?.name}.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            An admin will need to approve your request.
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedBuilding || !selectedFloor || !selectedLine || isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Request Access"}
      </Button>
    </form>
  );
}