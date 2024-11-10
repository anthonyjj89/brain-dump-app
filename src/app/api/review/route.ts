import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '10');

    const thoughts = await getCollection('thoughts');

    const cards = await thoughts
      .find({
        status,
        thoughtType: { $ne: null } // Only show processed thoughts
      })
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      status: 'success',
      data: cards
    });
  } catch (error) {
    console.error('Error in review API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const { id } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: 'ID and action are required' },
        { status: 400 }
      );
    }

    const thoughts = await getCollection('thoughts');

    let update = {};
    switch (action) {
      case 'approve':
        update = {
          $set: {
            status: 'approved',
            updatedAt: new Date()
          }
        };
        break;
      case 'reject':
        update = {
          $set: {
            status: 'rejected',
            updatedAt: new Date()
          }
        };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const result = await thoughts.updateOne(
      { _id: new ObjectId(id) },
      update
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // If approved, check if we need to trigger sync
    if (action === 'approve') {
      const thought = await thoughts.findOne({ _id: new ObjectId(id) });
      if (thought?.thoughtType) {
        // TODO: Trigger sync based on thought type
        // This will be implemented in the sync route
      }
    }

    return NextResponse.json({
      status: 'success',
      message: `Card ${action}ed successfully`
    });
  } catch (error) {
    console.error('Error in review API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const thoughts = await getCollection('thoughts');

    const result = await thoughts.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Error in review API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
