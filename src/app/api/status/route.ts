import { NextResponse, type NextRequest } from 'next/server';
import { getDb, checkConnection } from '@/lib/mongodb';

interface StatusData {
  database: {
    connected: boolean;
    name: string;
    version: string;
    region: string;
    pingTimeMs: number;
    dataTransferred: number;
  };
  ai: {
    service: string;
    status: string;
    pingTimeMs: number;
    dataTransferred: number;
  };
  externalServices: {
    [key: string]: {
      status: string;
      pingTimeMs: number;
      dataTransferred: number;
    };
  };
  lastChecked: string;
}

interface CacheData {
  data: StatusData | null;
  timestamp: number;
}

// Cache status results for 30 seconds
let statusCache: CacheData = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 30000; // 30 seconds

// Initial status data for fast first load
const initialStatus: StatusData = {
  database: {
    connected: true,
    name: 'Brain-Dump-Database',
    version: '6.0',
    region: 'eu-central-1',
    pingTimeMs: 0,
    dataTransferred: 0
  },
  ai: {
    service: 'OpenRouter',
    status: 'configured',
    pingTimeMs: 0,
    dataTransferred: 0
  },
  externalServices: {
    tickTick: {
      status: 'configured',
      pingTimeMs: 0,
      dataTransferred: 0
    },
    googleCalendar: {
      status: 'not configured',
      pingTimeMs: 0,
      dataTransferred: 0
    },
    notion: {
      status: 'not configured',
      pingTimeMs: 0,
      dataTransferred: 0
    }
  },
  lastChecked: new Date().toISOString()
};

// Function to get detailed status
async function getDetailedStatus(): Promise<StatusData> {
  const isConnected = await checkConnection();
  if (!isConnected) {
    throw new Error('Database connection failed');
  }

  const db = await getDb();
  
  // Get database metrics
  const startTime = Date.now();
  await db.command({ ping: 1 });
  const pingTime = Date.now() - startTime;

  // Get server information
  const serverStatus = await db.command({ serverStatus: 1 });

  return {
    database: {
      connected: true,
      name: db.databaseName,
      version: serverStatus.version || '6.0',
      region: 'eu-central-1',
      pingTimeMs: pingTime,
      dataTransferred: serverStatus.network?.bytesIn || 0
    },
    ai: {
      service: 'OpenRouter',
      status: 'configured',
      pingTimeMs: 50,
      dataTransferred: 0
    },
    externalServices: {
      tickTick: {
        status: 'configured',
        pingTimeMs: 50,
        dataTransferred: 0
      },
      googleCalendar: {
        status: 'not configured',
        pingTimeMs: 0,
        dataTransferred: 0
      },
      notion: {
        status: 'not configured',
        pingTimeMs: 0,
        dataTransferred: 0
      }
    },
    lastChecked: new Date().toISOString()
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is the first request (no cache)
    const isFirstRequest = !statusCache.data;
    
    // Return cached data if it's still valid
    if (statusCache.data && Date.now() - statusCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(statusCache.data, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=30',
          'Content-Type': 'application/json'
        }
      });
    }

    // For first request, return initial status immediately and update cache in background
    if (isFirstRequest) {
      // Start background update
      getDetailedStatus().then(detailedStatus => {
        statusCache = {
          data: detailedStatus,
          timestamp: Date.now()
        };
      }).catch(console.error);

      // Return initial status immediately
      return NextResponse.json(initialStatus, { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=30',
          'Content-Type': 'application/json'
        }
      });
    }

    // For subsequent requests, get detailed status
    const statusData = await getDetailedStatus();

    // Update cache
    statusCache = {
      data: statusData,
      timestamp: Date.now()
    };

    return NextResponse.json(statusData, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=30',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Status check failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to retrieve system status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  }
}
