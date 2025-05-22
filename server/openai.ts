import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface AnalysisOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

const defaultOptions: AnalysisOptions = {
  maxTokens: 1000,
  temperature: 0.2,
  model: "gpt-4o" // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
};

/**
 * Generate a concise summary of the document content
 */
export async function generateDocumentSummary(content: string, options: AnalysisOptions = {}): Promise<string> {
  const mergedOptions = { ...defaultOptions, ...options };
  // Ensure we always have a string value for the model
  const modelToUse = mergedOptions.model || defaultOptions.model || "gpt-4o";

  try {
    const response = await openai.chat.completions.create({
      model: modelToUse as any, // Type assertion to avoid TypeScript errors
      messages: [
        {
          role: "system",
          content: "You are an expert legal document analyzer. Your task is to provide a concise, accurate summary of the document in 3-5 sentences. Focus on the key points, legal implications, and main parties involved."
        },
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: mergedOptions.maxTokens,
      temperature: mergedOptions.temperature
    });

    return response.choices[0].message.content || "Unable to generate summary.";
  } catch (error) {
    console.error("Error generating document summary:", error);
    throw new Error("Failed to generate document summary");
  }
}

/**
 * Identify potential PII and sensitive information for redaction suggestions
 */
export async function detectPII(content: string, options: AnalysisOptions = {}): Promise<Array<{ text: string, reason: string }>> {
  const mergedOptions = { ...defaultOptions, ...options };
  // Ensure we always have a string value for the model
  const modelToUse = mergedOptions.model || defaultOptions.model || "gpt-4o";

  try {
    const response = await openai.chat.completions.create({
      model: modelToUse as any, // Type assertion to avoid TypeScript errors
      messages: [
        {
          role: "system",
          content: `You are a legal document redaction specialist. Identify any information that should potentially be redacted for privacy, confidentiality, or legal reasons.
          
          This includes but is not limited to:
          - Personal Identifiable Information (PII): names, addresses, phone numbers, email addresses, SSNs, dates of birth
          - Financial information: bank account numbers, credit card details
          - Medical information: health records, diagnoses, medical history
          - Trade secrets: proprietary processes, formulas, technologies
          - Privileged communications: attorney-client communications
          
          For each potential redaction, provide the exact text and the reason for redaction.`
        },
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: mergedOptions.maxTokens,
      temperature: mergedOptions.temperature,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return Array.isArray(result.redactions) ? result.redactions : [];
  } catch (error) {
    console.error("Error detecting PII:", error);
    throw new Error("Failed to detect PII in document");
  }
}

/**
 * Suggest relevant document tags based on content analysis
 */
export async function suggestDocumentTags(content: string, options: AnalysisOptions = {}): Promise<Array<{ name: string, confidence: number }>> {
  const mergedOptions = { ...defaultOptions, ...options };
  // Ensure we always have a string value for the model
  const modelToUse = mergedOptions.model || defaultOptions.model || "gpt-4o";

  try {
    const response = await openai.chat.completions.create({
      model: modelToUse as any, // Type assertion to avoid TypeScript errors
      messages: [
        {
          role: "system",
          content: `You are a legal document classifier. Analyze the provided document and suggest relevant tags or categories.
          
          Common legal document categories include:
          - Agreement (contracts, MOUs, etc.)
          - Correspondence (letters, emails)
          - Court Filing (motions, briefs)
          - Financial (invoices, statements)
          - Evidence (declarations, exhibits)
          - Regulatory (filings, compliance)
          - Internal (memos, notes)
          
          For each suggested tag, provide a confidence score between 0.0 and 1.0.`
        },
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: mergedOptions.maxTokens,
      temperature: mergedOptions.temperature,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return Array.isArray(result.tags) ? result.tags : [];
  } catch (error) {
    console.error("Error suggesting document tags:", error);
    throw new Error("Failed to suggest document tags");
  }
}

/**
 * Extract relevant entities from document content (people, organizations, dates, etc.)
 */
export async function extractEntities(content: string, options: AnalysisOptions = {}): Promise<Record<string, string[]>> {
  const mergedOptions = { ...defaultOptions, ...options };
  // Ensure we always have a string value for the model
  const modelToUse = mergedOptions.model || defaultOptions.model || "gpt-4o";

  try {
    const response = await openai.chat.completions.create({
      model: modelToUse as any, // Type assertion to avoid TypeScript errors
      messages: [
        {
          role: "system",
          content: `You are an entity extraction specialist. Identify and categorize key entities from the provided document.
          
          Extract entities in these categories:
          - People: individual names
          - Organizations: company names, government agencies, etc.
          - Dates: any date mentions
          - Locations: places, addresses, etc.
          - Legal References: case citations, statute references
          - Financial Values: monetary amounts, percentages
          
          Return the entities grouped by category.`
        },
        {
          role: "user",
          content: content
        }
      ],
      max_tokens: mergedOptions.maxTokens,
      temperature: mergedOptions.temperature,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.entities || {};
  } catch (error) {
    console.error("Error extracting entities:", error);
    throw new Error("Failed to extract entities from document");
  }
}

export default {
  generateDocumentSummary,
  detectPII,
  suggestDocumentTags,
  extractEntities
};