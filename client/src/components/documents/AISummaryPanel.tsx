import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface AISummaryPanelProps {
  documentContent: string | undefined;
}

export function AISummaryPanel({ documentContent }: AISummaryPanelProps) {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    if (!documentContent || documentContent.length < 50) {
      setError('Document content is too short for summarization');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: documentContent }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error('Error generating AI summary:', err);
      setError('Failed to generate summary. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">AI Document Analysis</h2>
      
      {!summary && !isLoading && (
        <div className="mb-4">
          <p className="text-sm text-neutral-600 mb-2">
            Generate an AI-powered summary of this document to quickly understand its key points.
          </p>
          <Button 
            onClick={generateSummary}
            disabled={isLoading || !documentContent || documentContent.length < 50}
            className="w-full"
          >
            {isLoading ? 'Generating...' : 'Generate Summary'}
          </Button>
        </div>
      )}
      
      {isLoading && (
        <div className="p-4 border rounded animate-pulse bg-neutral-50">
          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
        </div>
      )}
      
      {error && (
        <div className="p-3 text-red-700 bg-red-50 border border-red-100 rounded mb-4">
          {error}
        </div>
      )}
      
      {summary && (
        <div className="mt-2">
          <h3 className="text-sm font-medium mb-2">Document Summary</h3>
          <div className="p-3 bg-blue-50 text-neutral-800 rounded border border-blue-100 text-sm">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}