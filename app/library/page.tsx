"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Search, 
  Download, 
  FileText, 
  Scale, 
  Shield, 
  Home,
  Clock,
  User,
  Filter,
  BookOpen,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { DocumentCategory } from "@prisma/client";

interface Document {
  id: string;
  title: string;
  description: string | null;
  category: DocumentCategory;
  tags: string[];
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  uploader: {
    firstName: string | null;
    lastName: string | null;
  };
  building: {
    name: string;
  } | null;
}

interface DocumentsResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

// Map all document categories to display groups for public library
const getCategoryDisplay = (category: DocumentCategory) => {
  // Define the default fallback
  const defaultDisplay = { icon: BookOpen, color: "bg-gray-100 text-gray-800", label: "Documents" };
  
  // Define specific mappings for categories we want to highlight in public view
  const categoryMapping: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
    // Tenant Information
    TENANT_RIGHTS: { icon: Scale, color: "bg-blue-100 text-blue-800", label: "Tenant Rights" },
    BUILDING_POLICIES: { icon: Building2, color: "bg-green-100 text-green-800", label: "Building Policies" },
    MAINTENANCE_GUIDES: { icon: Home, color: "bg-orange-100 text-orange-800", label: "Maintenance Guides" },
    LEGAL_FORMS: { icon: FileText, color: "bg-purple-100 text-purple-800", label: "Legal Forms" },
    
    // Legal Documentation
    LEGAL_NOTICES: { icon: FileText, color: "bg-purple-100 text-purple-800", label: "Legal Notices" },
    COURT_DOCUMENTS: { icon: FileText, color: "bg-purple-100 text-purple-800", label: "Court Documents" },
    
    // Administrative
    MEETING_MINUTES: { icon: BookOpen, color: "bg-gray-100 text-gray-800", label: "Meeting Minutes" },
    FINANCIAL_REPORTS: { icon: BookOpen, color: "bg-gray-100 text-gray-800", label: "Financial Reports" },
    NEWSLETTERS: { icon: BookOpen, color: "bg-gray-100 text-gray-800", label: "Newsletters" },
    
    // Default for everything else
    OTHER: { icon: BookOpen, color: "bg-gray-100 text-gray-800", label: "Other" },
  };
  
  // Return specific mapping if exists, otherwise return default
  return categoryMapping[category] || defaultDisplay;
};

// Simplified categories for public filtering
const publicCategories = [
  { value: "TENANT_RIGHTS", label: "Tenant Rights", icon: Scale },
  { value: "BUILDING_POLICIES", label: "Building Policies", icon: Building2 },
  { value: "MAINTENANCE_GUIDES", label: "Maintenance Guides", icon: Home },
  { value: "LEGAL_FORMS", label: "Legal Forms", icon: FileText },
  { value: "LEGAL_NOTICES", label: "Legal Notices", icon: FileText },
  { value: "MEETING_MINUTES", label: "Meeting Minutes", icon: BookOpen },
  { value: "NEWSLETTERS", label: "Newsletters", icon: BookOpen },
] as const;

export default function LibraryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "ALL">("ALL");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalCount: 0,
    totalPages: 0
  });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        visibility: 'PUBLIC'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedCategory !== "ALL") {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/documents?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data: DocumentsResponse = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDocuments();
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      // For now, we'll just open the file URL directly
      window.open(`/api/documents/${doc.id}`, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              <Link href="/" className="font-semibold text-lg">10 Ocean Tenant Association</Link>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link href="/about">About</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/contact">Contact</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/blog">Blog</Link>
              </Button>
              <Button asChild variant="default">
                <Link href="/library">Resources</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Join</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Tenant Resource Library</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access important tenant rights documents, building information, legal resources, and safety procedures.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("ALL")}
            >
              <Filter className="mr-2 h-4 w-4" />
              All Categories
            </Button>
            {publicCategories.map(({ value, label, icon: IconComponent }) => (
              <Button
                key={value}
                variant={selectedCategory === value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(value as DocumentCategory)}
              >
                <IconComponent className="mr-2 h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading documents...</p>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="font-semibold text-red-900 mb-2">Error Loading Documents</h3>
              <p className="text-red-800 mb-4">{error}</p>
              <Button onClick={fetchDocuments} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Documents Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "ALL" 
                  ? "Try adjusting your search or filter criteria."
                  : "No public documents are currently available."
                }
              </p>
              {(searchTerm || selectedCategory !== "ALL") && (
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("ALL");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Document Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {documents.map((doc) => {
                const { icon: IconComponent, color: categoryColor, label: categoryLabel } = getCategoryDisplay(doc.category);
                
                return (
                  <Card key={doc.id} className="border rounded-lg hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className={`${categoryColor} text-xs`}>
                          <IconComponent className="mr-1 h-3 w-3" />
                          {categoryLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{doc.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {doc.description}
                        </p>
                      )}
                      
                      {doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {doc.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                          {doc.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{doc.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 mb-1">
                            <User className="h-3 w-3" />
                            <span>
                              {doc.uploader.firstName && doc.uploader.lastName
                                ? `${doc.uploader.firstName} ${doc.uploader.lastName}`
                                : "Admin"
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleDownload(doc)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Information Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                About This Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This public resource library contains essential documents for tenants of 10 Ocean Avenue. 
                All documents are provided for informational purposes and are accessible to everyone.
              </p>
              <p className="text-sm text-muted-foreground">
                For building-specific documents and full platform access, please sign up as a verified tenant.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Can&apos;t find what you&apos;re looking for? Our tenant association is here to help.
              </p>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/contact">Contact Us</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/sign-up">Join Platform</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}