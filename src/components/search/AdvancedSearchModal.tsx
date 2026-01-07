import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';

export interface SearchFilters {
  query: string;
  fileType: string;
  dateRange: string;
  sizeRange: string;
  sortBy: string;
  sortOrder: string;
}

interface AdvancedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

const FILE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Documents' },
  { value: 'archive', label: 'Archives' },
];

const DATE_RANGES = [
  { value: 'all', label: 'Any Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

const SIZE_RANGES = [
  { value: 'all', label: 'Any Size' },
  { value: 'small', label: 'Under 1 MB' },
  { value: 'medium', label: '1 MB - 100 MB' },
  { value: 'large', label: '100 MB - 1 GB' },
  { value: 'huge', label: 'Over 1 GB' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'updated_at', label: 'Date Modified' },
];

export const AdvancedSearchModal = ({ 
  open, 
  onOpenChange, 
  onSearch,
  initialFilters 
}: AdvancedSearchModalProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialFilters?.query || '',
    fileType: initialFilters?.fileType || 'all',
    dateRange: initialFilters?.dateRange || 'all',
    sizeRange: initialFilters?.sizeRange || 'all',
    sortBy: initialFilters?.sortBy || 'created_at',
    sortOrder: initialFilters?.sortOrder || 'desc',
  });

  const handleSearch = () => {
    onSearch(filters);
    onOpenChange(false);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      fileType: 'all',
      dateRange: 'all',
      sizeRange: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const activeFiltersCount = [
    filters.fileType !== 'all',
    filters.dateRange !== 'all',
    filters.sizeRange !== 'all',
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Search
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} filters</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Query */}
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={filters.query}
                onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* File Type */}
          <div className="space-y-2">
            <Label>File Type</Label>
            <Select
              value={filters.fileType}
              onValueChange={(value) => setFilters(f => ({ ...f, fileType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(f => ({ ...f, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Range */}
          <div className="space-y-2">
            <Label>Size</Label>
            <Select
              value={filters.sizeRange}
              onValueChange={(value) => setFilters(f => ({ ...f, sizeRange: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_RANGES.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => setFilters(f => ({ ...f, sortBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => setFilters(f => ({ ...f, sortOrder: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={clearFilters} className="flex-1">
              Clear Filters
            </Button>
            <Button onClick={handleSearch} className="flex-1">
              Search
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
