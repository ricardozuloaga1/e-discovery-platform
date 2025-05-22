/**
 * This script adds an "Unreviewed" tag to the database for auto-tagging new documents
 */
import { db } from './db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log('Adding Unreviewed tag to the database...');
    
    // First check if the tag already exists
    const existingTags = await db.select().from(schema.tags).where(eq(schema.tags.name, 'Unreviewed'));
    
    if (existingTags.length === 0) {
      // Tag doesn't exist, create it
      await db.insert(schema.tags).values({
        name: 'Unreviewed',
        color: '#9ca3af' // Gray color
      });
      
      console.log('Unreviewed tag created successfully');
    } else {
      console.log('Unreviewed tag already exists');
    }
    
    // Output all tags
    const allTags = await db.select().from(schema.tags);
    console.log('All tags in database:', allTags);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

main();