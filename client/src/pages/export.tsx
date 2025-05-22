import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ExportModal } from '@/components/documents/ExportModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useDocuments } from '@/hooks/useDocuments';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatDate, formatFileSize } from '@/lib/utils';
import { 
  Download, 
  FileOutput, 
  FileText,
  File,
  Mail,
  FilePlus2,
  FileSpreadsheet
} from 'lucide-react';
import type { Document } from '@shared/schema';

export default function Export() {
  const { useAllDocuments } = useDocuments();
  const { data: documents, isLoading } = useAllDocuments();
  const { toast } = useToast();
  
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportConfig, setExportConfig] = useState<any>(null);
  
  // Handle document selection
  const handleToggleDocument = (documentId: number) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };
  
  // Handle select all
  const handleToggleAll = () => {
    if (!documents) return;
    
    if (selectedDocuments.size === documents.length) {
      // Deselect all
      setSelectedDocuments(new Set());
    } else {
      // Select all
      const newSelected = new Set<number>();
      documents.forEach(doc => newSelected.add(doc.id));
      setSelectedDocuments(newSelected);
    }
  };
  
  // Filter selected documents
  const getSelectedDocuments = (): Document[] => {
    if (!documents) return [];
    return documents.filter(doc => selectedDocuments.has(doc.id));
  };
  
  // Get icon for file type
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <File className="h-4 w-4 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FilePlus2 className="h-4 w-4 text-blue-500" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case 'msg':
      case 'eml':
        return <Mail className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-neutral-500" />;
    }
  };
  
  // Handle export
  const handleExport = (config: any) => {
    // In a real app, we would submit the export job to the server
    console.log('Export config:', config);
    
    // Simulate export process
    setTimeout(() => {
      setExportConfig(config);
      setExportComplete(true);
      
      toast({
        title: "Export Complete",
        description: `${config.documentCount} documents have been exported as ${config.productionName}.`,
      });
    }, 1000);
  };
  
  // Handle download
  const handleDownload = () => {
    if (!exportConfig) return;
    
    // In a real app, we would download the actual export files
    // For this demo, we'll just download the load file
    const blob = exportConfig.loadFile;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportConfig.productionName}.${exportConfig.loadFileFormat.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center">
            <h1 className="px-4 py-3 text-xl font-medium">Export Production Set</h1>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            disabled={selectedDocuments.size === 0}
            className="flex items-center"
          >
            <FileOutput className="mr-2 h-4 w-4" />
            Create Production Set
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {exportComplete ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <FileOutput className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Export Complete</h2>
              <p className="text-neutral-600">
                {exportConfig?.documentCount} documents have been exported as {exportConfig?.productionName}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="border rounded p-4">
                <h3 className="font-medium mb-2">Export Details</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-neutral-500">Format:</div>
                  <div>{exportConfig?.fileFormat}</div>
                  <div className="text-neutral-500">Bates Prefix:</div>
                  <div>{exportConfig?.batesPrefix}</div>
                  <div className="text-neutral-500">Load File:</div>
                  <div>{exportConfig?.loadFileFormat} Format</div>
                  <div className="text-neutral-500">Documents:</div>
                  <div>{exportConfig?.documentCount} documents</div>
                </div>
              </div>
              
              <div className="border rounded p-4">
                <h3 className="font-medium mb-2">Included Files</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <Checkbox checked={exportConfig?.includeOptions.textFiles} disabled />
                    <span className="ml-2">Text Files</span>
                  </div>
                  <div className="flex items-center">
                    <Checkbox checked={exportConfig?.includeOptions.images} disabled />
                    <span className="ml-2">Images</span>
                  </div>
                  <div className="flex items-center">
                    <Checkbox checked={exportConfig?.includeOptions.metadata} disabled />
                    <span className="ml-2">Metadata</span>
                  </div>
                  <div className="flex items-center">
                    <Checkbox checked={exportConfig?.includeOptions.nativeFiles} disabled />
                    <span className="ml-2">Native Files</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                variant="default" 
                className="flex items-center"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Files
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-medium">Select Documents for Export</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Choose the documents you want to include in your production set
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={documents?.length === selectedDocuments.size && documents?.length > 0}
                        onCheckedChange={handleToggleAll}
                      />
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Custodian</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading documents...
                      </TableCell>
                    </TableRow>
                  ) : !documents || documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No documents available
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedDocuments.has(document.id)}
                            onCheckedChange={() => handleToggleDocument(document.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {getFileIcon(document.fileType)}
                        </TableCell>
                        <TableCell className="font-medium">{document.title}</TableCell>
                        <TableCell>{document.custodian || 'N/A'}</TableCell>
                        <TableCell>
                          {document.uploadedAt 
                            ? formatDate(document.uploadedAt) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                        <TableCell>
                          {document.isRedacted ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Ready
                            </span>
                          ) : document.isReviewed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Reviewed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Unreviewed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="p-4 bg-neutral-50 border-t flex justify-between items-center">
              <div className="text-sm text-neutral-600">
                {selectedDocuments.size} of {documents?.length || 0} documents selected
              </div>
              <Button 
                variant="default" 
                onClick={() => setIsModalOpen(true)}
                disabled={selectedDocuments.size === 0}
              >
                Continue to Export
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documents={getSelectedDocuments()}
        onExport={handleExport}
      />
    </MainLayout>
  );
}
