import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkConnection } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Test MongoDB connection
    const isConnected = await checkConnection();
    console.log('MongoDB connection status:', isConnected);

    // Test OpenRouter API
    const aiStatus = process.env.OPENROUTER_API_KEY ? 'configured' : 'not configured';

    // Check external services configuration
    const externalServices = {
      ticktick: process.env.TICKTICK_API_KEY ? 'configured' : 'not configured',
      googleCalendar: process.env.GOOGLE_CALENDAR_CLIENT_ID ? 'configured' : 'not configured',
      notion: process.env.NOTION_API_KEY ? 'configured' : 'not configured'
    };

    return NextResponse.json({
      status: 'success',
      data: {
        database: {
          connected: isConnected,
          name: 'MongoDB Atlas',
          version: '7.0.15',
          region: 'AWS Frankfurt',
          uri: process.env.MONGODB_URI?.split('@')[1]?.split('?')[0] || 'URI not available'
        },
        ai: {
          service: 'OpenRouter',
          status: aiStatus,
          model: 'claude-3-haiku'
        },
        externalServices,
        lastChecked: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json({
      status: 'error',
      data: {
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          uri: process.env.MONGODB_URI?.split('@')[1]?.split('?')[0] || 'URI not available'
        },
        ai: {
          service: 'OpenRouter',
          status: 'error'
        },
        externalServices: {
          ticktick: 'error',
          googleCalendar: 'error',
          notion: 'error'
        },
        lastChecked: new Date().toISOString()
      }
    });
  }
}
