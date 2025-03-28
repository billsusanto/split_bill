import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    databaseUrlAvailable: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  });
} 