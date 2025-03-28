import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(request: Request) {
  try {
    console.log("Testing user creation");
    
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error("DATABASE_URL is not defined");
      return NextResponse.json({ 
        success: false, 
        error: "DATABASE_URL is not defined" 
      }, { status: 500 });
    }
    
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || 'Test User';
    
    // Create a connection pool
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // First check if the user exists
    const checkResult = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
    
    let user;
    
    if (checkResult.rows.length > 0) {
      user = checkResult.rows[0];
      console.log("User already exists:", user);
    } else {
      // Create a new user
      const insertResult = await pool.query(
        'INSERT INTO users (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING *', 
        [name]
      );
      user = insertResult.rows[0];
      console.log("Created new user:", user);
    }
    
    await pool.end();
    
    return NextResponse.json({ 
      success: true, 
      message: "User operation successful",
      user
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 