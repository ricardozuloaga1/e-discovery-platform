import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import * as fs from "fs";
import * as ai from "./ai";

import {
  insertDocumentSchema,
  insertTagSchema,
  insertDocumentTagSchema,
  insertRedactionSchema,
  insertProductionSetSchema,
  insertProductionDocumentSchema,
} from "@shared/schema";
import { z } from "zod";

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      // Create unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function for validation
  const validateBody = <T>(schema: z.ZodType<T>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: error.errors 
          });
        }
        return res.status(400).json({ message: "Invalid request body" });
      }
    };
  };

  // Document endpoints
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Upload documents endpoint
  app.post("/api/documents/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const {
        title = req.file.originalname,
        custodian = "",
        content = "",
        metadata = {},
      } = req.body;

      // Extract text from document based on file type
      let extractedContent = content || "";
      const filePath = path.join(process.cwd(), 'uploads', req.file.filename);
      const fileExt = path.extname(req.file.originalname).toLowerCase().substring(1);
      
      // Extract content if none was provided
      if (extractedContent === "") {
        console.log(`Processing ${fileExt} file: ${filePath}`);
        
        // Handle different file types
        if (fileExt === 'txt' || fileExt === 'csv') {
          // Text files can be read directly
          try {
            extractedContent = fs.readFileSync(filePath, 'utf8');
          } catch (err) {
            console.error('Error reading text file:', err);
            extractedContent = `This text file appears to be empty or in an unsupported format.`;
          }
        } 
        else if (fileExt === 'pdf') {
          try {
            console.log(`Processing pdf file: ${filePath}`);
            
            // Read the PDF file as a buffer
            const dataBuffer = fs.readFileSync(filePath);
            
            // DIRECT APPROACH: Read the PDF directly and extract text chunks
            // This avoids dependency issues with pdf-parse
            
            // Convert buffer to string for analysis
            const pdfString = dataBuffer.toString('utf8', 0, Math.min(dataBuffer.length, 30000));
            
            // Look for text content patterns commonly found in PDFs
            // 1. Text between parentheses (common in PDF content streams)
            const textRegex = /\(([^)]{3,})\)/g;
            const matches = pdfString.match(textRegex);
            
            let extractedText = '';
            
            if (matches && matches.length > 5) {
              // Process the matches to get cleaner text
              extractedText = matches
                .map(match => match.substring(1, match.length - 1)) // Remove the parentheses
                .filter(text => {
                  // Filter out PDF structure elements and keep only content
                  return text.length > 3 && 
                        !text.includes('PDF') && 
                        !text.includes('obj') &&
                        !text.includes('stream') &&
                        !text.includes('Acrobat') &&
                        !text.includes('Adobe') &&
                        !/^[0-9.\s]+$/.test(text); // Filter out strings with only numbers and spaces
                })
                .join(' ');
            }
            
            // If we got some real text content
            if (extractedText && extractedText.length > 100) {
              console.log(`Extracted ${extractedText.length} characters from PDF`);
              
              // Clean up the text by removing duplicate spaces and normalizing line breaks
              extractedText = extractedText
                .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
                .replace(/\r\n|\r|\n/g, '\n')  // Normalize line breaks
                .trim();
              
              // Attempt to structure the text with proper paragraphs
              let structuredText = '';
              const lines = extractedText.split(/\s{2,}|\n/);
              
              for (const line of lines) {
                if (line.trim().length > 0) {
                  structuredText += line.trim() + '\n\n';
                }
              }
              
              extractedContent = structuredText || extractedText;
              
              // Add file info
              extractedContent += `\n\n--- PDF Document: ${title} ---\n`;
              extractedContent += `File size: ${(dataBuffer.length / 1024).toFixed(2)} KB\n`;
            } else {
              // 2. Try another approach: look for text after "TJ" operators
              const tjRegex = /\[((?:[^[\]]+|\[[^\]]*\])*)\]\s*TJ/g;
              const tjMatches = pdfString.match(tjRegex);
              
              if (tjMatches && tjMatches.length > 0) {
                let tjText = '';
                
                for (const match of tjMatches) {
                  // Extract content between brackets
                  const content = match.substring(1, match.indexOf(']'));
                  
                  // Look for text in parentheses within the TJ content
                  const textParts = content.match(/\(([^)]+)\)/g);
                  
                  if (textParts) {
                    tjText += textParts
                      .map(part => part.substring(1, part.length - 1))
                      .join(' ') + ' ';
                  }
                }
                
                if (tjText.length > 100) {
                  console.log(`TJ extraction found ${tjText.length} characters`);
                  extractedContent = tjText.replace(/\s+/g, ' ').trim();
                  
                  // Add file info
                  extractedContent += `\n\n--- PDF Document: ${title} ---\n`;
                  extractedContent += `File size: ${(dataBuffer.length / 1024).toFixed(2)} KB\n`;
                } else {
                  // Still couldn't extract meaningful text
                  extractedContent = `The PDF file "${title}" appears to contain limited extractable text content.\n\n`;
                  extractedContent += `To view the document properly, please use the Native View tab.\n\n`;
                  extractedContent += `File size: ${(dataBuffer.length / 1024).toFixed(2)} KB`;
                }
              } else {
                // Couldn't extract meaningful text with either method
                extractedContent = `The PDF file "${title}" appears to be image-based or contains no extractable text.\n\n`;
                extractedContent += `To view the document properly, please use the Native View tab.\n\n`;
                extractedContent += `File size: ${(dataBuffer.length / 1024).toFixed(2)} KB`;
              }
            }
          } catch (error) {
            console.error('Error processing PDF:', error);
            extractedContent = `Error processing PDF file "${title}".\n\n`;
            extractedContent += `The file was uploaded successfully but text extraction failed.\n\n`;
            extractedContent += `To view the document, please use the Native View tab.\n\n`;
            extractedContent += `File size: ${(req.file.size / 1024).toFixed(2)} KB`;
          }
        } 
        else if (fileExt === 'docx' || fileExt === 'doc') {
          // Use mammoth to extract real text content from Word documents
          try {
            console.log(`Processing ${fileExt} file: ${filePath}`);
            
            if (fileExt === 'docx') {
              // Use mammoth to extract text from DOCX files
              try {
                // Import mammoth using ES module syntax
                const mammoth = await import('mammoth');
                
                // Read the file
                const buffer = fs.readFileSync(filePath);
                
                // Extract the text content
                const result = await mammoth.extractRawText({buffer});
                
                if (result && result.value && result.value.trim().length > 0) {
                  // Success! We got the actual text content
                  extractedContent = result.value;
                  
                  console.log(`Successfully extracted ${result.value.length} characters from DOCX`);
                  
                  // Report any warnings if they exist
                  const warnings = (result as any).warnings;
                  if (warnings && Array.isArray(warnings) && warnings.length > 0) {
                    console.log(`Warnings while extracting DOCX content: ${warnings.length} issues`);
                  }
                } else {
                  // No content found in the document
                  extractedContent = `Word Document: ${title}\n\n`;
                  extractedContent += `This document appears to be empty or contains no extractable text content.\n\n`;
                  extractedContent += `To view the document with all formatting, please use the Native View tab.\n\n`;
                  extractedContent += `File size: ${(req.file.size / 1024).toFixed(2)} KB`;
                }
              } catch (extractErr) {
                console.error('Error extracting content from DOCX:', extractErr);
                extractedContent = `Word Document: ${title}\n\n`;
                extractedContent += `This document was uploaded in Microsoft Word format but text extraction failed.\n\n`;
                extractedContent += `To view the document with all formatting, please use the Native View tab.\n\n`;
                extractedContent += `File size: ${(req.file.size / 1024).toFixed(2)} KB`;
              }
            } else {
              // For DOC files (older format), provide info about viewing in native view
              extractedContent = `Word Document: ${title}\n\n`;
              extractedContent += `This document was uploaded in the older Microsoft Word DOC format.\n\n`;
              extractedContent += `To view the document properly, please use the Native View tab.\n\n`;
              extractedContent += `File size: ${(req.file.size / 1024).toFixed(2)} KB`;
            }
          } catch (error) {
            console.error(`Error processing ${fileExt} file:`, error);
            extractedContent = `Word Document: ${title}\n\n`;
            extractedContent += `This document was uploaded in Microsoft Word format. Word documents typically contain formatted text, tables, images, and other rich content.\n\n`;
            extractedContent += `You can view the original Word document by clicking the "Native View" tab above.\n\n`;
            extractedContent += `File size: ${(req.file.size / 1024).toFixed(2)} KB`;
          }
        } 
        else if (fileExt === 'xlsx' || fileExt === 'xls') {
          // For Excel files, provide descriptive content
          extractedContent = `Excel Spreadsheet: ${title}\n\n`;
          extractedContent += `This document was uploaded in Microsoft Excel format. Excel files typically contain tables of data organized in cells, formulas, and multiple worksheets.\n\n`;
          extractedContent += `You can view the original Excel file by clicking the "Native View" tab above.\n\n`;
          extractedContent += `File size: ${(req.file.size / 1024).toFixed(2)} KB`;
        } 
        else {
          // For unsupported formats
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check if this appears to be a text file
            if (content && !content.includes('\u0000')) {
              extractedContent = content;
            } else {
              // Provide descriptive content for binary files
              extractedContent = `${fileExt.toUpperCase()} File: ${title}\n\n`;
              extractedContent += `This document was uploaded in ${fileExt.toUpperCase()} format.\n\n`;
              extractedContent += `This file type cannot be displayed as text in the document viewer.\n\n`;
              extractedContent += `You can download the original file by clicking the "Native View" tab above.\n\n`;
              extractedContent += `File size: ${(req.file.size / 1024).toFixed(2)} KB`;
            }
          } catch (error) {
            // Provide descriptive content for binary files
            extractedContent = `${fileExt.toUpperCase()} File: ${title}\n\n`;
            extractedContent += `This document was uploaded in ${fileExt.toUpperCase()} format.\n\n`;
            extractedContent += `This file type cannot be displayed as text in the document viewer.\n\n`;
            extractedContent += `You can download the original file by clicking the "Native View" tab above.\n\n`;
            extractedContent += `File size: ${(req.file.size / 1024).toFixed(2)} KB`;
          }
        }
      }
      
      // If still empty, use fallback
      if (!extractedContent || extractedContent.trim() === '') {
        extractedContent = `The content for "${title}" could not be extracted. Please use the Native View tab to download and view the original file.`;
      }

      // Generate a simple AI summary based on file type
      let aiSummary = "";
      if (fileExt === 'pdf') {
        aiSummary = "This is a PDF document containing text and potentially images or other elements. Use the Native View tab to view the original PDF formatting.";
      } 
      else if (fileExt === 'docx' || fileExt === 'doc') {
        aiSummary = "This is a Word document containing formatted text and potentially tables or other content. Use the Native View tab to download and open the original file with full formatting.";
      }
      else if (fileExt === 'xlsx' || fileExt === 'xls') {
        aiSummary = "This is a spreadsheet containing data in tabular format across one or more sheets. Use the Native View tab to download and open the file with all formatting and formulas intact.";
      }
      else if (fileExt === 'csv') {
        aiSummary = "This is a CSV file containing comma-separated data, typically used for tabular information and data exchange between applications.";
      }
      else if (fileExt === 'txt') {
        aiSummary = "This is a plain text document without formatting, containing raw textual content.";
      }
      else {
        aiSummary = "This document has been successfully uploaded and is available for review. The file type may require specialized software to view in its native format.";
      }

      // Log the file information
      console.log('File upload information:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      });
      
      // Create document record with proper path handling for PostgreSQL
      const relativePath = '/uploads/' + req.file.filename;
      console.log(`Storing document with relative path: ${relativePath}`);
      
      // Sanitize content to prevent UTF-8 encoding issues
      let sanitizedContent = '';
      
      if (extractedContent) {
        // Remove null bytes and other problematic characters
        sanitizedContent = extractedContent
          .replace(/\x00/g, '') // Remove null bytes
          .replace(/[\uD800-\uDFFF]/g, '') // Remove surrogate pairs
          .replace(/[^\x20-\x7E\x0A\x0D\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, ' '); // Keep only basic latin and common extensions
      }
        
      const doc = await storage.createDocument({
        title,
        content: sanitizedContent,
        filePath: relativePath,  // Store relative path consistently
        fileType: path.extname(req.file.originalname).substring(1),
        fileSize: req.file.size,
        custodian: custodian || null,
        metadata: typeof metadata === 'string' && metadata ? JSON.parse(metadata) : metadata || {},
        isReviewed: false,
        isRedacted: false,
        aiSummary: aiSummary || null,
      });

      try {
        // Auto-tag as Agreement for testing
        const agreementTag = (await storage.getAllTags()).find(tag => tag.name === "Agreement");
        if (agreementTag) {
          console.log(`Auto-tagging document with tag: ${agreementTag.name} (ID: ${agreementTag.id})`);
          await storage.tagDocument({
            documentId: doc.id,
            tagId: agreementTag.id
          });
        } else {
          console.log('No Agreement tag found for auto-tagging');
        }
      } catch (tagError) {
        console.error('Error during auto-tagging:', tagError);
      }

      res.status(201).json(doc);
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Check for encoding errors which are common with PDFs
      if (error.message && error.message.includes('invalid byte sequence for encoding')) {
        return res.status(400).json({ 
          message: "The document contains characters that cannot be processed. Please try converting it to a different format.",
          error: "Encoding error" 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to upload document", 
        error: error.message || "Unknown error"
      });
    }
  });

  app.patch("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const updatedDocument = await storage.updateDocument(id, req.body);
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete the document's file if it exists
      if (document.filePath) {
        const fullPath = path.join(process.cwd(), document.filePath.replace(/^\//, ''));
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      const success = await storage.deleteDocument(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Review Protocol endpoints
  app.get("/api/protocols", async (_req: Request, res: Response) => {
    try {
      const protocols = await storage.getAllProtocols();
      res.json(protocols);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch protocols" });
    }
  });

  app.get("/api/protocols/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid protocol ID" });
      }

      const protocol = await storage.getProtocol(id);
      if (!protocol) {
        return res.status(404).json({ message: "Protocol not found" });
      }

      res.json(protocol);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch protocol" });
    }
  });

  app.post("/api/protocols", upload.single("file"), async (req: Request, res: Response) => {
    try {
      let { name = "" , content = "" } = req.body;

      if (req.file) {
        const filePath = path.join(process.cwd(), 'uploads', req.file.filename);
        content = fs.readFileSync(filePath, 'utf8');
        if (!name) {
          name = req.file.originalname;
        }
      }

      if (!name || !content) {
        return res.status(400).json({ message: "Protocol name and content are required" });
      }

      const protocol = await storage.createProtocol({ name, content });
      res.status(201).json(protocol);
    } catch (error) {
      res.status(500).json({ message: "Failed to create protocol" });
    }
  });

  app.delete("/api/protocols/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid protocol ID" });
      }

      const success = await storage.deleteProtocol(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete protocol" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete protocol" });
    }
  });

  // Tag endpoints
  app.get("/api/tags", async (req: Request, res: Response) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post("/api/tags", validateBody(insertTagSchema), async (req: Request, res: Response) => {
    try {
      const tag = await storage.createTag(req.body);
      res.status(201).json(tag);
    } catch (error) {
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.delete("/api/tags/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }

      const tag = await storage.getTag(id);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }

      const success = await storage.deleteTag(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete tag" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Document Tag endpoints
  app.get("/api/documents/:id/tags", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const tags = await storage.getDocumentTags(id);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document tags" });
    }
  });

  app.post("/api/documents/:documentId/tags/:tagId", async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const tagId = parseInt(req.params.tagId);

      if (isNaN(documentId) || isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid document or tag ID" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const tag = await storage.getTag(tagId);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }

      const documentTag = await storage.tagDocument({ documentId, tagId });
      res.status(201).json(documentTag);
    } catch (error) {
      res.status(500).json({ message: "Failed to tag document" });
    }
  });

  app.delete("/api/documents/:documentId/tags/:tagId", async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const tagId = parseInt(req.params.tagId);

      if (isNaN(documentId) || isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid document or tag ID" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const tag = await storage.getTag(tagId);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }

      const success = await storage.removeDocumentTag(documentId, tagId);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to remove tag from document" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to remove tag from document" });
    }
  });

  // Redaction endpoints
  app.get("/api/documents/:id/redactions", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const redactions = await storage.getDocumentRedactions(id);
      res.json(redactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document redactions" });
    }
  });

  app.post("/api/redactions", validateBody(insertRedactionSchema), async (req: Request, res: Response) => {
    try {
      const documentId = req.body.documentId;
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const redaction = await storage.createRedaction(req.body);
      
      // Update document to mark it as redacted
      await storage.updateDocument(documentId, { isRedacted: true });
      
      res.status(201).json(redaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to create redaction" });
    }
  });

  app.delete("/api/redactions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid redaction ID" });
      }

      const success = await storage.deleteRedaction(id);
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete redaction" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete redaction" });
    }
  });

  // Production Set endpoints
  app.get("/api/production-sets", async (req: Request, res: Response) => {
    try {
      const productionSets = await storage.getAllProductionSets();
      res.json(productionSets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch production sets" });
    }
  });

  app.get("/api/production-sets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid production set ID" });
      }

      const productionSet = await storage.getProductionSet(id);
      if (!productionSet) {
        return res.status(404).json({ message: "Production set not found" });
      }

      res.json(productionSet);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch production set" });
    }
  });

  app.post("/api/production-sets", validateBody(insertProductionSetSchema), async (req: Request, res: Response) => {
    try {
      const productionSet = await storage.createProductionSet(req.body);
      res.status(201).json(productionSet);
    } catch (error) {
      res.status(500).json({ message: "Failed to create production set" });
    }
  });

  app.get("/api/production-sets/:id/documents", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid production set ID" });
      }

      const productionSet = await storage.getProductionSet(id);
      if (!productionSet) {
        return res.status(404).json({ message: "Production set not found" });
      }

      const productionDocuments = await storage.getProductionDocuments(id);
      res.json(productionDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch production documents" });
    }
  });

  app.post("/api/production-documents", validateBody(insertProductionDocumentSchema), async (req: Request, res: Response) => {
    try {
      const { productionSetId, documentId } = req.body;

      // Validate the productionSet and document exist
      const productionSet = await storage.getProductionSet(productionSetId);
      if (!productionSet) {
        return res.status(404).json({ message: "Production set not found" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Generate a bates number (simplified for now)
      const batesPrefix = productionSet.prefix || "PROD";
      const batesNumber = `${batesPrefix}${String(Date.now()).slice(-6)}`;

      const productionDocument = await storage.addDocumentToProductionSet({
        ...req.body,
        batesNumber,
      });

      res.status(201).json(productionDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to add document to production set" });
    }
  });

  // File download endpoint
  // AI Analysis Routes
  app.post("/api/ai/summarize", async (req: Request, res: Response) => {
    await ai.generateSummary(req, res);
  });

  app.post("/api/ai/detect-pii", async (req: Request, res: Response) => {
    await ai.detectPII(req, res);
  });

  app.post("/api/ai/suggest-tags", async (req: Request, res: Response) => {
    await ai.suggestTags(req, res);
  });

  app.post("/api/ai/extract-entities", async (req: Request, res: Response) => {
    await ai.extractEntities(req, res);
  });

  app.post("/api/ai/suggest-coding", async (req: Request, res: Response) => {
    await ai.suggestCoding(req, res);
  });

  app.get("/api/documents/:id/download", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (!document.filePath) {
        return res.status(404).json({ message: "File not found" });
      }

      // Build the correct file path
      const filePath = path.join(process.cwd(), document.filePath.replace(/^\//, ''));
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Set content-type based on file type
      let contentType = "application/octet-stream";
      switch (document.fileType.toLowerCase()) {
        case "pdf":
          contentType = "application/pdf";
          break;
        case "docx":
          contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          break;
        case "doc":
          contentType = "application/msword";
          break;
        case "xlsx":
          contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          break;
        case "xls":
          contentType = "application/vnd.ms-excel";
          break;
        case "txt":
          contentType = "text/plain";
          break;
        case "csv":
          contentType = "text/csv";
          break;
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${document.title}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Setup the server
  const server = createServer(app);
  
  return server;
}