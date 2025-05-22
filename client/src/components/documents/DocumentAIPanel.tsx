import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Fingerprint, Tag as TagIcon, AlertCircle, Plus } from 'lucide-react';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import type { Document, Tag } from '@shared/schema';

interface DocumentAIPanelProps {
  document: Document;
  tags: Tag[];
  allTags: Tag[];
  onAddTag: (tagId: number) => void;
}

export function DocumentAIPanel({
  document,
  tags,
  allTags,
  onAddTag
}: DocumentAIPanelProps) {
  // Use AI analysis hooks for document content
  const { useSummarize, useDetectPII, useSuggestTags } = useAIAnalysis();
  
  // Get AI-powered insights when document content is available
  const { data: summaryData, isLoading: isSummaryLoading } = useSummarize(document.content);
  const { data: piiData, isLoading: isPIILoading } = useDetectPII(document.content);
  const { data: suggestedTagsData, isLoading: isTagsLoading } = useSuggestTags(document.content);

  // Helper to add suggested tag
  const handleAddSuggestedTag = (tagName: string) => {
    // Find if tag with this name exists
    const existingTag = allTags.find(tag => 
      tag.name.toLowerCase() === tagName.toLowerCase()
    );
    
    if (existingTag && !tags.some(t => t.id === existingTag.id)) {
      onAddTag(existingTag.id);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="text-xs">
            <Fingerprint className="h-3 w-3 mr-1" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="tags" className="text-xs">
            <TagIcon className="h-3 w-3 mr-1" />
            Suggested Tags
          </TabsTrigger>
          <TabsTrigger value="pii" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            PII Detection
          </TabsTrigger>
        </TabsList>
        
        {/* Summary Tab */}
        <TabsContent value="summary" className="p-4">
          <h4 className="font-medium text-sm mb-2">AI-Generated Summary</h4>
          {isSummaryLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : summaryData?.summary ? (
            <p className="text-sm text-neutral-600">{summaryData.summary}</p>
          ) : (
            <p className="text-sm text-neutral-500 italic">No summary available for this document.</p>
          )}
        </TabsContent>
        
        {/* Suggested Tags Tab */}
        <TabsContent value="tags" className="p-4">
          <h4 className="font-medium text-sm mb-2">AI-Suggested Tags</h4>
          {isTagsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : suggestedTagsData?.tags && suggestedTagsData.tags.length > 0 ? (
            <div>
              <p className="text-sm text-neutral-600 mb-2">
                Based on content analysis, this document may contain:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedTagsData.tags.map((tag: {name: string, confidence: number}, index: number) => {
                  const isTagApplied = allTags.some(t => 
                    t.name.toLowerCase() === tag.name.toLowerCase() && 
                    tags.some(docTag => docTag.id === t.id)
                  );
                  
                  return (
                    <div 
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs flex items-center ${
                        isTagApplied ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'
                      }`}
                    >
                      {tag.name}
                      {!isTagApplied && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-4 w-4 p-0 ml-1 text-blue-700 hover:text-blue-900 hover:bg-transparent"
                          onClick={() => handleAddSuggestedTag(tag.name)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                      <span className="ml-1 text-xs opacity-70">
                        {Math.round(tag.confidence * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 italic">No tag suggestions available for this document.</p>
          )}
        </TabsContent>
        
        {/* PII Detection Tab */}
        <TabsContent value="pii" className="p-4">
          <h4 className="font-medium text-sm mb-2">Sensitive Information</h4>
          {isPIILoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : piiData?.redactions && piiData.redactions.length > 0 ? (
            <div>
              <p className="text-sm text-neutral-600 mb-2">
                {piiData.redactions.length} potential instances of sensitive information detected:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {piiData.redactions.map((item: {text: string, reason: string}, index: number) => (
                  <div key={index} className="text-xs p-2 rounded bg-red-50 border border-red-100">
                    <div className="font-medium text-red-700">{item.reason}</div>
                    <div className="mt-1 text-neutral-800 break-all">{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 italic">No sensitive information detected in this document.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}