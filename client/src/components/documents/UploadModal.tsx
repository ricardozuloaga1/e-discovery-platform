import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload as UploadIcon, Plus } from 'lucide-react';
import { extractMetadata, uploadDocument } from '@/lib/documentProcessing';
import type { Tag, Document } from '@shared/schema';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: Document) => void;
  tags: Tag[];
}

export function UploadModal({ isOpen, onClose, onSuccess, tags }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTag, setNewTag] = useState('');
  const [custodian, setCustodian] = useState('');
  const [processingOptions, setProcessingOptions] = useState({
    extractText: true,
    extractMetadata: true,
    generatePreviews: true,
    aiAnalysis: true,
    ocrDocuments: false,
    piiDetection: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      setFiles([...files, ...fileList]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
      setFiles([...files, ...fileList]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleBrowseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleToggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      // In a real app, we would add the tag to the database
      console.log('Adding new tag:', newTag);
      setNewTag('');
    }
  };

  const handleToggleProcessingOption = (option: keyof typeof processingOptions) => {
    setProcessingOptions({
      ...processingOptions,
      [option]: !processingOptions[option]
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // For simplicity, we'll just upload the first file
      // In a real app, we would loop through all files
      const file = files[0];
      
      // Extract metadata from file
      const metadata = extractMetadata(file);
      
      // Upload document
      const document = await uploadDocument(file, {
        ...metadata,
        custodian
      });
      
      // In a real app, we would apply the selected tags to the document
      
      onSuccess(document);
      
      // Reset form
      setFiles([]);
      setSelectedTags([]);
      setCustodian('');
      
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Document Ingestion</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-6">
            <Label className="block text-sm font-medium text-neutral-700 mb-1">Upload Documents</Label>
            <div 
              className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.doc,.msg,.eml,.txt,.xlsx,.xls,.pptx,.ppt"
              />
              
              {files.length === 0 ? (
                <>
                  <UploadIcon className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                  <p className="text-neutral-600">Drag and drop files here or</p>
                  <Button 
                    variant="default"
                    className="mt-2 bg-primary text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    onClick={handleBrowseFiles}
                  >
                    Browse Files
                  </Button>
                  <p className="mt-2 text-xs text-neutral-500">
                    Supported formats: PDF, DOCX, MSG, EML, TXT, XLSX, PPTX
                  </p>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-neutral-50 p-2 rounded">
                        <span className="text-sm truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-neutral-500"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleBrowseFiles}
                  >
                    Add More Files
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm font-medium text-neutral-700 mb-1">Processing Options</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="extractText" 
                  checked={processingOptions.extractText}
                  onCheckedChange={() => handleToggleProcessingOption('extractText')}
                />
                <Label htmlFor="extractText" className="text-sm">Extract Text</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="extractMetadata" 
                  checked={processingOptions.extractMetadata}
                  onCheckedChange={() => handleToggleProcessingOption('extractMetadata')}
                />
                <Label htmlFor="extractMetadata" className="text-sm">Extract Metadata</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="generatePreviews" 
                  checked={processingOptions.generatePreviews}
                  onCheckedChange={() => handleToggleProcessingOption('generatePreviews')}
                />
                <Label htmlFor="generatePreviews" className="text-sm">Generate Image Previews</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="aiAnalysis" 
                  checked={processingOptions.aiAnalysis}
                  onCheckedChange={() => handleToggleProcessingOption('aiAnalysis')}
                />
                <Label htmlFor="aiAnalysis" className="text-sm">AI Analysis</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ocrDocuments" 
                  checked={processingOptions.ocrDocuments}
                  onCheckedChange={() => handleToggleProcessingOption('ocrDocuments')}
                />
                <Label htmlFor="ocrDocuments" className="text-sm">OCR Documents</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="piiDetection" 
                  checked={processingOptions.piiDetection}
                  onCheckedChange={() => handleToggleProcessingOption('piiDetection')}
                />
                <Label htmlFor="piiDetection" className="text-sm">PII Detection</Label>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="custodian" className="block text-sm font-medium text-neutral-700 mb-1">Custodian</Label>
            <Select value={custodian} onValueChange={setCustodian}>
              <SelectTrigger id="custodian" className="w-full">
                <SelectValue placeholder="Select Custodian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Custodian</SelectItem>
                <SelectItem value="Legal Department">Legal Department</SelectItem>
                <SelectItem value="Finance Team">Finance Team</SelectItem>
                <SelectItem value="Executive Office">Executive Office</SelectItem>
                <SelectItem value="IT Department">IT Department</SelectItem>
                <SelectItem value="custom">+ Add New Custodian</SelectItem>
              </SelectContent>
            </Select>
            {custodian === 'custom' && (
              <Input 
                className="mt-2" 
                placeholder="Enter custodian name"
                onChange={(e) => setCustodian(e.target.value)} 
              />
            )}
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-1">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags
                .filter(tag => selectedTags.includes(tag.id))
                .map(tag => (
                  <span 
                    key={tag.id} 
                    className={`tag px-2 py-1 rounded-full text-xs flex items-center ${tag.color.startsWith('#') 
                      ? `bg-opacity-10 text-${tag.color}` 
                      : tag.color}`}
                  >
                    {tag.name}
                    <button 
                      className="ml-1 text-opacity-70 hover:text-opacity-100"
                      onClick={() => handleToggleTag(tag.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              <span className="tag px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center">
                New Upload
                <button className="ml-1 text-blue-600 hover:text-blue-800">
                  <X className="h-3 w-3" />
                </button>
              </span>
              <span className="tag px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs flex items-center">
                Unreviewed
                <button className="ml-1 text-gray-600 hover:text-gray-800">
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
            
            <div className="flex">
              <Select 
                value="placeholder"
                onValueChange={(value) => {
                  if (value === 'placeholder') return;
                  const tagId = parseInt(value);
                  if (!isNaN(tagId)) handleToggleTag(tagId);
                }}
              >
                <SelectTrigger className="flex-1 rounded-r-none">
                  <SelectValue placeholder="Add tag..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Add tag...</SelectItem>
                  {tags
                    .filter(tag => !selectedTags.includes(tag.id))
                    .map(tag => (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button 
                variant="default"
                className="rounded-l-none"
                onClick={handleAddTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end space-x-2">
          <Button 
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="default"
            className="bg-primary hover:bg-primary-dark text-white"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? 'Processing...' : 'Begin Processing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
