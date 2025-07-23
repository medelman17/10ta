# TanStack Best Practices for 10ta

This document outlines best practices for using TanStack Query and TanStack Table in our Next.js 14+ application.

## Installation

```bash
pnpm add @tanstack/react-query @tanstack/react-table
pnpm add -D @tanstack/react-query-devtools
```

## TanStack Query Setup

### 1. Create Query Client Provider

```typescript
// app/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. Update Root Layout

```typescript
// app/layout.tsx
import { QueryProvider } from '@/app/providers/query-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

## API Layer Best Practices

### 1. Create Typed API Functions

```typescript
// lib/api/documents.ts
import { Document, DocumentCategory, DocumentVisibility } from '@prisma/client';

export interface DocumentsResponse {
  documents: Document[];
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
  page?: number;
  limit?: number;
}

export async function fetchDocuments(filters: DocumentFilters = {}): Promise<DocumentsResponse> {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.category) params.append('category', filters.category);
  if (filters.visibility) params.append('visibility', filters.visibility);
  if (filters.tags) filters.tags.forEach(tag => params.append('tags', tag));
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`/api/documents?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
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
```

### 2. Create Custom Hooks

```typescript
// hooks/use-documents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDocuments, uploadDocument, DocumentFilters } from '@/lib/api/documents';
import { toast } from '@/hooks/use-toast';

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
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
```

## SSR with Hydration Pattern

### 1. Server Component with Prefetching

```typescript
// app/dashboard/documents/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { fetchDocuments } from '@/lib/api/documents';
import DocumentsClient from './documents-client';

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const queryClient = new QueryClient();
  
  // Prefetch documents on the server
  await queryClient.prefetchQuery({
    queryKey: ['documents', { page: 1, limit: 20 }],
    queryFn: () => fetchDocuments({ page: 1, limit: 20 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DocumentsClient />
    </HydrationBoundary>
  );
}
```

### 2. Client Component

```typescript
// app/dashboard/documents/documents-client.tsx
'use client';

import { useDocuments } from '@/hooks/use-documents';
import { useState } from 'react';

export default function DocumentsClient() {
  const [filters, setFilters] = useState({});
  const { data, isLoading, error } = useDocuments(filters);
  
  if (isLoading) return <DocumentsSkeleton />;
  if (error) return <ErrorState error={error} />;
  
  return <DocumentsList documents={data.documents} />;
}
```

## TanStack Table Integration

### 1. Define Columns

```typescript
// app/dashboard/documents/columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { Document } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatBytes, formatDate } from '@/lib/utils';

export const columns: ColumnDef<Document>[] = [
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.title}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      return <Badge variant="outline">{row.original.category}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'fileSize',
    header: 'Size',
    cell: ({ row }) => formatBytes(row.original.fileSize),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Uploaded
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
```

### 2. Create Reusable Data Table

```typescript
// components/ui/data-table.tsx
'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} searchKey={searchKey} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

## Performance Optimization

### 1. Infinite Queries for Large Lists

```typescript
// hooks/use-documents-infinite.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchDocuments } from '@/lib/api/documents';

export function useDocumentsInfinite(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['documents', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchDocuments({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}
```

### 2. Optimistic Updates

```typescript
// hooks/use-update-document.ts
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateDocument,
    // Optimistically update the cache
    onMutate: async (newDocument) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documents'] });
      
      // Snapshot previous value
      const previousDocuments = queryClient.getQueryData(['documents']);
      
      // Optimistically update
      queryClient.setQueryData(['documents'], (old) => {
        // Update logic here
      });
      
      // Return context with snapshot
      return { previousDocuments };
    },
    // If mutation fails, use context to roll back
    onError: (err, newDocument, context) => {
      if (context?.previousDocuments) {
        queryClient.setQueryData(['documents'], context.previousDocuments);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
```

### 3. Prefetch on Hover

```typescript
// components/document-link.tsx
import { useQueryClient } from '@tanstack/react-query';
import { fetchDocument } from '@/lib/api/documents';
import Link from 'next/link';

export function DocumentLink({ documentId, children }) {
  const queryClient = useQueryClient();
  
  const prefetchDocument = () => {
    queryClient.prefetchQuery({
      queryKey: ['document', documentId],
      queryFn: () => fetchDocument(documentId),
      staleTime: 10 * 1000, // 10 seconds
    });
  };
  
  return (
    <Link
      href={`/documents/${documentId}`}
      onMouseEnter={prefetchDocument}
      onFocus={prefetchDocument}
    >
      {children}
    </Link>
  );
}
```

## Error Handling

### 1. Global Error Boundary

```typescript
// app/providers/error-boundary.tsx
'use client';

import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-4">
      <h2 className="text-lg font-semibold">Something went wrong:</h2>
      <pre className="text-red-600">{error.message}</pre>
      <button onClick={resetErrorBoundary} className="mt-4">
        Try again
      </button>
    </div>
  );
}

export function QueryErrorBoundary({ children }) {
  const { reset } = useQueryErrorResetBoundary();
  
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={reset}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 2. Query-Specific Error Handling

```typescript
// components/documents-list.tsx
export function DocumentsList() {
  const { data, error, isError, refetch } = useDocuments();
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error?.message || 'Failed to load documents'}
          <Button onClick={() => refetch()} size="sm" className="mt-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Rest of component
}
```

## Testing

### 1. Mock Query Client for Tests

```typescript
// test/utils/query-wrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Turn off retries for tests
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 2. Testing Hooks

```typescript
// hooks/__tests__/use-documents.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useDocuments } from '../use-documents';
import { createQueryWrapper } from '@/test/utils/query-wrapper';

describe('useDocuments', () => {
  it('fetches documents successfully', async () => {
    const { result } = renderHook(() => useDocuments(), {
      wrapper: createQueryWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

## Common Patterns

### 1. Dependent Queries

```typescript
const { data: user } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
});

const { data: documents } = useQuery({
  queryKey: ['documents', user?.buildingId],
  queryFn: () => fetchBuildingDocuments(user.buildingId),
  enabled: !!user?.buildingId, // Only run when we have buildingId
});
```

### 2. Polling/Real-time Updates

```typescript
// Poll every 30 seconds for new documents
const { data } = useQuery({
  queryKey: ['documents'],
  queryFn: fetchDocuments,
  refetchInterval: 30 * 1000, // 30 seconds
  refetchIntervalInBackground: true, // Continue polling when tab is not active
});
```

### 3. Query Invalidation Patterns

```typescript
// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: ['documents'] });

// Invalidate all queries matching a pattern
queryClient.invalidateQueries({ 
  predicate: (query) => query.queryKey[0] === 'documents',
});

// Remove queries from cache
queryClient.removeQueries({ queryKey: ['documents', 'old'] });

// Reset queries to initial state
queryClient.resetQueries({ queryKey: ['documents'] });
```

## Migration from Current Implementation

1. **Install dependencies**: Add TanStack packages
2. **Set up providers**: Add QueryProvider to root layout
3. **Convert fetch calls**: Move to typed API functions
4. **Create custom hooks**: Replace direct fetch with useQuery
5. **Add error boundaries**: Wrap components that use queries
6. **Implement caching strategy**: Configure stale times
7. **Add optimistic updates**: For better UX on mutations
8. **Set up SSR**: Add hydration boundaries where needed

This setup will provide a robust, type-safe, and performant data fetching solution for the 10ta application.