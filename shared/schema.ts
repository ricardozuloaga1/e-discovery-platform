import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table (minimal for MVP)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  batesNumber: text("bates_number"),
  custodian: text("custodian"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
  isReviewed: boolean("is_reviewed").default(false),
  isRedacted: boolean("is_redacted").default(false),
  ocr: text("ocr"),
  aiSummary: text("ai_summary"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Tags table for categorizing documents
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

// DocumentTags table for many-to-many relationship
export const documentTags = pgTable("document_tags", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  tagId: integer("tag_id").notNull(),
});

export const insertDocumentTagSchema = createInsertSchema(documentTags).omit({
  id: true,
});

export type InsertDocumentTag = z.infer<typeof insertDocumentTagSchema>;
export type DocumentTag = typeof documentTags.$inferSelect;

// Redactions table
export const redactions = pgTable("redactions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  text: text("text").notNull(),
  reason: text("reason"),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  pageNumber: integer("page_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRedactionSchema = createInsertSchema(redactions).omit({
  id: true,
  createdAt: true,
});

export type InsertRedaction = z.infer<typeof insertRedactionSchema>;
export type Redaction = typeof redactions.$inferSelect;

// ProductionSets table
export const productionSets = pgTable("production_sets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  prefix: text("prefix"),
  startNumber: integer("start_number"),
  format: text("format").notNull(),
  includeText: boolean("include_text").default(true),
  includeImages: boolean("include_images").default(true),
  includeMetadata: boolean("include_metadata").default(true),
  includeNative: boolean("include_native").default(false),
  loadFileFormat: text("load_file_format").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductionSetSchema = createInsertSchema(productionSets).omit({
  id: true,
  createdAt: true,
});

export type InsertProductionSet = z.infer<typeof insertProductionSetSchema>;
export type ProductionSet = typeof productionSets.$inferSelect;

// ProductionDocuments table for tracking documents in a production set
export const productionDocuments = pgTable("production_documents", {
  id: serial("id").primaryKey(),
  productionSetId: integer("production_set_id").notNull(),
  documentId: integer("document_id").notNull(),
  batesNumber: text("bates_number").notNull(),
});

export const insertProductionDocumentSchema = createInsertSchema(productionDocuments).omit({
  id: true,
});

export type InsertProductionDocument = z.infer<typeof insertProductionDocumentSchema>;
export type ProductionDocument = typeof productionDocuments.$inferSelect;

// Define table relationships
export const documentsRelations = relations(documents, ({ many }) => ({
  documentTags: many(documentTags),
  redactions: many(redactions),
  productionDocuments: many(productionDocuments)
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  documentTags: many(documentTags)
}));

export const documentTagsRelations = relations(documentTags, ({ one }) => ({
  document: one(documents, {
    fields: [documentTags.documentId],
    references: [documents.id]
  }),
  tag: one(tags, {
    fields: [documentTags.tagId],
    references: [tags.id]
  })
}));

export const redactionsRelations = relations(redactions, ({ one }) => ({
  document: one(documents, {
    fields: [redactions.documentId],
    references: [documents.id]
  })
}));

export const productionSetsRelations = relations(productionSets, ({ many }) => ({
  productionDocuments: many(productionDocuments)
}));

export const productionDocumentsRelations = relations(productionDocuments, ({ one }) => ({
  productionSet: one(productionSets, {
    fields: [productionDocuments.productionSetId],
    references: [productionSets.id]
  }),
  document: one(documents, {
    fields: [productionDocuments.documentId],
    references: [documents.id]
  })
}));
