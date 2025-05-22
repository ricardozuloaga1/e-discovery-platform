import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, FileText, Tag as TagIcon, AlertCircle, Plus } from 'lucide-react';
import type { Document, Tag, Redaction } from '@shared/schema';
import { formatFileSize } from '@/lib/utils';
import { AISummaryPanel } from './AISummaryPanel';

interface DocumentMetadataProps {
  document: Document;
  tags: Tag[];
  redactions?: Redaction[];
  allTags: Tag[];
  onAddTag: (tagId: number) => void;
  onRemoveTag: (tagId: number) => void;
  onSaveNote: (note: string) => void;
}

export function DocumentMetadata({
  document,
  tags,
  redactions = [],
  allTags,
  onAddTag,
  onRemoveTag,
  onSaveNote
}: DocumentMetadataProps) {
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  // Helper to group redactions by reason
  const groupRedactionsByReason = () => {
    const grouped: Record<string, number> = {};
    
    redactions.forEach(redaction => {
      const reason = redaction.reason || 'Unspecified';
      grouped[reason] = (grouped[reason] || 0) + 1;
    });
    
    return Object.entries(grouped);
  };

  const redactionsByReason = groupRedactionsByReason();

  const handleAddTag = (tagId: number) => {
    onAddTag(tagId);
  };

  const handleRemoveTag = (tagId: number) => {
    onRemoveTag(tagId);
  };

  const handleSaveNote = () => {
    onSaveNote(note);
    setNote('');
  };

  // Safely render metadata
  const renderMetadata = () => {
    if (!document.metadata) return null;
    
    const metadata = document.metadata as Record<string, any>;
    const metadataElements: JSX.Element[] = [];
    
    Object.keys(metadata).forEach((key, index) => {
      const value = metadata[key];
      if (value === undefined || value === null) return;
      
      // Format the key for display
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      metadataElements.push(
        <div className="text-neutral-500" key={`key-${index}`}>{formattedKey}:</div>
      );
      metadataElements.push(
        <div key={`value-${index}`}>{String(value)}</div>
      );
    });
    
    return metadataElements;
  };

  return (
    <div className="w-80 border-l border-neutral-200 bg-white flex flex-col">
      <div className="p-4 border-b border-neutral-200">
        <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="text-xs">
              <Info className="h-3 w-3 mr-1" />
              Details
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="redact" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Redactions
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} className="w-full">
          {/* Details Tab */}
          <TabsContent value="details" className="m-0">
            <div className="p-4 border-b border-neutral-200">
              <h4 className="font-medium text-sm mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span 
                    key={tag.id} 
                    className={`tag px-2 py-1 rounded-full text-xs flex items-center ${
                      tag.color && typeof tag.color === 'string' && tag.color.startsWith('#') 
                        ? `bg-opacity-10 text-${tag.color}` 
                        : tag.color || 'bg-gray-100 text-gray-800'}`}
                  >
                    {tag.name}
                    <button 
                      className="ml-1 text-opacity-70 hover:text-opacity-100"
                      onClick={() => handleRemoveTag(tag.id)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <div className="relative">
                  <select 
                    className="text-xs text-primary hover:underline appearance-none bg-transparent cursor-pointer pl-4 pr-1"
                    onChange={(e) => {
                      const tagId = parseInt(e.target.value);
                      if (tagId) {
                        handleAddTag(tagId);
                        e.target.value = ''; // Reset select
                      }
                    }}
                    value=""
                  >
                    <option value="">+ Add Tag</option>
                    {allTags
                      .filter(tag => !tags.some(t => t.id === tag.id))
                      .map(tag => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                  </select>
                  <Plus className="absolute left-0 top-1/2 transform -translate-y-1/2 h-3 w-3 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-b border-neutral-200">
              <h4 className="font-medium text-sm mb-2">Metadata</h4>
              <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-neutral-500">File Type:</div>
                <div>{document.fileType.toUpperCase()}</div>
                
                {renderMetadata()}
                
                <div className="text-neutral-500">Custodian:</div>
                <div>{document.custodian || 'Not specified'}</div>
                
                <div className="text-neutral-500">File Size:</div>
                <div>{formatFileSize(document.fileSize)}</div>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="font-medium text-sm mb-2">Notes</h4>
              <Textarea 
                className="w-full border border-neutral-300 rounded-md p-2 text-sm" 
                rows={3} 
                placeholder="Add notes about this document..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button 
                className="mt-2 bg-primary text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                onClick={handleSaveNote}
                disabled={!note.trim()}
              >
                Save Note
              </Button>
            </div>
          </TabsContent>
          
          {/* AI Insights Tab */}
          <TabsContent value="ai" className="m-0">
            <AISummaryPanel documentContent={document.content} />
          </TabsContent>
          
          {/* Redactions Tab */}
          <TabsContent value="redact" className="m-0">
            {redactions.length > 0 ? (
              <div className="p-4 border-b border-neutral-200">
                <h4 className="font-medium text-sm mb-2">Redactions</h4>
                <div className="text-sm text-neutral-600">
                  <p>{redactions.length} redactions applied:</p>
                  <ul className="list-disc pl-4 mt-1 text-xs">
                    {redactionsByReason.map(([reason, count], index) => (
                      <li key={index}>{reason} ({count} {count === 1 ? 'instance' : 'instances'})</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-neutral-500">No redactions have been applied to this document.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}