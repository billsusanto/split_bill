import { NextResponse } from 'next/server';
import { getDb } from '@/db';

export async function GET() {
  try {
    // Test connecting to the database
    const db = getDb();
    
    // Run a simple query to verify connection
    const result = await db.execute('SELECT NOW() as time');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      time: result.rows[0]?.time,
      env: {
        databaseUrl: process.env.DATABASE_URL ? `Set (${process.env.DATABASE_URL.substring(0, 30)}...)` : 'Not set',
        nodeEnv: process.env.NODE_ENV,
      },
      dbDetails: {
        provider: 'neon',
        hasConnection: !!db,
      }
    });
  } catch (error: Error | unknown) {
    console.error('Database connection error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: errorMessage,
      env: {
        databaseUrl: process.env.DATABASE_URL ? `Set (${process.env.DATABASE_URL.substring(0, 30)}...)` : 'Not set',
        nodeEnv: process.env.NODE_ENV,
      },
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
} 