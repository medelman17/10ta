"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface EditIssueSheetProps {
  issue: {
    id: string;
    title: string;
    description: string;
    category: string;
    severity: string;
    location: string;
    status: string;
    isPublic: boolean;
    media?: Array<{
      id: string;
      url: string;
    }>;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const severityOptions = [
  { value: "EMERGENCY", label: "Emergency" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "AWAITING_LANDLORD", label: "Awaiting Landlord" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const locationOptions = [
  "kitchen",
  "bathroom",
  "bedroom",
  "living_room",
  "common_area",
  "exterior",
  "basement",
  "laundry",
  "other",
];

export function EditIssueSheet({ issue, open, onOpenChange }: EditIssueSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [existingMedia, setExistingMedia] = useState<Array<{id: string; url: string}>>(issue.media || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: issue.title,
    description: issue.description,
    category: issue.category,
    severity: issue.severity,
    location: issue.location,
    status: issue.status,
    isPublic: issue.isPublic,
  });

  // Reset form when issue changes
  useEffect(() => {
    setFormData({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      severity: issue.severity,
      location: issue.location,
      status: issue.status,
      isPublic: issue.isPublic,
    });
    setExistingMedia(issue.media || []);
    setNewFiles([]);
    setRemovedMediaIds([]);
  }, [issue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.error("Only image files are allowed");
    }
    
    setNewFiles(prev => [...prev, ...imageFiles]);
  };

  const removeExistingMedia = (mediaId: string) => {
    setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
    setRemovedMediaIds(prev => [...prev, mediaId]);
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error("Title and description are required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First, upload any new files
      const uploadedUrls: string[] = [];
      
      if (newFiles.length > 0) {
        setIsUploading(true);
        for (const file of newFiles) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }
          
          const { url } = await uploadResponse.json();
          uploadedUrls.push(url);
        }
        setIsUploading(false);
      }
      
      // Then update the issue with all changes
      const response = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          newMediaUrls: uploadedUrls,
          removedMediaIds,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update issue");
      }
      
      toast.success("Issue updated successfully");
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating issue:", error);
      toast.error("Failed to update issue");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <SheetHeader className="space-y-1">
            <SheetTitle>Edit Issue</SheetTitle>
            <SheetDescription>
              Update the details of this issue report.
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the issue..."
                rows={4}
                className="w-full resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., plumbing, electrical"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select 
                  value={formData.severity} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location.replace('_', ' ').charAt(0).toUpperCase() + location.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="space-y-4">
                {/* Existing media */}
                {existingMedia.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {existingMedia.map((media) => (
                      <div key={media.id} className="relative group">
                        <div className="relative aspect-square">
                          <Image
                            src={media.url}
                            alt="Issue photo"
                            fill
                            className="object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingMedia(media.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* New files preview */}
                {newFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {newFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-square">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt="New photo"
                            fill
                            className="object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewFile(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload button */}
                <div className="flex items-center gap-2">
                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="photos"
                    className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    Add Photos
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {existingMedia.length + newFiles.length} photo{existingMedia.length + newFiles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/30">
              <Label htmlFor="isPublic" className="flex-1 cursor-pointer">
                Make this issue visible to other tenants
              </Label>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
          </div>
          
          <SheetFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}