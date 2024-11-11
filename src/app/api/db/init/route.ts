import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('brain-dump');

    // Drop existing collection if it exists
    try {
      await db.collection('bugs').drop();
    } catch (error) {
      // Ignore error if collection doesn't exist
      console.log('Collection does not exist yet');
    }

    // Create bugs collection with schema validation
    await db.createCollection('bugs', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['id', 'title', 'status', 'priority', 'reportedBy', 'steps', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            title: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            status: {
              enum: ['Open', 'Closed'],
              description: 'can only be one of the enum values and is required'
            },
            priority: {
              enum: ['Low', 'Medium', 'High'],
              description: 'can only be one of the enum values and is required'
            },
            reportedBy: {
              bsonType: 'string',
              description: 'must be a string and is required'
            },
            steps: {
              bsonType: 'array',
              description: 'must be an array and is required',
              items: {
                bsonType: 'string'
              }
            },
            createdAt: {
              bsonType: 'date',
              description: 'must be a date and is required'
            },
            updatedAt: {
              bsonType: 'date',
              description: 'must be a date and is required'
            },
            resolvedBy: {
              bsonType: 'string',
              description: 'must be a string if present'
            },
            notes: {
              bsonType: 'string',
              description: 'must be a string if present'
            },
            screenshot: {
              bsonType: 'object',
              description: 'must be an object if present',
              properties: {
                path: {
                  bsonType: 'string',
                  description: 'must be a string'
                },
                timestamp: {
                  bsonType: 'date',
                  description: 'must be a date'
                }
              },
              required: ['path', 'timestamp']
            }
          }
        }
      }
    });

    // Create indexes
    await db.collection('bugs').createIndex({ id: 1 }, { unique: true });
    await db.collection('bugs').createIndex({ status: 1 });
    await db.collection('bugs').createIndex({ priority: 1 });
    await db.collection('bugs').createIndex({ createdAt: 1 });

    // Create screenshots directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to initialize database'
    }, { status: 500 });
  }
}
