import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    
    // Get database metrics with timeout
    const startTime = Date.now();
    const pingPromise = db.command({ ping: 1 });
    const pingTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Ping timeout')), 2000)
    );
    await Promise.race([pingPromise, pingTimeout]);
    const pingTime = Date.now() - startTime;

    // Get server information with timeout
    const serverStatusPromise = db.command({ serverStatus: 1 });
    const statusTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Server status timeout')), 2000)
    );
    const serverStatus = await Promise.race([serverStatusPromise, statusTimeout]) as { network?: { bytesIn: number; bytesOut: number } };

    // Calculate network stats
    const bytesIn = serverStatus.network?.bytesIn || 0;
    const bytesOut = serverStatus.network?.bytesOut || 0;
    const totalBytes = bytesIn + bytesOut;

    return NextResponse.json({
      pingTimeMs: pingTime,
      dataTransferred: totalBytes
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Metrics check failed:', error);
    return NextResponse.json({
      pingTimeMs: 0,
      dataTransferred: 0
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  }
}
