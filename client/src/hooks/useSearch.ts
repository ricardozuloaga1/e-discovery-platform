import { useState, useCallback, useEffect } from 'react';
import { debounce } from '@/lib/utils';
import type { Document } from '@shared/schema';

interface SearchOptions {
  caseSensitive?: boolean;
  exactMatch?: boolean;
  fields?: string[];
}

export function useSearch(documents: Document[] | undefined, options: SearchOptions = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Define default fields to search within documents
  const defaultFields = ['title', 'content', 'custodian'];
  const fields = options.fields || defaultFields;

  // Search function with basic text matching
  const search = useCallback(
    (term: string) => {
      setIsSearching(true);
      
      // Start with empty results if no term or no documents
      if (!term || !documents || documents.length === 0) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      // For case-insensitive search, convert term to lowercase
      const searchValue = options.caseSensitive ? term : term.toLowerCase();

      // Filter documents based on search term
      const filtered = documents.filter(document => {
        // For each field in the document we want to search
        return fields.some(field => {
          // Get the value of the field, handle nested objects
          const value = field.split('.').reduce((obj, key) => obj && obj[key], document as any);
          
          // Skip if value doesn't exist
          if (value === undefined || value === null) return false;
          
          // Convert to string for searching
          const stringValue = String(value);
          const comparableValue = options.caseSensitive ? stringValue : stringValue.toLowerCase();
          
          // Search using either exact match or includes based on options
          return options.exactMatch 
            ? comparableValue === searchValue 
            : comparableValue.includes(searchValue);
        });
      });

      // Update results
      setResults(filtered);
      setIsSearching(false);
    },
    [documents, fields, options.caseSensitive, options.exactMatch]
  );

  // Create debounced version of search to limit frequent searches
  const debouncedSearch = useCallback(debounce(search, 300), [search]);

  // Effect to trigger search when searchTerm or documents change
  useEffect(() => {
    debouncedSearch(searchTerm);
    // Clean-up is handled by debounce
  }, [searchTerm, documents, debouncedSearch]);

  // Helper to reset search
  const resetSearch = useCallback(() => {
    setSearchTerm('');
    setResults([]);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    resetSearch
  };
}
