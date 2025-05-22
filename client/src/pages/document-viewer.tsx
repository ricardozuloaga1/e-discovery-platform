import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { MainLayout } from '@/components/layout/MainLayout';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { DocumentMetadata } from '@/components/documents/DocumentMetadata';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react';
import type { Document } from '@shared/schema';

export default function DocumentViewerPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/documents/:id');
  const documentId = params?.id ? parseInt(params.id) : null;
  
  const {
    useDocument,
    useDocumentTags,
    useDocumentRedactions,
    useAddDocumentTag,
    useRemoveDocumentTag,
    useUpdateDocument
  } = useDocuments();
  
  const { data: document, isLoading: isLoadingDocument } = useDocument(documentId);
  const { data: documentTags } = useDocumentTags(documentId);
  const { data: documentRedactions } = useDocumentRedactions(documentId);
  const { data: allTags } = useQuery({ queryKey: ['/api/tags'] });
  
  const addDocumentTag = useAddDocumentTag();
  const removeDocumentTag = useRemoveDocumentTag();
  const updateDocument = useUpdateDocument();
  
  const handleAddTag = async (tagId: number) => {
    if (!documentId) return;
    
    try {
      await addDocumentTag.mutateAsync({
        documentId,
        tagId
      });
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };
  
  const handleRemoveTag = async (tagId: number) => {
    if (!documentId) return;
    
    try {
      await removeDocumentTag.mutateAsync({
        documentId,
        tagId
      });
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };
  
  const handleSaveNote = async (note: string) => {
    if (!document) return;
    
    try {
      await updateDocument.mutateAsync({
        id: document.id,
        document: {
          metadata: {
            ...document.metadata,
            note
          }
        }
      });
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };
  
  const handleRedactDocument = () => {
    if (documentId) {
      navigate(`/redaction/${documentId}`);
    }
  };
  
  if (isLoadingDocument) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <p>Loading document...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!document) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-neutral-700 mb-2">Document Not Found</h2>
            <p className="text-neutral-500 mb-4">
              The document you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/documents')}>
              Back to Documents
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-2" 
              onClick={() => navigate('/documents')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Button>
            <h1 className="py-3 text-xl font-medium truncate">
              {document.title}
            </h1>
          </div>
          <Button 
            onClick={handleRedactDocument}
            className="flex items-center"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Redact Document
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <DocumentViewer 
          document={document}
          redactions={documentRedactions || []}
        />
        
        <DocumentMetadata
          document={document}
          tags={documentTags || []}
          redactions={documentRedactions || []}
          allTags={allTags || []}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onSaveNote={handleSaveNote}
        />
      </div>
    </MainLayout>
  );
}
