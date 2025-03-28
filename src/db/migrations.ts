// Load environment variables from .env files
import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as schema from "./schema/schema";
import fs from 'fs';
import path from 'path';

// This script can be used to create the database tables
// Run it with: npm run migrate

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set. Please set it and try again.");
    process.exit(1);
  }

  console.log("Starting database migration...");
  console.log("Using DATABASE_URL:", process.env.DATABASE_URL.substring(0, 30) + "...");
  
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });
  
  try {
    // Use Drizzle ORM's migrate function to create tables
    // For production, you'd want to use proper migrations rather than this approach
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

async function runMigrations() {
  console.log('Starting migrations...');
  
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set. Please set it and try again.");
    return;
  }
  
  // Create neon client
  const sql = neon(process.env.DATABASE_URL as string);

  // Get all migration files
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure migrations run in order
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  for (const file of migrationFiles) {
    try {
      console.log(`Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const migration = fs.readFileSync(filePath, 'utf8');
      
      // Execute the migration
      await sql.query(migration);
      
      console.log(`Successfully ran migration: ${file}`);
    } catch (error) {
      console.error(`Failed to run migration ${file}:`, error);
      process.exit(1);
    }
  }
  
  console.log('Migrations completed successfully');
}

runMigration();
runMigrations().catch(error => {
  console.error('Migration error:', error);
  process.exit(1);
}); 