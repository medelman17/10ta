'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { DocumentCategory, DocumentVisibility } from '@prisma/client';
import type { DocumentFilters } from '@/lib/api/documents';

interface DocumentFiltersProps {
  filters: DocumentFilters;
  onFiltersChange: (filters: DocumentFilters) => void;
}

const categories: { value: DocumentCategory; label: string }[] = [
  { value: 'TENANT_RIGHTS', label: 'Tenant Rights' },
  { value: 'BUILDING_POLICIES', label: 'Building Policies' },
  { value: 'MAINTENANCE_GUIDES', label: 'Maintenance Guides' },
  { value: 'LEGAL_FORMS', label: 'Legal Forms' },
  { value: 'MEETING_MINUTES', label: 'Meeting Minutes' },
  { value: 'FINANCIAL_REPORTS', label: 'Financial Reports' },
  { value: 'NEWSLETTERS', label: 'Newsletters' },
  { value: 'OTHER', label: 'Other' },
];

const visibilities: { value: DocumentVisibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'BUILDING_TENANTS', label: 'Building Tenants' },
  { value: 'TENANT_ONLY', label: 'Private' },
];

export function DocumentFilters({ filters, onFiltersChange }: DocumentFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [tagInput, setTagInput] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      category: value === 'all' ? undefined : value as DocumentCategory 
    });
  };

  const handleVisibilityChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      visibility: value === 'all' ? undefined : value as DocumentVisibility 
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    onFiltersChange({ 
      ...filters, 
      sortBy, 
      sortOrder: sortOrder as 'asc' | 'desc' 
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags?.includes(tagInput.trim())) {
      onFiltersChange({
        ...filters,
        tags: [...(filters.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onFiltersChange({
      ...filters,
      tags: filters.tags?.filter(t => t !== tag),
    });
  };

  const activeFilterCount = [
    filters.category,
    filters.visibility,
    filters.tags?.length,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select 
            value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              <SelectItem value="downloadCount-desc">Most Downloaded</SelectItem>
              <SelectItem value="fileSize-desc">Largest First</SelectItem>
              <SelectItem value="fileSize-asc">Smallest First</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 px-1.5 py-0.5 text-xs leading-none"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={filters.category || 'all'} 
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select 
                    value={filters.visibility || 'all'} 
                    onValueChange={handleVisibilityChange}
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue placeholder="All visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visibility</SelectItem>
                      {visibilities.map(visibility => (
                        <SelectItem key={visibility.value} value={visibility.value}>
                          {visibility.label}
                        </SelectItem>
                      ))}
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
                      placeholder="Add tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTag}
                    >
                      Add
                    </Button>
                  </div>
                  {filters.tags && filters.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filters.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag}
                          <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onFiltersChange({})}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}