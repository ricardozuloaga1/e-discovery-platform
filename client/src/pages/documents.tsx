import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MainLayout } from '@/components/layout/MainLayout';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { DocumentMetadata } from '@/components/documents/DocumentMetadata';
import { UploadModal } from '@/components/documents/UploadModal';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { useSearch } from '@/hooks/useSearch';
import { useQuery } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import type { Document, Tag } from '@shared/schema';

export default function Documents() {
  const [location, navigate] = useLocation();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentTags, setDocumentTags] = useState<Map<number, Tag[]>>(new Map());
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(location.includes('/upload'));
  
  // Get all documents
  const { 
    useAllDocuments, 
    useDocumentTags, 
    useAddDocumentTag, 
    useRemoveDocumentTag,
    useUpdateDocument
  } = useDocuments();
  
  const { data: documents, isLoading: isLoadingDocuments } = useAllDocuments();
  const { data: tags, isLoading: isLoadingTags } = useQuery({
    queryKey: ['/api/tags'],
  });
  
  const { data: selectedDocumentTags, isLoading: isLoadingDocumentTags } = useDocumentTags(
    selectedDocument?.id || null
  );
  
  const addDocumentTag = useAddDocumentTag();
  const removeDocumentTag = useRemoveDocumentTag();
  const updateDocument = useUpdateDocument();
  
  // Search functionality
  const { searchTerm, setSearchTerm, results: searchResults, isSearching } = useSearch(documents);
  
  // Get displayed documents based on search
  const displayedDocuments = searchTerm ? searchResults : documents || [];
  
  // Effect to update document tags map when tags are loaded
  useEffect(() => {
    if (selectedDocument && selectedDocumentTags) {
      setDocumentTags(prevTags => {
        const newTags = new Map(prevTags);
        newTags.set(selectedDocument.id, selectedDocumentTags);
        return newTags;
      });
    }
  }, [selectedDocument, selectedDocumentTags]);
  
  // Handle document selection
  const handleSelectDocument = (document: Document) => {
    setSelectedDocument(document);
  };
  
  // Handle adding tag to document
  const handleAddTag = async (tagId: number) => {
    if (!selectedDocument) return;
    
    try {
      await addDocumentTag.mutateAsync({
        documentId: selectedDocument.id,
        tagId
      });
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };
  
  // Handle removing tag from document
  const handleRemoveTag = async (tagId: number) => {
    if (!selectedDocument) return;
    
    try {
      await removeDocumentTag.mutateAsync({
        documentId: selectedDocument.id,
        tagId
      });
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };
  
  // Handle saving note
  const handleSaveNote = async (note: string) => {
    if (!selectedDocument) return;
    
    try {
      await updateDocument.mutateAsync({
        id: selectedDocument.id,
        document: {
          metadata: {
            ...selectedDocument.metadata,
            note
          }
        }
      });
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };
  
  // Handle upload success
  const handleUploadSuccess = (document: Document) => {
    setIsUploadModalOpen(false);
    navigate('/documents');
    setSelectedDocument(document);
  };

  return (
    <MainLayout onSearch={setSearchTerm} searchTerm={searchTerm}>
      <div className="bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center">
            <h1 className="px-4 py-3 text-xl font-medium">Document Review</h1>
          </div>
          <Button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <DocumentList 
          documents={displayedDocuments}
          selectedDocument={selectedDocument}
          tags={documentTags}
          isLoading={isLoadingDocuments || isSearching}
          hasFilters={!!searchTerm}
          onSelectDocument={handleSelectDocument}
        />
        
        {selectedDocument ? (
          <>
            <DocumentViewer
              document={selectedDocument}
              onPrevious={() => {
                const currentIndex = displayedDocuments.findIndex(d => d.id === selectedDocument.id);
                if (currentIndex > 0) {
                  setSelectedDocument(displayedDocuments[currentIndex - 1]);
                }
              }}
              onNext={() => {
                const currentIndex = displayedDocuments.findIndex(d => d.id === selectedDocument.id);
                if (currentIndex < displayedDocuments.length - 1) {
                  setSelectedDocument(displayedDocuments[currentIndex + 1]);
                }
              }}
              hasPrevious={displayedDocuments.findIndex(d => d.id === selectedDocument.id) > 0}
              hasNext={displayedDocuments.findIndex(d => d.id === selectedDocument.id) < displayedDocuments.length - 1}
            />
            
            <DocumentMetadata
              document={selectedDocument}
              tags={selectedDocumentTags || []}
              allTags={tags || []}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onSaveNote={handleSaveNote}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-100">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-neutral-700 mb-2">Select a Document</h2>
              <p className="text-neutral-500 max-w-md">
                Choose a document from the list to view its contents, metadata, and redactions.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          if (location.includes('/upload')) {
            navigate('/documents');
          }
        }}
        onSuccess={handleUploadSuccess}
        tags={tags || []}
      />
    </MainLayout>
  );
}
