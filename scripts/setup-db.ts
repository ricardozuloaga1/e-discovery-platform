import { db } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Setting up the PostgreSQL database...');
  
  try {
    console.log('Creating database tables...');
    
    // Create all tables in the correct order with foreign key relationships
    await db.execute(sql`
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );

      -- Create documents table
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        bates_number TEXT,
        custodian TEXT,
        uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL,
        metadata JSONB,
        is_reviewed BOOLEAN DEFAULT FALSE,
        is_redacted BOOLEAN DEFAULT FALSE,
        ocr TEXT,
        ai_summary TEXT
      );

      -- Create tags table
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL
      );

      -- Create document_tags table
      CREATE TABLE IF NOT EXISTS document_tags (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(document_id, tag_id)
      );

      -- Create redactions table
      CREATE TABLE IF NOT EXISTS redactions (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        reason TEXT,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        page_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create production_sets table
      CREATE TABLE IF NOT EXISTS production_sets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        prefix TEXT,
        start_number INTEGER,
        format TEXT NOT NULL,
        include_text BOOLEAN DEFAULT TRUE,
        include_images BOOLEAN DEFAULT TRUE,
        include_metadata BOOLEAN DEFAULT TRUE,
        include_native BOOLEAN DEFAULT FALSE,
        load_file_format TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create production_documents table
      CREATE TABLE IF NOT EXISTS production_documents (
        id SERIAL PRIMARY KEY,
        production_set_id INTEGER NOT NULL REFERENCES production_sets(id) ON DELETE CASCADE,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        bates_number TEXT NOT NULL,
        UNIQUE(production_set_id, document_id)
      );
    `);

    console.log('Database tables created successfully!');

    // Create some initial sample data
    console.log('Adding sample data...');

    // Create default tags
    await db.insert(schema.tags).values([
      { name: 'Agreement', color: '#2563eb' },
      { name: 'Contract', color: '#16a34a' },
      { name: 'Legal', color: '#dc2626' },
      { name: 'Financial', color: '#f59e0b' },
      { name: 'Confidential', color: '#7c3aed' }
    ]).onConflictDoNothing();

    console.log('Sample data added successfully!');
    console.log('Database setup complete!');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();