import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/schema";

// Create a connection string to your Neon database using environment variables
// In production, you should use environment variables for security
// For local development, you can add a .env.local file with these variables
const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error("DATABASE_URL is not defined in the environment variables");
}

// Create a SQL client with Neon
const sql = neon(connectionString);

// Initialize Drizzle with the SQL client and schema
const db = drizzle(sql, { schema });

// Helper function to check if db is initialized
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Please provide a DATABASE_URL environment variable.");
  }
  return db;
} 