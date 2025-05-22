import { Document, InsertDocument } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

/**
 * Mocked AI functions for document processing
 */

export const extractMetadata = (file: File) => {
  // In a real app, this would extract metadata from the file
  // For now, we'll return mock metadata
  const created = new Date();
  const modified = new Date();
  
  // Extract file extension to determine type
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Mock different authors based on file type
  let author = "System User";
  if (fileExt === 'pdf') author = "J. Robertson";
  else if (fileExt === 'docx') author = "Emma Thompson";
  else if (fileExt === 'msg') author = "Sarah Johnson";
  
  // Mock word count based on file size
  const wordCount = Math.round(file.size / 10);
  
  return {
    author,
    createdDate: created.toISOString().slice(0, 10),
    modifiedDate: modified.toISOString().slice(0, 10),
    wordCount
  };
};

export const generateAISummary = async (content: string): Promise<string> => {
  if (!content || content.length < 10) {
    return "No content available for summarization.";
  }
  
  try {
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

    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return "An error occurred while generating the document summary. Please try again later.";
  }
};

/**
 * Detect potential PII in content for redaction suggestions
 */
export const detectPII = async (content: string): Promise<{ text: string, reason: string }[]> => {
  if (!content || content.length < 10) {
    return [];
  }
  
  try {
    // Use our AI-powered PII detection API
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

    const data = await response.json();
    return data.redactions || [];
  } catch (error) {
    console.error('Error detecting PII with AI:', error);
    
    // Fallback to regex-based detection if AI fails
    const piiResults: { text: string, reason: string }[] = [];
    
    // Simple regex patterns for common PII
    const patterns = [
      { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, reason: "Phone Number" },
      { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, reason: "Email Address" },
      { pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, reason: "SSN" },
      { pattern: /\b\d{5}(?:[-\s]\d{4})?\b/g, reason: "Zip Code" },
      { pattern: /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?/g, reason: "Financial Amount" },
      { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, reason: "IP Address" },
      { pattern: /\b\d+\s+[A-Za-z\s]+(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Place|Pl|Terrace|Ter)\b[^,]*,?\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/gi, reason: "Address" }
    ];
    
    patterns.forEach(({ pattern, reason }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        piiResults.push({
          text: match[0],
          reason
        });
      }
    });
    
    return piiResults;
  }
};

/**
 * Upload a document to the server
 */
export const uploadDocument = async (file: File, metadata: any = {}): Promise<Document> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", file.name);
  formData.append("metadata", JSON.stringify(metadata));
  
  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
    credentials: "include"
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload document: ${error}`);
  }
  
  return await response.json();
};

/**
 * Generate Bates numbers for a production set
 */
export const generateBatesNumbers = (
  prefix: string, 
  startNumber: number, 
  count: number
): string[] => {
  const batesNumbers: string[] = [];
  const paddedLength = 6; // Standard padding length
  
  for (let i = 0; i < count; i++) {
    const number = startNumber + i;
    const paddedNumber = number.toString().padStart(paddedLength, '0');
    batesNumbers.push(`${prefix}${paddedNumber}`);
  }
  
  return batesNumbers;
};

/**
 * Mock function to generate load files (DAT, OPT, etc.)
 */
export const generateLoadFile = async (
  format: string,
  documents: Document[],
  batesNumbers: string[]
): Promise<Blob> => {
  // In a real application, you would generate actual load files
  // For this mock, we'll return text content that simulates the format
  
  let content = '';
  
  if (format === 'DAT') {
    // Simulate Concordance DAT format
    content = 'þDOCIDþþBATESþþTITLEþþCUSTODIANþþFILETYPEþ\n';
    documents.forEach((doc, index) => {
      content += `þ${doc.id}þþ${batesNumbers[index] || ''}þþ${doc.title}þþ${doc.custodian || ''}þþ${doc.fileType}þ\n`;
    });
  } else if (format === 'OPT') {
    // Simulate Opticon OPT format
    documents.forEach((doc, index) => {
      content += `${batesNumbers[index] || ''},${doc.filePath},Y,,,,,\n`;
    });
  } else {
    // Default format (simple CSV)
    content = 'ID,BATES,TITLE,CUSTODIAN,FILETYPE\n';
    documents.forEach((doc, index) => {
      content += `${doc.id},${batesNumbers[index] || ''},${doc.title},${doc.custodian || ''},${doc.fileType}\n`;
    });
  }
  
  return new Blob([content], { type: 'text/plain' });
};
