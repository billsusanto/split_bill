import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    console.log("Testing direct database connection");
    
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error("DATABASE_URL is not defined");
      return NextResponse.json({ 
        success: false, 
        error: "DATABASE_URL is not defined" 
      }, { status: 500 });
    }
    
    // Create a connection pool
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Test a simple query
    const result = await pool.query('SELECT 1 as test');
    await pool.end();
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      testQuery: result.rows
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 