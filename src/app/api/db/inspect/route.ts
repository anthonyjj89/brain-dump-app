import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    
    // Get data from both collections
    const bugsCollection = await db.collection('bugs').find({}).toArray();
    const brainDumpCollection = await db.collection('Brain Dump Collection').find({}).toArray();
    
    // Filter Brain Dump Collection to only show bug-related documents
    const bugRelatedDocs = brainDumpCollection.filter(doc => 
      doc.type === 'bug' || doc.type === 'feature'
    );

    return NextResponse.json({
      status: 'success',
      data: {
        bugs: {
          collection: 'bugs',
          count: bugsCollection.length,
          documents: bugsCollection
        },
        brainDump: {
          collection: 'Brain Dump Collection',
          totalCount: brainDumpCollection.length,
          bugRelatedCount: bugRelatedDocs.length,
          bugRelatedDocuments: bugRelatedDocs
        }
      }
    });
  } catch (error) {
    console.error('Error inspecting collections:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to inspect collections'
    }, { status: 500 });
  }
}
