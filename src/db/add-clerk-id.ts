import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

async function addClerkIdColumn() {
  try {
    console.log("Connecting to database...");
    const sql = neon(connectionString as string);
    
    console.log("Adding clerk_id column to users table...");
    
    // Add clerk_id column if it doesn't exist
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT`;
    
    console.log("Successfully added clerk_id column!");
    
    // Add a unique index to prevent duplicates
    console.log("Adding unique index on clerk_id...");
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_id_idx ON users(clerk_id) WHERE clerk_id IS NOT NULL`;
    
    console.log("✅ Successfully added clerk_id column and index!");
  } catch (error) {
    console.error("Error adding clerk_id column:", error);
  }
}

// Run the function
addClerkIdColumn(); 