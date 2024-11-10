import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

type SyncService = 'ticktick' | 'google_calendar' | 'notion';
type ThoughtType = 'task' | 'event' | 'note';

interface ServiceConfig {
  type: ThoughtType;
  handler: (data: any) => Promise<any>;
}

const serviceConfigs: Record<SyncService, ServiceConfig> = {
  ticktick: {
    type: 'task',
    handler: async (data) => {
      // TODO: Implement TickTick API integration
      if (!process.env.TICKTICK_API_KEY) {
        throw new Error('TickTick API key not configured');
      }
      return { success: true, externalId: `tt-${Date.now()}` };
    }
  },
  google_calendar: {
    type: 'event',
    handler: async (data) => {
      // TODO: Implement Google Calendar API integration
      if (!process.env.GOOGLE_CALENDAR_CLIENT_ID) {
        throw new Error('Google Calendar API not configured');
      }
      return { success: true, externalId: `gc-${Date.now()}` };
    }
  },
  notion: {
    type: 'note',
    handler: async (data) => {
      // TODO: Implement Notion API integration
      if (!process.env.NOTION_API_KEY) {
        throw new Error('Notion API key not configured');
      }
      return { success: true, externalId: `nt-${Date.now()}` };
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') as SyncService;
    const { thoughtIds } = await request.json();

    if (!service || !thoughtIds || !Array.isArray(thoughtIds)) {
      return NextResponse.json(
        { error: 'Service and thought IDs array are required' },
        { status: 400 }
      );
    }

    if (!serviceConfigs[service]) {
      return NextResponse.json(
        { error: 'Invalid service' },
        { status: 400 }
      );
    }

    const thoughts = await getCollection('thoughts');

    // Get approved thoughts
    const thoughtsToSync = await thoughts
      .find({
        _id: { $in: thoughtIds.map(id => new ObjectId(id)) },
        status: 'approved',
        thoughtType: serviceConfigs[service].type
      })
      .toArray();

    // Sync each thought
    const results = await Promise.all(
      thoughtsToSync.map(async (thought) => {
        try {
          const result = await serviceConfigs[service].handler(thought);
          
          // Update sync status and external reference
          await thoughts.updateOne(
            { _id: thought._id },
            {
              $set: {
                [`syncStatus.${service}`]: 'synced',
                [`externalRefs.${service}`]: result.externalId,
                updatedAt: new Date()
              }
            }
          );

          return {
            id: thought._id,
            status: 'success',
            externalId: result.externalId
          };
        } catch (err) {
          const error = err as Error;
          // Update sync status with error
          await thoughts.updateOne(
            { _id: thought._id },
            {
              $set: {
                [`syncStatus.${service}`]: 'failed',
                [`syncErrors.${service}`]: error.message || 'Unknown error occurred',
                updatedAt: new Date()
              }
            }
          );

          return {
            id: thought._id,
            status: 'error',
            error: error.message || 'Unknown error occurred'
          };
        }
      })
    );

    return NextResponse.json({
      status: 'success',
      data: results
    });
  } catch (error) {
    console.error('Error in sync API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') as SyncService;
    const status = searchParams.get('status') || 'pending';

    if (!service) {
      return NextResponse.json(
        { error: 'Service is required' },
        { status: 400 }
      );
    }

    const thoughts = await getCollection('thoughts');

    const query = {
      status: 'approved',
      thoughtType: serviceConfigs[service].type,
      [`syncStatus.${service}`]: status
    };

    const pendingSync = await thoughts
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      status: 'success',
      data: pendingSync
    });
  } catch (error) {
    console.error('Error in sync API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
