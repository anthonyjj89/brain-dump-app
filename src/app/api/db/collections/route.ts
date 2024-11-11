import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({
      status: 'success',
      collections: collections.map(col => col.name)
    });
  } catch (error) {
    console.error('Error listing collections:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to list collections'
    }, { status: 500 });
  }
}
