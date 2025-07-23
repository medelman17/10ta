'use client';

import { useState } from 'react';
import { DocumentWithRelations } from '@/lib/api/documents';
import { 
  Download, 
  MoreVertical, 
  Trash2, 
  Edit, 
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatBytes, formatDate, cn } from '@/lib/utils';
import { useDownloadDocument, useDeleteDocument } from '@/hooks/use-documents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DocumentListProps {
  documents: DocumentWithRelations[];
  view: 'grid' | 'list';
  onEdit?: (document: DocumentWithRelations) => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="h-5 w-5" />;
  }
  if (mimeType.includes('sheet') || mimeType.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    TENANT_RIGHTS: 'bg-blue-100 text-blue-800',
    BUILDING_POLICIES: 'bg-purple-100 text-purple-800',
    MAINTENANCE_GUIDES: 'bg-green-100 text-green-800',
    LEGAL_FORMS: 'bg-red-100 text-red-800',
    MEETING_MINUTES: 'bg-yellow-100 text-yellow-800',
    FINANCIAL_REPORTS: 'bg-indigo-100 text-indigo-800',
    NEWSLETTERS: 'bg-pink-100 text-pink-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };
  return colors[category] || colors.OTHER;
}

function DocumentCard({ 
  document, 
  onEdit, 
  onDelete, 
  onDownload 
}: { 
  document: DocumentWithRelations;
  onEdit?: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const uploaderName = document.uploader
    ? `${document.uploader.firstName || ''} ${document.uploader.lastName || ''}`.trim() || document.uploader.email
    : 'Unknown';

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {getFileIcon(document.fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{document.title}</h3>
              <p className="text-sm text-muted-foreground">
                {formatBytes(document.fileSize)}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {document.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {document.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className={cn('text-xs', getCategoryColor(document.category))}>
            {document.category.replace(/_/g, ' ')}
          </Badge>
          {document.visibility !== 'PUBLIC' && (
            <Badge variant="outline" className="text-xs">
              {document.visibility === 'BUILDING_TENANTS' ? 'Building Only' : 'Private'}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {document.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {document.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{document.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-6 py-3 bg-gray-50 text-xs text-muted-foreground">
        <div className="flex items-center justify-between w-full">
          <span>By {uploaderName}</span>
          <span>{formatDate(document.createdAt)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

function DocumentRow({ 
  document, 
  onEdit, 
  onDelete, 
  onDownload 
}: { 
  document: DocumentWithRelations;
  onEdit?: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const uploaderName = document.uploader
    ? `${document.uploader.firstName || ''} ${document.uploader.lastName || ''}`.trim() || document.uploader.email
    : 'Unknown';

  return (
    <tr className="hover:bg-gray-50">
      <td className="p-4">
        <div className="flex items-center gap-3">
          {getFileIcon(document.fileType)}
          <div className="min-w-0">
            <p className="font-medium truncate">{document.title}</p>
            {document.description && (
              <p className="text-sm text-muted-foreground truncate">
                {document.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        <Badge variant="secondary" className={cn('text-xs', getCategoryColor(document.category))}>
          {document.category.replace(/_/g, ' ')}
        </Badge>
      </td>
      <td className="p-4 text-sm">{formatBytes(document.fileSize)}</td>
      <td className="p-4 text-sm">{uploaderName}</td>
      <td className="p-4 text-sm">{formatDate(document.createdAt)}</td>
      <td className="p-4 text-sm">{document.downloadCount}</td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function DocumentList({ documents, view, onEdit }: DocumentListProps) {
  const downloadMutation = useDownloadDocument();
  const deleteMutation = useDeleteDocument();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDownload = (documentId: string) => {
    downloadMutation.mutate(documentId);
  };

  const handleDelete = (documentId: string) => {
    deleteMutation.mutate(documentId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
      },
    });
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by uploading a document.
        </p>
      </div>
    );
  }

  if (view === 'grid') {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onEdit={onEdit ? () => onEdit(document) : undefined}
              onDelete={() => setDeleteConfirmId(document.id)}
              onDownload={() => handleDownload(document.id)}
            />
          ))}
        </div>

        <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this document? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-4 text-left text-sm font-medium">Document</th>
              <th className="p-4 text-left text-sm font-medium">Category</th>
              <th className="p-4 text-left text-sm font-medium">Size</th>
              <th className="p-4 text-left text-sm font-medium">Uploaded By</th>
              <th className="p-4 text-left text-sm font-medium">Date</th>
              <th className="p-4 text-left text-sm font-medium">Downloads</th>
              <th className="p-4 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {documents.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                onEdit={onEdit ? () => onEdit(document) : undefined}
                onDelete={() => setDeleteConfirmId(document.id)}
                onDownload={() => handleDownload(document.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}