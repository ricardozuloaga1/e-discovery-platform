import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { MainLayout } from '@/components/layout/MainLayout';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { RedactionToolbar } from '@/components/redaction/RedactionToolbar';
import { RedactionTools } from '@/components/redaction/RedactionTools';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { useRedaction } from '@/hooks/useRedaction';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Document } from '@shared/schema';

export default function Redaction() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/redaction/:id');
  const { toast } = useToast();
  const documentId = params?.id ? parseInt(params.id) : null;
  
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const {
    useAllDocuments,
    useDocument,
    useDocumentRedactions,
    useCreateRedaction
  } = useDocuments();
  
  const { data: documents } = useAllDocuments();
  const { data: document } = useDocument(documentId);
  const { data: existingRedactions } = useDocumentRedactions(documentId);
  const createRedaction = useCreateRedaction();
  
  // Initialize redaction state
  const {
    isRedactionMode,
    redactionToolType,
    redactionReason,
    pendingRedactions,
    toggleRedactionMode,
    setRedactionToolType,
    setRedactionReason,
    addRedaction,
    removePendingRedaction,
    clearPendingRedactions,
    autoPIIDetection
  } = useRedaction(documentId || 0);
  
  // Set selected document when document data is loaded
  useEffect(() => {
    if (document) {
      setSelectedDocument(document);
    } else if (documents && documents.length > 0 && !documentId) {
      setSelectedDocument(documents[0]);
    }
  }, [document, documents, documentId]);
  
  // Handle applying redactions
  const handleApplyRedactions = async () => {
    if (!selectedDocument) return;
    
    try {
      // Submit all pending redactions
      for (const redaction of pendingRedactions) {
        await createRedaction.mutateAsync(redaction);
      }
      
      // Show success toast
      toast({
        title: "Redactions Applied",
        description: `${pendingRedactions.length} redactions have been applied to the document.`,
      });
      
      // Clear pending redactions and exit redaction mode
      clearPendingRedactions();
      toggleRedactionMode();
      
    } catch (error) {
      console.error('Failed to apply redactions:', error);
      toast({
        title: "Error",
        description: "Failed to apply redactions to the document.",
        variant: "destructive"
      });
    }
  };
  
  // Handle auto PII detection
  const handleAutoPIIDetect = () => {
    if (!selectedDocument || !selectedDocument.content) return;
    
    const detected = autoPIIDetection(selectedDocument.content);
    
    toast({
      title: `${detected} PII Items Detected`,
      description: `${detected} items were automatically detected and marked for redaction.`,
    });
  };
  
  // Handle canceling redaction mode
  const handleCancelRedaction = () => {
    clearPendingRedactions();
    toggleRedactionMode();
  };
  
  // Handle document selection
  const handleSelectDocument = (document: Document) => {
    // If in redaction mode, confirm before switching documents
    if (isRedactionMode && pendingRedactions.length > 0) {
      if (!confirm("You have unsaved redactions. Are you sure you want to switch documents?")) {
        return;
      }
      clearPendingRedactions();
    }
    
    setSelectedDocument(document);
    
    // Update URL if we're selecting a different document
    if (documentId !== document.id) {
      navigate(`/redaction/${document.id}`);
    }
  };
  
  return (
    <MainLayout>
      <div className="bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-2" 
              onClick={() => navigate(documentId ? `/documents/${documentId}` : '/documents')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Button>
            <h1 className="py-3 text-xl font-medium">
              {isRedactionMode ? 'Redaction Mode' : 'Redaction'}
              {selectedDocument && `: ${selectedDocument.title}`}
            </h1>
          </div>
          <div className="flex space-x-2">
            {isRedactionMode ? (
              <>
                <Button 
                  variant="outline"
                  onClick={handleCancelRedaction}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleApplyRedactions}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Apply Redactions
                </Button>
              </>
            ) : (
              <Button onClick={toggleRedactionMode}>
                Start Redacting
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Document list (narrow version) */}
        <div className="w-64 border-r border-neutral-200 bg-white flex flex-col">
          <div className="p-3 border-b border-neutral-200">
            <h3 className="font-medium">Documents ({documents?.length || 0})</h3>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {documents?.map((doc) => (
              <div 
                key={doc.id} 
                className={`border-b border-neutral-200 p-2 hover:bg-neutral-50 cursor-pointer ${
                  selectedDocument?.id === doc.id ? 'bg-blue-50 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                }`}
                onClick={() => handleSelectDocument(doc)}
              >
                <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-neutral-500">{doc.fileType.toUpperCase()}</span>
                  {doc.isRedacted && <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">Redacted</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {selectedDocument ? (
          isRedactionMode ? (
            <RedactionTools
              documentId={selectedDocument.id}
              isRedactionMode={isRedactionMode}
              redactionToolType={redactionToolType}
              redactionReason={redactionReason}
              selectedText=""
              pendingRedactions={pendingRedactions}
              onAddRedaction={addRedaction}
              onRemovePendingRedaction={removePendingRedaction}
            >
              <div dangerouslySetInnerHTML={{ __html: selectedDocument.content }} />
            </RedactionTools>
          ) : (
            <DocumentViewer 
              document={selectedDocument}
              redactions={existingRedactions || []}
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center bg-neutral-100">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-neutral-700 mb-2">Select a Document</h2>
              <p className="text-neutral-500 max-w-md">
                Choose a document from the list to view and redact its contents.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <RedactionToolbar 
        isVisible={isRedactionMode}
        redactionToolType={redactionToolType}
        redactionReason={redactionReason}
        onToolTypeChange={setRedactionToolType}
        onReasonChange={setRedactionReason}
        onApplyRedactions={handleApplyRedactions}
        onCancel={handleCancelRedaction}
        onAutoPIIDetect={handleAutoPIIDetect}
      />
    </MainLayout>
  );
}
