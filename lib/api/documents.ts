import { Document, DocumentCategory, DocumentVisibility } from '@prisma/client';

export interface DocumentWithRelations extends Document {
  uploader?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  folder?: {
    id: string;
    name: string;
  } | null;
  building?: {
    id: string;
    name: string;
  };
  _count?: {
    relatedIssues: number;
    relatedCommunications: number;
  };
}

export interface DocumentsResponse {
  documents: DocumentWithRelations[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface DocumentFilters {
  search?: string;
  category?: DocumentCategory;
  visibility?: DocumentVisibility;
  tags?: string[];
  folderId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchDocuments(filters: DocumentFilters = {}): Promise<DocumentsResponse> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.visibility) params.append('visibility', filters.visibility);
  if (filters.tags) filters.tags.forEach(tag => params.append('tags', tag));
  if (filters.folderId) params.append('folderId', filters.folderId);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

  const response = await fetch(`/api/documents?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  
  return response.json();
}

export async function fetchDocument(id: string): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch document');
  }
  
  return response.json();
}

export async function uploadDocument(formData: FormData): Promise<Document> {
  const response = await fetch('/api/documents', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload document');
  }
  
  return response.json();
}

export async function updateDocument(id: string, data: Partial<Document>): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update document');
  }
  
  return response.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete document');
  }
}

export async function downloadDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${id}/download`);
  
  if (!response.ok) {
    throw new Error('Failed to download document');
  }
  
  // Get the filename from the response headers
  const contentDisposition = response.headers.get('content-disposition');
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] || 'document';
  
  // Download the file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}