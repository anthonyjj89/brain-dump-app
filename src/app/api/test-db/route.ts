import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import clientPromise, { checkConnection, getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');

    // Test 1: Basic Connection
    console.log('Test 1: Basic Connection');
    const client = await clientPromise;
    console.log('Client connection successful');

    // Test 2: Ping
    console.log('Test 2: Ping');
    const isConnected = await checkConnection();
    console.log('Ping result:', isConnected);

    // Test 3: List Databases
    console.log('Test 3: List Databases');
    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();
    console.log('Available databases:', dbList.databases.map(db => db.name));

    // Test 4: Access brain-dump database
    console.log('Test 4: Access brain-dump database');
    const db = await getDb();
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(col => col.name));

    // Test 5: Create test collection if it doesn't exist
    console.log('Test 5: Create test collection');
    const testCollection = db.collection('test');
    const testDoc = await testCollection.insertOne({
      test: true,
      createdAt: new Date()
    });
    console.log('Test document inserted:', testDoc.insertedId);

    return NextResponse.json({
      status: 'success',
      message: 'All database tests passed',
      data: {
        isConnected,
        databases: dbList.databases.map(db => db.name),
        collections: collections.map(col => col.name),
        testDocId: testDoc.insertedId
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    }, { status: 500 });
  }
}
