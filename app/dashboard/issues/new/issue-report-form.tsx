"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Camera, Upload, X, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

interface IssueReportFormProps {
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    buildingRoles: Array<{ buildingId: string; role: string }>;
    tenancies: Array<{ unitId: string; isCurrent: boolean; unit: { buildingId: string } }>;
  };
  currentTenancy: {
    unitId: string;
    unit: {
      buildingId: string;
      unitNumber: string;
      building: {
        name: string;
      };
    };
  } | null;
}

interface PhotoAnalysis {
  category: string;
  severity: string;
  description: string;
  location: string;
  suggested_action: string;
  confidence: number;
}

export default function IssueReportForm({ user, currentTenancy }: IssueReportFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoAnalyses, setPhotoAnalyses] = useState<PhotoAnalysis[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    severity: "",
    location: "",
    isPublic: false,
    unitId: currentTenancy?.unitId || "",
    buildingId: currentTenancy?.unit.buildingId || user.buildingRoles[0]?.buildingId || "",
  });
  
  // For admin users without tenancy, we need to fetch available units
  const [availableUnits, setAvailableUnits] = useState<Array<{
    id: string;
    unitNumber: string;
    buildingId: string;
  }>>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // Fetch available units if user is admin without tenancy
  useEffect(() => {
    if (!currentTenancy && user.buildingRoles.length > 0) {
      setIsLoadingUnits(true);
      // Fetch units for the first building the user has access to
      const buildingId = user.buildingRoles[0].buildingId;
      fetch(`/api/admin/units?buildingId=${buildingId}`)
        .then(res => res.json())
        .then(data => {
          if (data.units) {
            setAvailableUnits(data.units);
          }
        })
        .catch(error => {
          console.error('Failed to fetch units:', error);
        })
        .finally(() => {
          setIsLoadingUnits(false);
        });
    }
  }, [currentTenancy, user.buildingRoles]);

  const categories = [
    "plumbing",
    "electrical", 
    "hvac",
    "structural",
    "pest",
    "safety",
    "noise",
    "other"
  ];

  const severities = [
    { value: "emergency", label: "Emergency", color: "destructive" },
    { value: "high", label: "High", color: "destructive" },
    { value: "medium", label: "Medium", color: "default" },
    { value: "low", label: "Low", color: "secondary" }
  ];

  const locations = [
    "kitchen",
    "bathroom",
    "bedroom",
    "living_room",
    "common_area",
    "exterior",
    "basement",
    "laundry",
    "other"
  ];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setPhotos(prev => [...prev, ...files]);
    
    // Analyze each new photo
    for (const file of files) {
      setIsAnalyzing(true);
      try {
        // Upload photo to Vercel Blob first
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Upload API error:', uploadResponse.status, errorText);
          throw new Error(`Failed to upload photo: ${uploadResponse.status}`);
        }
        
        const { url: imageUrl } = await uploadResponse.json();
        
        // Now analyze the uploaded photo
        const analysisResponse = await fetch('/api/issues/analyze-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        });
        
        if (!analysisResponse.ok) {
          const errorText = await analysisResponse.text();
          console.error('Analysis API error:', analysisResponse.status, errorText);
          throw new Error(`Failed to analyze photo: ${analysisResponse.status}`);
        }
        
        const analysis: PhotoAnalysis = await analysisResponse.json();
        
        setPhotoAnalyses(prev => [...prev, analysis]);
        
        // Update form with first analysis if form is empty
        if (!formData.title && photoAnalyses.length === 0) {
          setFormData(prev => ({
            ...prev,
            category: analysis.category,
            severity: analysis.severity,
            location: analysis.location,
            description: analysis.description,
            title: `${analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1)} issue in ${analysis.location.replace('_', ' ')}`
          }));
        }
        
      } catch (error) {
        console.error("Photo analysis failed:", error);
        // Add a fallback analysis in case of error
        const fallbackAnalysis: PhotoAnalysis = {
          category: "other",
          severity: "medium",
          description: "Unable to analyze image automatically. Please provide details manually.",
          location: "other",
          suggested_action: "Please describe the issue in the form below",
          confidence: 0.0
        };
        setPhotoAnalyses(prev => [...prev, fallbackAnalysis]);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoAnalyses(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.severity || !formData.unitId || !formData.buildingId) {
      alert("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("category", formData.category);
      form.append("severity", formData.severity);
      form.append("location", formData.location || "other");
      form.append("isPublic", formData.isPublic.toString());
      form.append("unitId", formData.unitId);
      form.append("buildingId", formData.buildingId);
      
      // Add photos
      photos.forEach(photo => {
        form.append("photos", photo);
      });
      
      const response = await fetch("/api/issues", {
        method: "POST",
        body: form,
      });
      
      if (response.ok) {
        router.push("/dashboard/issues/my");
      } else {
        const errorText = await response.text();
        console.error("Issue creation error:", response.status, errorText);
        throw new Error(`Failed to create issue: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("Error submitting issue:", error);
      alert("Failed to submit issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload photos to get AI-powered issue analysis and categorization
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="photos" className="cursor-pointer">
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload photos</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB each</p>
              </div>
              <Input
                id="photos"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </Label>
          </div>
          
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group h-24">
                  <Image
                    src={URL.createObjectURL(photo)}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {photoAnalyses[index] && (
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-1 left-1 text-xs flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      {Math.round(photoAnalyses[index].confidence * 100)}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {photoAnalyses.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="h-5 w-5" />
              AI Analysis Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photoAnalyses.map((analysis, index) => (
              <div key={index} className="space-y-2 pb-4 border-b border-blue-200 last:border-b-0 last:pb-0">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{analysis.category}</Badge>
                  <Badge 
                    variant={
                      analysis.severity === 'emergency' ? 'destructive' :
                      analysis.severity === 'urgent' ? 'default' : 'secondary'
                    }
                  >
                    {analysis.severity}
                  </Badge>
                  <Badge variant="secondary">{analysis.location.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm">{analysis.description}</p>
                <p className="text-xs text-muted-foreground italic">{analysis.suggested_action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Issue Details */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select 
                value={formData.severity} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severities.map((severity) => (
                    <SelectItem key={severity.value} value={severity.value}>
                      {severity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select 
                value={formData.location} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location.replace('_', ' ').charAt(0).toUpperCase() + location.replace('_', ' ').slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit {!currentTenancy && "*"}</Label>
              {currentTenancy ? (
                <Input 
                  value={`${currentTenancy.unit.unitNumber} - ${currentTenancy.unit.building.name}`} 
                  disabled 
                />
              ) : (
                <Select 
                  value={formData.unitId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unitId: value }))}
                  disabled={isLoadingUnits}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingUnits ? "Loading units..." : "Select unit"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the issue..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
            />
            <Label htmlFor="isPublic" className="text-sm">
              Make this issue visible to other tenants in the building
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Issue"
          )}
        </Button>
      </div>
    </form>
  );
}