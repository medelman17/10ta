'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentUploadForm } from './document-upload-form';
import { DocumentList } from '@/components/documents/document-list';
import { DocumentFilters } from '@/components/documents/document-filters';
import { useDocuments } from '@/hooks/use-documents';
import type { DocumentFilters as DocumentFiltersType } from '@/lib/api/documents';
import { Skeleton } from '@/components/ui/skeleton';

export default function DocumentsClient() {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<DocumentFiltersType>({
    page: 1,
    limit: 20,
  });

  // Adjust filters based on active tab
  const queryFilters = {
    ...filters,
    ...(activeTab === 'my' && { uploadedBy: 'me' }), // This would need to be the actual user ID
  };

  const { data, isLoading, error } = useDocuments(queryFilters);

  const handleDocumentUploaded = () => {
    setUploadDialogOpen(false);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

      {/* Filters */}
      <DocumentFilters filters={filters} onFiltersChange={setFilters} />

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="my">My Uploads</TabsTrigger>
          <TabsTrigger value="recent">Recently Viewed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <DocumentListSkeleton view={view} />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load documents</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.refresh()}
              >
                Try Again
              </Button>
            </div>
          ) : data ? (
            <>
              <DocumentList 
                documents={data.documents} 
                view={view}
                onEdit={(document) => {
                  // TODO: Implement edit functionality
                  console.log('Edit document:', document);
                }}
              />
              
              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={data.pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={data.pagination.page === data.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentListSkeleton({ view }: { view: 'grid' | 'list' }) {
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}