import { NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";
// Removing unused imports
// import { drizzle } from "drizzle-orm/neon-http";
// import * as schema from "@/db/schema/schema";

// This is a server component that will run on the server
export async function GET() {
  try {
    // Log that we're checking database connection
    console.log("Checking database connection from API route");
    
    // Get the database URL from environment variables
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error("DATABASE_URL is not defined");
      return NextResponse.json({ 
        success: false, 
        error: "DATABASE_URL is not defined" 
      }, { status: 500 });
    }
    
    // Test the connection
    const sql = neon(connectionString);
    
    // Try a simple query
    const result = await sql`SELECT 1 as test`;
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      testQuery: result
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 