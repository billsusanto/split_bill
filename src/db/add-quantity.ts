import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

// Create a SQL client with Neon
const sql = neon(connectionString);

async function addQuantityToBillItems() {
  try {
    console.log('Running migration to add quantity column to bill_items table...');
    
    // Instead of reading from file, define the SQL directly
    const migrationSQL = "ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;";
    
    // Execute the migration with raw SQL
    await sql.query(migrationSQL);
    
    console.log('Migration successful! The quantity column has been added to the bill_items table.');
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

addQuantityToBillItems().catch(console.error); 