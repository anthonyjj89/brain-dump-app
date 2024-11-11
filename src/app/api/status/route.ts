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
    error?: string;
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
  fromCache?: boolean;
}

interface CacheData {
  data: StatusData | null;
  timestamp: number;
}

interface ServerStatus {
  version: string;
  network?: {
    bytesIn: number;
    bytesOut: number;
  };
}

// Cache status results for 30 seconds
let statusCache: CacheData = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 30000; // 30 seconds
const TIMEOUT_DURATION = 5000; // 5 seconds
const STALE_CACHE_DURATION = 60000; // 1 minute - how long to use cache in error cases

// Initial status data with reasonable defaults
const initialStatus: StatusData = {
  database: {
    connected: false,
    name: 'Brain-Dump-Database',
    version: '6.0',
    region: 'eu-central-1',
    pingTimeMs: 0,
    dataTransferred: 0
  },
  ai: {
    service: 'OpenRouter',
    status: 'configured',
    pingTimeMs: 200,
    dataTransferred: 512
  },
  externalServices: {
    tickTick: {
      status: 'configured',
      pingTimeMs: 180,
      dataTransferred: 256
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
  try {
    const isConnected = await checkConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
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
    const serverStatus = await Promise.race([serverStatusPromise, statusTimeout]) as ServerStatus;

    // Calculate network stats
    const bytesIn = serverStatus.network?.bytesIn || 0;
    const bytesOut = serverStatus.network?.bytesOut || 0;
    const totalBytes = bytesIn + bytesOut;

    return {
      database: {
        connected: true,
        name: db.databaseName,
        version: serverStatus.version || '6.0',
        region: 'eu-central-1',
        pingTimeMs: pingTime,
        dataTransferred: totalBytes
      },
      ai: {
        service: 'OpenRouter',
        status: 'configured',
        pingTimeMs: 200,
        dataTransferred: statusCache.data?.ai.dataTransferred || 512
      },
      externalServices: {
        tickTick: {
          status: 'configured',
          pingTimeMs: 180,
          dataTransferred: statusCache.data?.externalServices.tickTick.dataTransferred || 256
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
  } catch (error) {
    console.error('Failed to get detailed status:', error);
    
    // If we have recent cache, use it but mark as from cache
    if (statusCache.data && Date.now() - statusCache.timestamp < STALE_CACHE_DURATION) {
      return {
        ...statusCache.data,
        database: {
          ...statusCache.data.database,
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        lastChecked: new Date().toISOString(),
        fromCache: true
      };
    }

    // If no recent cache, return initial status with error
    return {
      ...initialStatus,
      database: {
        ...initialStatus.database,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      lastChecked: new Date().toISOString()
    };
  }
}

// Warm up connection on app start
(async function warmUpConnection() {
  try {
    console.log('Warming up database connection...');
    const status = await getDetailedStatus();
    statusCache = {
      data: status,
      timestamp: Date.now()
    };
    console.log('Database connection warmed up successfully');
  } catch (error) {
    console.error('Failed to warm up database connection:', error);
  }
})();

export async function GET(request: NextRequest) {
  try {
    // Return cached data if it's still valid
    if (statusCache.data && Date.now() - statusCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        ...statusCache.data,
        fromCache: true
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=30',
          'Content-Type': 'application/json'
        }
      });
    }

    // Get detailed status
    const statusData = await getDetailedStatus();

    // Update cache
    statusCache = {
      data: statusData,
      timestamp: Date.now()
    };

    return NextResponse.json(statusData, { 
      status: statusData.database.connected ? 200 : 503,
      headers: {
        'Cache-Control': 'private, max-age=30',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Status check failed:', error);
    
    // If we have recent cache, use it
    if (statusCache.data && Date.now() - statusCache.timestamp < STALE_CACHE_DURATION) {
      return NextResponse.json({
        ...statusCache.data,
        database: {
          ...statusCache.data.database,
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        fromCache: true
      }, { 
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        }
      });
    }

    // If no cache, return error with initial status
    return NextResponse.json({
      ...initialStatus,
      database: {
        ...initialStatus.database,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  }
}
