import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Verify cron secret to ensure only authorized calls
function isAuthorizedCron(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not set');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is an authorized cron job
    if (!isAuthorizedCron(request)) {
      return NextResponse.json({
        status: 'error',
        message: 'Unauthorized'
      }, { status: 401 });
    }

    console.log('Starting scheduled sync...');

    // Sync bugs
    const bugsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sync/bugs?type=bug`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!bugsResponse.ok) {
      throw new Error('Failed to sync bugs');
    }

    // Sync features
    const featuresResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sync/bugs?type=feature`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!featuresResponse.ok) {
      throw new Error('Failed to sync features');
    }

    console.log('Scheduled sync completed successfully');

    return NextResponse.json({
      status: 'success',
      message: 'Sync completed successfully'
    });
  } catch (error) {
    console.error('Error in scheduled sync:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to sync'
    }, { status: 500 });
  }
}
