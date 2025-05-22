// Import necessary types
import {
  User, InsertUser,
  Document, InsertDocument,
  Tag, InsertTag,
  DocumentTag, InsertDocumentTag,
  Redaction, InsertRedaction,
  ProductionSet, InsertProductionSet,
  ProductionDocument, InsertProductionDocument,
  ReviewProtocol, InsertReviewProtocol,
} from '@shared/schema';

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Document operations
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Tag operations
  getAllTags(): Promise<Tag[]>;
  getTag(id: number): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  deleteTag(id: number): Promise<boolean>;

  // Document-Tag operations
  getDocumentTags(documentId: number): Promise<Tag[]>;
  tagDocument(documentTag: InsertDocumentTag): Promise<DocumentTag>;
  removeDocumentTag(documentId: number, tagId: number): Promise<boolean>;

  // Redaction operations
  getDocumentRedactions(documentId: number): Promise<Redaction[]>;
  createRedaction(redaction: InsertRedaction): Promise<Redaction>;
  deleteRedaction(id: number): Promise<boolean>;

  // Production Set operations
  getAllProductionSets(): Promise<ProductionSet[]>;
  getProductionSet(id: number): Promise<ProductionSet | undefined>;
  createProductionSet(productionSet: InsertProductionSet): Promise<ProductionSet>;
  
  // Production Document operations
  getProductionDocuments(productionSetId: number): Promise<{ document: Document, batesNumber: string }[]>;
  addDocumentToProductionSet(productionDocument: InsertProductionDocument): Promise<ProductionDocument>;

  // Review Protocol operations
  getAllProtocols(): Promise<ReviewProtocol[]>;
  getProtocol(id: number): Promise<ReviewProtocol | undefined>;
  createProtocol(protocol: InsertReviewProtocol): Promise<ReviewProtocol>;
  deleteProtocol(id: number): Promise<boolean>;
}

// Import our DatabaseStorage implementation
import { DatabaseStorage } from './database-storage';

// Export a single instance of the database storage
export const storage = new DatabaseStorage();