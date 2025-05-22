import OpenAI from "openai";
import { Request, Response } from "express";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate a concise summary of the document content
 */
export async function generateSummary(req: Request, res: Response) {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ 
      error: 'Content is required and must be a string' 
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are an expert legal document analyzer. Your task is to provide a concise, accurate summary of the document in 3-5 sentences. Focus on the key points, legal implications, and main parties involved."
        },
        {
          role: "user",
          content
        }
      ],
      max_tokens: 1000,
      temperature: 0.2
    });

    const summary = response.choices[0].message.content || "Unable to generate summary.";
    
    res.status(200).json({ summary });
  } catch (error: any) {
    console.error("Error generating document summary:", error);
    res.status(500).json({ 
      error: 'Failed to generate document summary', 
      details: error.message || 'Unknown error' 
    });
  }
}

/**
 * Identify potential PII and sensitive information for redaction suggestions
 */
export async function detectPII(req: Request, res: Response) {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ 
      error: 'Content is required and must be a string' 
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
          
          For each potential redaction, provide the exact text and the reason for redaction.
          
          Format your response as a JSON array with objects containing 'text' and 'reason' fields.`
        },
        {
          role: "user",
          content
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    const redactions = Array.isArray(result.redactions) ? result.redactions : [];
    
    res.status(200).json({ redactions });
  } catch (error: any) {
    console.error("Error detecting PII:", error);
    res.status(500).json({ 
      error: 'Failed to detect PII in document', 
      details: error.message || 'Unknown error' 
    });
  }
}

/**
 * Suggest relevant document tags based on content analysis
 */
export async function suggestTags(req: Request, res: Response) {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ 
      error: 'Content is required and must be a string' 
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
          
          For each suggested tag, provide a confidence score between 0.0 and 1.0.
          
          Format your response as a JSON object with a 'tags' array containing objects with 'name' and 'confidence' fields.`
        },
        {
          role: "user",
          content
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const tags = Array.isArray(result.tags) ? result.tags : [];
    
    res.status(200).json({ tags });
  } catch (error: any) {
    console.error("Error suggesting document tags:", error);
    res.status(500).json({ 
      error: 'Failed to suggest document tags', 
      details: error.message || 'Unknown error' 
    });
  }
}

/**
 * Extract relevant entities from document content (people, organizations, dates, etc.)
 */
export async function extractEntities(req: Request, res: Response) {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ 
      error: 'Content is required and must be a string' 
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
          
          Return the entities grouped by category as a JSON object with category names as keys and arrays of strings as values.`
        },
        {
          role: "user",
          content
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const entities = result.entities || {};
    
    res.status(200).json({ entities });
  } catch (error: any) {
    console.error("Error extracting entities:", error);
    res.status(500).json({ 
      error: 'Failed to extract entities from document', 
      details: error.message || 'Unknown error' 
    });
  }
}

/**
 * Suggest coding decisions using a review protocol
 */
export async function suggestCoding(req: Request, res: Response) {
  const { content, protocol } = req.body;

  if (!content || typeof content !== 'string' || !protocol || typeof protocol !== 'string') {
    return res.status(400).json({
      error: 'Content and protocol are required and must be strings'
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are assisting with legal document review. Follow the provided review protocol to suggest coding options such as responsiveness, privilege, or confidentiality.`,
        },
        {
          role: 'user',
          content: `Review Protocol:\n${protocol}\n\nDocument Content:\n${content}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const suggestions = Array.isArray(result.suggestions) ? result.suggestions : result;

    res.status(200).json({ suggestions });
  } catch (error: any) {
    console.error('Error suggesting coding:', error);
    res.status(500).json({
      error: 'Failed to suggest coding',
      details: error.message || 'Unknown error',
    });
  }
}