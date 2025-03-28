import { neon } from "@neondatabase/serverless";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

async function addBillTypeColumn() {
  try {
    console.log("Connecting to database...");
    const sql = neon(connectionString as string);
    
    console.log("Adding bill_type column to bills table...");
    
    // Add bill_type column with default value 'items'
    await sql`ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_type VARCHAR(255) NOT NULL DEFAULT 'items'`;
    
    console.log("Successfully added bill_type column!");
    
    // Verify the column was added
    const result = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'bills' AND column_name = 'bill_type'
    `;
    
    if (result.length > 0) {
      console.log("Verified: bill_type column exists in bills table");
    } else {
      console.error("Failed to add column or verify its existence");
    }
    
  } catch (error) {
    console.error("Error adding bill_type column:", error);
  }
}

// Run the function
addBillTypeColumn(); 