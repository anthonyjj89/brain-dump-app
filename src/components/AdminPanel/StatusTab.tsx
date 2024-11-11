'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface StatusData {
  database: {
    connected: boolean;
    name: string;
    version: string;
    region: string;
    error?: string;
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

interface StatusTabProps {
  onRefresh: () => void;
}

// Separate metrics interface
interface Metrics {
  pingTimeMs: number;
  dataTransferred: number;
}

// Hook for real-time metrics
function useMetrics() {
  const [metrics, setMetrics] = useState<Metrics>({
    pingTimeMs: 0,
    dataTransferred: 0
  });

  useEffect(() => {
    let mounted = true;

    async function fetchMetrics() {
      try {
        const response = await fetch('/api/status/metrics');
        if (!response.ok || !mounted) return;
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    }

    // Initial fetch
    fetchMetrics();

    // Update metrics every second
    const intervalId = setInterval(fetchMetrics, 1000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array since we want this to run continuously

  return metrics;
}

export default function StatusTab({ onRefresh }: StatusTabProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Get real-time metrics
  const metrics = useMetrics();

  const checkStatus = useCallback(async () => {
    // Debounce: Skip if last update was less than 5 seconds ago
    if (Date.now() - lastUpdated < 5000) return;

    try {
      setLoading(true);
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setLoading(false);
    }
  }, [lastUpdated]);

  useEffect(() => {
    // Initial check
    checkStatus();
    
    // Poll every 30 seconds for full status
    const intervalId = setInterval(checkStatus, 30000);
    
    // Cleanup
    return () => clearInterval(intervalId);
  }, [checkStatus]);

  if (loading && !status) { // Only show loading on initial load
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
        {error}
      </div>
    );
  }

  return status ? (
    <div className="space-y-4">
      {/* Database Status */}
      <div className="border-b pb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium">Database</span>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              status.database.connected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {status.database.connected ? 'Connected' : 'Disconnected'}
            </span>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <p>{status.database.name} v{status.database.version}</p>
          <p>Region: {status.database.region}</p>
          <div className="flex justify-between items-center">
            <p>Ping: {metrics.pingTimeMs}ms</p>
            {metrics.pingTimeMs !== status.database.pingTimeMs && (
              <span className="text-xs text-green-600">Live</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p>Data Transferred: {metrics.dataTransferred} bytes</p>
            {metrics.dataTransferred !== status.database.dataTransferred && (
              <span className="text-xs text-green-600">Live</span>
            )}
          </div>
        </div>
      </div>

      {/* AI Service Status */}
      <div className="border-b pb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium">AI Service</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            status.ai.status === 'configured'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {status.ai.status}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <p>{status.ai.service}</p>
          <p>Ping: {status.ai.pingTimeMs}ms</p>
          <p>Data Transferred: {status.ai.dataTransferred} bytes</p>
        </div>
      </div>

      {/* External Services */}
      <div>
        <span className="font-medium">External Services</span>
        <div className="mt-2 space-y-2">
          {Object.entries(status.externalServices).map(([service, data]) => (
            <div key={service} className="flex justify-between items-center">
              <span className="text-sm capitalize">{service}</span>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  data.status === 'configured'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {data.status}
                </span>
                <p className="text-xs text-gray-600">Ping: {data.pingTimeMs}ms</p>
                <p className="text-xs text-gray-600">Data: {data.dataTransferred} bytes</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Checked */}
      <div className="text-xs text-gray-500 mt-4">
        Last checked: {new Date(status.lastChecked).toLocaleString()}
      </div>

      <button
        onClick={() => {
          checkStatus();
          onRefresh();
        }}
        disabled={loading}
        className={`mt-4 w-full py-2 rounded transition-colors ${
          loading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? 'Refreshing...' : 'Refresh Status'}
      </button>
    </div>
  ) : null;
}
