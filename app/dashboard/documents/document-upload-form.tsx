'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DialogFooter } from '@/components/ui/dialog';
import { DocumentCategory, DocumentVisibility } from '@prisma/client';
import { useUploadDocument } from '@/hooks/use-documents';

interface DocumentUploadFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentUploadForm({ onClose, onSuccess }: DocumentUploadFormProps) {
  const uploadMutation = useUploadDocument();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as DocumentCategory,
    visibility: 'BUILDING_TENANTS' as DocumentVisibility,
    tags: [] as string[],
    folderId: null as string | null,
  });
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formData.title || !formData.category || !formData.visibility) {
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', selectedFile);
    uploadData.append('title', formData.title);
    if (formData.description) uploadData.append('description', formData.description);
    uploadData.append('category', formData.category);
    uploadData.append('visibility', formData.visibility);
    formData.tags.forEach(tag => uploadData.append('tags', tag));
    if (formData.folderId) uploadData.append('folderId', formData.folderId);

    uploadMutation.mutate(uploadData, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">File *</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            id="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full justify-start"
          >
            <Upload className="mr-2 h-4 w-4" />
            {selectedFile ? selectedFile.name : 'Choose file'}
          </Button>
        </div>
        {selectedFile && (
          <p className="text-sm text-muted-foreground">
            Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Document title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the document"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as DocumentCategory }))}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TENANT_RIGHTS">Tenant Rights</SelectItem>
            <SelectItem value="BUILDING_POLICIES">Building Policies</SelectItem>
            <SelectItem value="MAINTENANCE_GUIDES">Maintenance Guides</SelectItem>
            <SelectItem value="LEGAL_FORMS">Legal Forms</SelectItem>
            <SelectItem value="MEETING_MINUTES">Meeting Minutes</SelectItem>
            <SelectItem value="FINANCIAL_REPORTS">Financial Reports</SelectItem>
            <SelectItem value="NEWSLETTERS">Newsletters</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">Visibility *</Label>
        <Select
          value={formData.visibility}
          onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value as DocumentVisibility }))}
        >
          <SelectTrigger id="visibility">
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Public (Anyone can view)</SelectItem>
            <SelectItem value="BUILDING_TENANTS">Building Tenants Only</SelectItem>
            <SelectItem value="TENANT_ONLY">My Tenancy Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tags"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                {tag}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={uploadMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploadMutation.isPending || !selectedFile || !formData.title || !formData.category}>
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
        </Button>
      </DialogFooter>
    </form>
  );
}