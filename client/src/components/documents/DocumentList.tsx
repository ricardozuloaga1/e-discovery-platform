import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { Button } from '@/components/ui/button';
import { Filter, SortDesc, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Document, Tag } from '@shared/schema';

interface DocumentListProps {
  documents: Document[];
  selectedDocument?: Document | null;
  tags?: Map<number, Tag[]>;
  isLoading?: boolean;
  hasFilters?: boolean;
  onSelectDocument: (document: Document) => void;
}

export function DocumentList({
  documents,
  selectedDocument,
  tags,
  isLoading = false,
  hasFilters = false,
  onSelectDocument
}: DocumentListProps) {
  const [location, navigate] = useLocation();
  const [sortField, setSortField] = useState<keyof Document>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDocuments = documents.slice(startIndex, startIndex + itemsPerPage);

  // Sorting function
  const sortDocuments = (docs: Document[]) => {
    return [...docs].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === bValue) return 0;
      
      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Handle date sorting
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      // Handle number sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
  };

  const sortedAndPaginatedDocuments = sortDocuments(paginatedDocuments);

  const handleSort = () => {
    // Toggle sort direction
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleFilter = () => {
    // In a real app, this would open a filter modal
    console.log('Filter clicked');
  };

  const handleSettings = () => {
    // In a real app, this would open a settings modal
    console.log('Settings clicked');
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="w-full md:w-1/3 border-r border-neutral-200 flex flex-col bg-white">
      <div className="p-3 border-b border-neutral-200 flex items-center justify-between">
        <h3 className="font-medium">Documents ({documents.length})</h3>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-1.5 rounded text-neutral-500 hover:bg-neutral-100"
            onClick={handleFilter}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-1.5 rounded text-neutral-500 hover:bg-neutral-100"
            onClick={handleSort}
          >
            <SortDesc className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-1.5 rounded text-neutral-500 hover:bg-neutral-100"
            onClick={handleSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-neutral-500">
            Loading documents...
          </div>
        ) : sortedAndPaginatedDocuments.length === 0 ? (
          <div className="p-4 text-center text-neutral-500">
            {hasFilters 
              ? "No documents match your search criteria" 
              : "No documents available"}
          </div>
        ) : (
          sortedAndPaginatedDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              tags={tags?.get(document.id) || []}
              isSelected={selectedDocument?.id === document.id}
              onClick={() => onSelectDocument(document)}
            />
          ))
        )}
      </div>
      
      <div className="p-2 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-600 flex justify-between items-center">
        <div>
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, documents.length)} of {documents.length} documents
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="px-2 py-1 rounded border border-neutral-300 bg-white h-7 w-7"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="px-2 py-1 rounded border border-neutral-300 bg-white h-7 w-7"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
