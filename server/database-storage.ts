import { db } from './db';
import { 
  User, InsertUser, users,
  Document, InsertDocument, documents,
  Tag, InsertTag, tags,
  DocumentTag, InsertDocumentTag, documentTags,
  Redaction, InsertRedaction, redactions,
  ProductionSet, InsertProductionSet, productionSets,
  ProductionDocument, InsertProductionDocument, productionDocuments,
  ReviewProtocol, InsertReviewProtocol, reviewProtocols
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { IStorage } from './storage';

/**
 * PostgreSQL Database Storage implementation
 * Handles all database operations through Drizzle ORM
 */
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Document operations
  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.uploadedAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async updateDocument(id: number, partialDocument: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(partialDocument)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    // Delete related document tags and redactions first (cascade delete)
    await db.delete(documentTags).where(eq(documentTags.documentId, id));
    await db.delete(redactions).where(eq(redactions.documentId, id));
    
    // Then delete the document
    const [deleted] = await db.delete(documents).where(eq(documents.id, id)).returning();
    return !!deleted;
  }

  // Tag operations
  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getTag(id: number): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values(insertTag).returning();
    return tag;
  }

  async deleteTag(id: number): Promise<boolean> {
    // Delete related document tags first
    await db.delete(documentTags).where(eq(documentTags.tagId, id));
    
    // Then delete the tag
    const [deleted] = await db.delete(tags).where(eq(tags.id, id)).returning();
    return !!deleted;
  }

  // Document-Tag operations
  async getDocumentTags(documentId: number): Promise<Tag[]> {
    const result = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color
      })
      .from(documentTags)
      .innerJoin(tags, eq(documentTags.tagId, tags.id))
      .where(eq(documentTags.documentId, documentId));
    
    return result;
  }

  async tagDocument(insertDocumentTag: InsertDocumentTag): Promise<DocumentTag> {
    const [documentTag] = await db
      .insert(documentTags)
      .values(insertDocumentTag)
      .returning();
    return documentTag;
  }

  async removeDocumentTag(documentId: number, tagId: number): Promise<boolean> {
    const [deleted] = await db
      .delete(documentTags)
      .where(
        and(
          eq(documentTags.documentId, documentId),
          eq(documentTags.tagId, tagId)
        )
      )
      .returning();
    return !!deleted;
  }

  // Redaction operations
  async getDocumentRedactions(documentId: number): Promise<Redaction[]> {
    return await db
      .select()
      .from(redactions)
      .where(eq(redactions.documentId, documentId));
  }

  async createRedaction(insertRedaction: InsertRedaction): Promise<Redaction> {
    const [redaction] = await db
      .insert(redactions)
      .values(insertRedaction)
      .returning();
    return redaction;
  }

  async deleteRedaction(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(redactions)
      .where(eq(redactions.id, id))
      .returning();
    return !!deleted;
  }

  // Production Set operations
  async getAllProductionSets(): Promise<ProductionSet[]> {
    return await db.select().from(productionSets);
  }

  async getProductionSet(id: number): Promise<ProductionSet | undefined> {
    const [productionSet] = await db
      .select()
      .from(productionSets)
      .where(eq(productionSets.id, id));
    return productionSet || undefined;
  }

  async createProductionSet(insertProductionSet: InsertProductionSet): Promise<ProductionSet> {
    const [productionSet] = await db
      .insert(productionSets)
      .values(insertProductionSet)
      .returning();
    return productionSet;
  }

  // Production Document operations
  async getProductionDocuments(productionSetId: number): Promise<{ document: Document, batesNumber: string }[]> {
    const results = await db
      .select({
        document: documents,
        batesNumber: productionDocuments.batesNumber
      })
      .from(productionDocuments)
      .innerJoin(documents, eq(productionDocuments.documentId, documents.id))
      .where(eq(productionDocuments.productionSetId, productionSetId));
    
    return results;
  }

  async addDocumentToProductionSet(insertProductionDocument: InsertProductionDocument): Promise<ProductionDocument> {
    const [productionDocument] = await db
      .insert(productionDocuments)
      .values(insertProductionDocument)
      .returning();
    return productionDocument;
  }

  // Review Protocol operations
  async getAllProtocols(): Promise<ReviewProtocol[]> {
    return await db.select().from(reviewProtocols).orderBy(desc(reviewProtocols.uploadedAt));
  }

  async getProtocol(id: number): Promise<ReviewProtocol | undefined> {
    const [protocol] = await db.select().from(reviewProtocols).where(eq(reviewProtocols.id, id));
    return protocol || undefined;
  }

  async createProtocol(insertProtocol: InsertReviewProtocol): Promise<ReviewProtocol> {
    const [protocol] = await db.insert(reviewProtocols).values(insertProtocol).returning();
    return protocol;
  }

  async deleteProtocol(id: number): Promise<boolean> {
    const [deleted] = await db.delete(reviewProtocols).where(eq(reviewProtocols.id, id)).returning();
    return !!deleted;
  }
}