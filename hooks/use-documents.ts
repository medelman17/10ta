import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchDocuments, 
  uploadDocument, 
  updateDocument,
  deleteDocument,
  downloadDocument,
  DocumentFilters 
} from '@/lib/api/documents';
import { toast } from 'sonner';

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: () => fetchDocuments(filters),
    // Keep data fresh for 30 seconds
    staleTime: 30 * 1000,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Document> }) => 
      updateDocument(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific document and list
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: downloadDocument,
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}