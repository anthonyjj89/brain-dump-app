import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST() {
  try {
    const db = await getDb();
    console.log('Starting database restructuring...');

    // Step 1: Create new collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    // Create collections if they don't exist
    if (!collectionNames.includes('bugs')) {
      await db.createCollection('bugs');
      console.log('Created bugs collection');
    }
    if (!collectionNames.includes('features')) {
      await db.createCollection('features');
      console.log('Created features collection');
    }
    if (!collectionNames.includes('thoughts')) {
      await db.createCollection('thoughts');
      console.log('Created thoughts collection');
    }

    // Step 2: Move bug-related data from Brain Dump Collection
    if (collectionNames.includes('Brain Dump Collection')) {
      const brainDumpColl = db.collection('Brain Dump Collection');
      const bugDocs = await brainDumpColl.find({ type: 'bug' }).toArray();
      const featureDocs = await brainDumpColl.find({ type: 'feature' }).toArray();
      const thoughtDocs = await brainDumpColl.find({ 
        type: { $nin: ['bug', 'feature'] } 
      }).toArray();

      // Move bugs
      if (bugDocs.length > 0) {
        await db.collection('bugs').insertMany(bugDocs);
        await brainDumpColl.deleteMany({ type: 'bug' });
        console.log(`Moved ${bugDocs.length} bug documents`);
      }

      // Move features
      if (featureDocs.length > 0) {
        await db.collection('features').insertMany(featureDocs);
        await brainDumpColl.deleteMany({ type: 'feature' });
        console.log(`Moved ${featureDocs.length} feature documents`);
      }

      // Move thoughts
      if (thoughtDocs.length > 0) {
        await db.collection('thoughts').insertMany(thoughtDocs);
        await brainDumpColl.deleteMany({ 
          type: { $nin: ['bug', 'feature'] } 
        });
        console.log(`Moved ${thoughtDocs.length} thought documents`);
      }

      // Drop the old collection if it's empty
      const remainingDocs = await brainDumpColl.countDocuments();
      if (remainingDocs === 0) {
        await db.dropCollection('Brain Dump Collection');
        console.log('Dropped Brain Dump Collection');
      }
    }

    // Step 3: Remove test collection if it exists
    if (collectionNames.includes('test')) {
      await db.dropCollection('test');
      console.log('Dropped test collection');
    }

    // Step 4: Create indexes for better performance
    await db.collection('bugs').createIndex({ id: 1 }, { unique: true });
    await db.collection('bugs').createIndex({ status: 1, priority: -1 });
    
    await db.collection('features').createIndex({ id: 1 }, { unique: true });
    await db.collection('features').createIndex({ status: 1, priority: -1 });
    
    await db.collection('thoughts').createIndex({ createdAt: -1 });
    
    console.log('Created indexes on collections');

    // Final verification
    const finalCollections = await db.listCollections().toArray();
    const finalStats = {
      bugs: await db.collection('bugs').countDocuments(),
      features: await db.collection('features').countDocuments(),
      thoughts: await db.collection('thoughts').countDocuments()
    };

    return NextResponse.json({
      status: 'success',
      message: 'Database restructured successfully',
      collections: finalCollections.map(col => col.name),
      stats: finalStats
    });
  } catch (error) {
    console.error('Error restructuring database:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to restructure database'
    }, { status: 500 });
  }
}
