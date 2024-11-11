import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// Cache for storing the last successful metrics
let metricsCache = {
  pingTimeMs: 0,
  dataTransferred: 0,
  lastUpdated: 0
};

// Cache TTL in milliseconds (5 seconds)
const CACHE_TTL = 5000;

// Timeout duration in milliseconds (5 seconds)
const TIMEOUT_DURATION = 5000;

export async function GET() {
  try {
    // Check if we have a recent cache
    const now = Date.now();
    if (now - metricsCache.lastUpdated < CACHE_TTL) {
      return NextResponse.json(metricsCache, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        }
      });
    }

    const db = await getDb();
    
    // Get database metrics with timeout
    const startTime = Date.now();
    const pingPromise = db.command({ ping: 1 });
    const pingTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Ping timeout')), TIMEOUT_DURATION)
    );
    await Promise.race([pingPromise, pingTimeout]);
    const pingTime = Date.now() - startTime;

    // Get server information with timeout
    const serverStatusPromise = db.command({ serverStatus: 1 });
    const statusTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Server status timeout')), TIMEOUT_DURATION)
    );
    const serverStatus = await Promise.race([serverStatusPromise, statusTimeout]) as { network?: { bytesIn: number; bytesOut: number } };

    // Calculate network stats
    const bytesIn = serverStatus.network?.bytesIn || 0;
    const bytesOut = serverStatus.network?.bytesOut || 0;
    const totalBytes = bytesIn + bytesOut;

    // Update cache
    metricsCache = {
      pingTimeMs: pingTime,
      dataTransferred: totalBytes,
      lastUpdated: now
    };

    return NextResponse.json(metricsCache, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Metrics check failed:', error);

    // If cache exists and is not too old (within 30 seconds), use it
    const now = Date.now();
    if (now - metricsCache.lastUpdated < 30000) {
      return NextResponse.json({
        ...metricsCache,
        fromCache: true
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        }
      });
    }

    // If no recent cache, return error
    return NextResponse.json({
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  }
}
