import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

async function runMigrations() {
  console.log('Starting SQL migrations...');
  
  // Create neon client - connectionString is definitely not undefined at this point
  const sql = neon(connectionString as string);

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
      
      // Execute the migration using raw SQL
      await sql.query(migration);
      
      console.log(`Successfully ran migration: ${file}`);
    } catch (error) {
      console.error(`Failed to run migration ${file}:`, error);
      process.exit(1);
    }
  }
  
  console.log('Migrations completed successfully');
}

runMigrations().catch(error => {
  console.error('Migration error:', error);
  process.exit(1);
}); 