'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, File, Folder, Search, Grid3X3, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DocumentCategory, DocumentVisibility } from '@prisma/client';
import { toast } from 'sonner';

// Document upload form component
function DocumentUploadForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);
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
      toast.error('Please fill in all required fields and select a file.');
      return;
    }

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      uploadData.append('title', formData.title);
      if (formData.description) uploadData.append('description', formData.description);
      uploadData.append('category', formData.category);
      uploadData.append('visibility', formData.visibility);
      formData.tags.forEach(tag => uploadData.append('tags', tag));
      if (formData.folderId) uploadData.append('folderId', formData.folderId);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      toast.success('Your document has been uploaded successfully.');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
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
        <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function DocumentsPage() {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleDocumentUploaded = () => {
    // TODO: Refresh document list
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Document Library</h1>
          <p className="text-muted-foreground">Access and manage building documents</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Add a new document to the library. Files up to 10MB are supported.
              </DialogDescription>
            </DialogHeader>
            <DocumentUploadForm 
              onClose={() => setUploadDialogOpen(false)} 
              onSuccess={handleDocumentUploaded}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="my">My Uploads</TabsTrigger>
          <TabsTrigger value="recent">Recently Viewed</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            <File className="mx-auto h-12 w-12 mb-4" />
            <p>Document list will be implemented next</p>
          </div>
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            <File className="mx-auto h-12 w-12 mb-4" />
            <p>Your uploaded documents will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            <File className="mx-auto h-12 w-12 mb-4" />
            <p>Recently viewed documents will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="folders" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            <Folder className="mx-auto h-12 w-12 mb-4" />
            <p>Document folders will be implemented next</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}