import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Share, ArrowLeft, ArrowRight, FileText, Eye } from 'lucide-react';
import type { Document, Redaction } from '@shared/schema';

interface DocumentViewerProps {
  document: Document;
  redactions?: Redaction[];
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function DocumentViewer({ 
  document, 
  redactions = [],
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false
}: DocumentViewerProps) {
  const [highlightedText, setHighlightedText] = useState<string[]>([]);
  
  // Process content and apply redactions
  const processContent = () => {
    if (!document.content) return '';
    
    let processedContent = document.content;
    
    // Apply redactions to the content
    redactions.forEach(redaction => {
      if (redaction.text) {
        // Simple replacement - in a real app you'd need more sophisticated text processing
        processedContent = processedContent.replace(
          redaction.text, 
          `<span class="redacted">${redaction.text}</span>`
        );
      }
    });
    
    // Apply highlights to the content
    highlightedText.forEach(text => {
      if (text) {
        const regex = new RegExp(`(${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        processedContent = processedContent.replace(regex, '<span class="highlight">$1</span>');
      }
    });
    
    return processedContent;
  };
  
  // Handle text selection for highlighting
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setHighlightedText([...highlightedText, selection.toString()]);
    }
  };
  
  // Handle print document
  const handlePrint = () => {
    // In a real app, we would create a printable version of the document
    window.print();
  };
  
  // Handle download document
  const handleDownload = () => {
    // Generate a download link to the API endpoint
    const downloadUrl = `/api/documents/${document.id}/download`;
    
    // Create and trigger the download link
    const element = window.document.createElement('a');
    element.href = downloadUrl;
    element.target = '_blank';
    element.download = document.title || 'document';
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };
  
  // Handle share document
  const handleShare = () => {
    // In a real app, we would show a share dialog
    console.log('Share document:', document.id);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-neutral-200 p-3 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="font-medium">{document.title}</h3>
          {document.batesNumber && (
            <span className="ml-2 text-xs bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full">{document.batesNumber}</span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-1.5 rounded text-neutral-500 hover:bg-neutral-100"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-1.5 rounded text-neutral-500 hover:bg-neutral-100"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-1.5 rounded text-neutral-500 hover:bg-neutral-100"
            onClick={handleShare}
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-neutral-200 px-4">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-80 grid-cols-2 mt-2">
              <TabsTrigger value="text" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Extracted Text
              </TabsTrigger>
              <TabsTrigger value="native" className="flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Native View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="pt-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                  {document.fileType ? document.fileType.toUpperCase() : 'TEXT'} Document
                </Badge>
                <span className="text-xs text-neutral-500">
                  Extracted Text View
                </span>
              </div>
            </TabsContent>
            
            <TabsContent value="native" className="pt-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  Native Document
                </Badge>
                <span className="text-xs text-neutral-500">
                  Original File View
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex-1 bg-neutral-100 overflow-auto p-6">
          <Tabs defaultValue="text" className="w-full h-full flex flex-col">
            <TabsContent value="text" className="w-full h-full mt-0 flex-1 flex overflow-auto">
              <div className="bg-white shadow-md rounded-lg w-full max-w-4xl p-8 document-content mx-auto overflow-y-auto max-h-[calc(100vh-240px)]" onMouseUp={handleTextSelection}>
                <div className="document-text" dangerouslySetInnerHTML={{ __html: processContent() }}></div>
              </div>
            </TabsContent>
            
            <TabsContent value="native" className="w-full h-full mt-0 overflow-auto">
              <div className="bg-white shadow-md rounded-lg w-full max-w-4xl p-8 mx-auto">
                <div className="flex flex-col items-center">
                  {document.fileType === 'pdf' ? (
                    <iframe 
                      src={`/api/documents/${document.id}/download`}
                      className="w-full h-[600px] border rounded"
                      title={document.title}
                    />
                  ) : (
                    <div className="text-center p-6 border-2 border-dashed border-neutral-300 rounded-lg w-full">
                      <div className="text-5xl mb-4 text-neutral-400 flex justify-center">
                        {document.fileType === 'docx' && <FileText className="h-16 w-16" />}
                        {document.fileType === 'xlsx' && <FileText className="h-16 w-16" />}
                        {document.fileType === 'pptx' && <FileText className="h-16 w-16" />}
                        {!['docx', 'xlsx', 'pptx'].includes(document.fileType || '') && <FileText className="h-16 w-16" />}
                      </div>
                      <h3 className="font-medium text-lg text-neutral-700">{document.title}</h3>
                      <p className="text-neutral-500 mt-2">
                        This is a {document.fileType ? document.fileType.toUpperCase() : 'DOCUMENT'} file. Native preview is not available, but you can download the file to view it.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Native File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {(onPrevious || onNext) && (
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex justify-between">
          <Button
            variant="outline"
            className="flex-1 bg-white border border-neutral-300 text-neutral-700 px-3 py-2 rounded text-sm hover:bg-neutral-100"
            onClick={onPrevious}
            disabled={!hasPrevious}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="w-2"></div>
          <Button
            variant="outline"
            className="flex-1 bg-white border border-neutral-300 text-neutral-700 px-3 py-2 rounded text-sm hover:bg-neutral-100"
            onClick={onNext}
            disabled={!hasNext}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
