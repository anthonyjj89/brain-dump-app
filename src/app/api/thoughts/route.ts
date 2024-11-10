import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { categorizeThought } from '@/utils/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, type = 'text', rawAudio = null } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Process thought with AI
    const aiResult = await categorizeThought(content);

    const thoughts = await getCollection('thoughts');

    const thought = {
      content,
      inputType: type,
      rawAudio,
      thoughtType: aiResult.thoughtType,
      processedContent: aiResult.processedContent,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: {},
      metadata: {}
    };

    const result = await thoughts.insertOne(thought);

    return NextResponse.json({
      status: 'success',
      message: 'Thought captured and categorized successfully',
      data: {
        id: result.insertedId,
        ...thought
      }
    });
  } catch (error) {
    console.error('Error in thoughts API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '10');

    const thoughts = await getCollection('thoughts');

    const result = await thoughts
      .find({ status })
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in thoughts API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json();

    if (!id || !updates) {
      return NextResponse.json(
        { error: 'ID and updates are required' },
        { status: 400 }
      );
    }

    const thoughts = await getCollection('thoughts');

    const result = await thoughts.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Thought not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Thought updated successfully'
    });
  } catch (error) {
    console.error('Error in thoughts API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
