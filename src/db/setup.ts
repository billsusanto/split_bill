// Load environment variables from .env files
import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set. Please set it and try again.");
    process.exit(1);
  }

  console.log("Starting database setup...");
  console.log("Using DATABASE_URL:", process.env.DATABASE_URL.substring(0, 30) + "...");
  
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Read the SQL migration file
    const migrationFilePath = path.join(__dirname, 'migrations', '0000_initial.sql');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Execute the SQL
    console.log("Executing SQL migration...");
    await pool.query(migrationSQL);
    
    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase(); 