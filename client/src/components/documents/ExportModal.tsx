import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { generateBatesNumbers, generateLoadFile } from '@/lib/documentProcessing';
import type { Document } from '@shared/schema';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onExport: (config: any) => void;
}

export function ExportModal({ isOpen, onClose, documents, onExport }: ExportModalProps) {
  const [productionName, setProductionName] = useState('Johnson_Production_001');
  const [fileFormat, setFileFormat] = useState('PDF');
  const [batesPrefix, setBatesPrefix] = useState('JOHNSON_');
  const [batesStartNumber, setBatesStartNumber] = useState(1);
  const [loadFileFormat, setLoadFileFormat] = useState('DAT');
  const [includeOptions, setIncludeOptions] = useState({
    textFiles: true,
    images: true,
    metadata: true,
    nativeFiles: false
  });

  const handleToggleIncludeOption = (option: keyof typeof includeOptions) => {
    setIncludeOptions({
      ...includeOptions,
      [option]: !includeOptions[option]
    });
  };

  const handleExport = async () => {
    // Generate Bates numbers for all documents
    const batesNumbers = generateBatesNumbers(
      batesPrefix,
      batesStartNumber,
      documents.length
    );
    
    // In a real app, we would generate the export files here
    // For this mock, we'll just simulate the process
    
    // Generate a mock load file
    const loadFile = await generateLoadFile(
      loadFileFormat,
      documents,
      batesNumbers
    );
    
    // Prepare export configuration
    const exportConfig = {
      productionName,
      fileFormat,
      batesPrefix,
      batesStartNumber,
      loadFileFormat,
      includeOptions,
      documentCount: documents.length,
      batesNumbers,
      loadFile
    };
    
    onExport(exportConfig);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Production Set</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <div className="mb-4">
            <Label htmlFor="productionName" className="block text-sm font-medium text-neutral-700 mb-1">
              Production Name
            </Label>
            <Input 
              id="productionName"
              value={productionName}
              onChange={(e) => setProductionName(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm font-medium text-neutral-700 mb-1">
              File Format
            </Label>
            <RadioGroup 
              value={fileFormat} 
              onValueChange={setFileFormat}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PDF" id="pdf" />
                <Label htmlFor="pdf">PDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TIFF" id="tiff" />
                <Label htmlFor="tiff">TIFF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Native" id="native" />
                <Label htmlFor="native">Native</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm font-medium text-neutral-700 mb-1">
              Bates Numbering
            </Label>
            <div className="flex space-x-4 items-center">
              <Input 
                className="flex-1"
                placeholder="Prefix"
                value={batesPrefix}
                onChange={(e) => setBatesPrefix(e.target.value)}
              />
              <span>-</span>
              <Input 
                type="number"
                className="w-24"
                value={batesStartNumber}
                onChange={(e) => setBatesStartNumber(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="loadFileFormat" className="block text-sm font-medium text-neutral-700 mb-1">
              Load File Format
            </Label>
            <Select value={loadFileFormat} onValueChange={setLoadFileFormat}>
              <SelectTrigger id="loadFileFormat" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAT">Concordance (.DAT)</SelectItem>
                <SelectItem value="DII">Summation (.DII)</SelectItem>
                <SelectItem value="OPT">Opticon (.OPT)</SelectItem>
                <SelectItem value="XML">EDRM XML (.XML)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm font-medium text-neutral-700 mb-1">
              Include
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeTextFiles"
                  checked={includeOptions.textFiles}
                  onCheckedChange={() => handleToggleIncludeOption('textFiles')}
                />
                <Label htmlFor="includeTextFiles" className="text-sm">Text Files</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeImages"
                  checked={includeOptions.images}
                  onCheckedChange={() => handleToggleIncludeOption('images')}
                />
                <Label htmlFor="includeImages" className="text-sm">Images</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeMetadata"
                  checked={includeOptions.metadata}
                  onCheckedChange={() => handleToggleIncludeOption('metadata')}
                />
                <Label htmlFor="includeMetadata" className="text-sm">Metadata</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeNativeFiles"
                  checked={includeOptions.nativeFiles}
                  onCheckedChange={() => handleToggleIncludeOption('nativeFiles')}
                />
                <Label htmlFor="includeNativeFiles" className="text-sm">Native Files</Label>
              </div>
            </div>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-neutral-700 mb-1">
              Documents to Export
            </Label>
            <div className="p-3 bg-neutral-100 rounded-md">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <strong>{documents.length}</strong> documents selected
                </div>
                <Button variant="link" className="text-primary text-sm p-0 h-auto">
                  Modify Selection
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="default"
            className="bg-primary hover:bg-primary-dark text-white"
            onClick={handleExport}
          >
            Start Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
