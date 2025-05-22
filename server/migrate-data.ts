import { db } from './db';
import * as schema from '@shared/schema';
import fs from 'fs';
import path from 'path';

/**
 * This script migrates existing documents from the in-memory storage to PostgreSQL
 */
async function migrateDocuments() {
  console.log('Migrating existing documents to PostgreSQL database...');

  // Get the list of files in the uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  try {
    if (!fs.existsSync(uploadsDir)) {
      console.log('No uploads directory found, skipping document migration');
      return;
    }

    const files = fs.readdirSync(uploadsDir);
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        // Get file details
        const fileName = path.basename(file);
        const fileExt = path.extname(file).substring(1).toLowerCase();
        const fileSize = stats.size;
        
        // Check if this document already exists in the database to avoid duplicates
        const existingDoc = await db.query.documents.findFirst({
          where: (documents, { eq }) => eq(documents.filePath, filePath)
        });
        
        if (!existingDoc) {
          // Create a new document entry in the database
          await db.insert(schema.documents).values({
            title: fileName,
            content: `Content from ${fileName}`,
            filePath: filePath,
            fileType: fileExt,
            fileSize: fileSize,
            uploadedAt: new Date()
          });
          console.log(`Migrated document: ${fileName}`);
        } else {
          console.log(`Document already exists: ${fileName}`);
        }
      }
    }
    
    console.log('Document migration complete!');
  } catch (error) {
    console.error('Error migrating documents:', error);
  }
}

// Export the migration function
export { migrateDocuments };