import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

/**
 * Custom hook for AI-powered document analysis features
 */
export function useAIAnalysis() {
  /**
   * Generate an AI summary of document content
   */
  const useSummarize = (content: string | undefined) => {
    return useQuery({
      queryKey: ['ai', 'summarize', content ? content.substring(0, 50) : ''],
      queryFn: async () => {
        if (!content || content.length < 10) {
          return { summary: 'Insufficient content for summarization.' };
        }
        
        const response = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return response.json();
      },
      enabled: !!content && content.length > 10,
    });
  };
  
  /**
   * Detect PII and sensitive information for redaction suggestions
   */
  const useDetectPII = (content: string | undefined) => {
    return useQuery({
      queryKey: ['ai', 'detectPII', content ? content.substring(0, 50) : ''],
      queryFn: async () => {
        if (!content || content.length < 10) {
          return { redactions: [] };
        }
        
        const response = await fetch('/api/ai/detect-pii', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return response.json();
      },
      enabled: !!content && content.length > 10,
    });
  };
  
  /**
   * Suggest document tags based on content analysis
   */
  const useSuggestTags = (content: string | undefined) => {
    return useQuery({
      queryKey: ['ai', 'suggestTags', content ? content.substring(0, 50) : ''],
      queryFn: async () => {
        if (!content || content.length < 10) {
          return { tags: [] };
        }
        
        const response = await fetch('/api/ai/suggest-tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return response.json();
      },
      enabled: !!content && content.length > 10,
    });
  };
  
  /**
   * Extract important entities from document content
   */
  const useExtractEntities = (content: string | undefined) => {
    return useQuery({
      queryKey: ['ai', 'extractEntities', content ? content.substring(0, 50) : ''],
      queryFn: async () => {
        if (!content || content.length < 10) {
          return { entities: {} };
        }
        
        const response = await fetch('/api/ai/extract-entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return response.json();
      },
      enabled: !!content && content.length > 10,
    });
  };
  
  return {
    useSummarize,
    useDetectPII,
    useSuggestTags,
    useExtractEntities
  };
}