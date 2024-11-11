'use client';

import React from 'react';
import { useSystemStatus, useMetrics } from '@/hooks/useSystemStatus';

interface StatusTabProps {
  onRefresh: () => void;
}

// Format bytes to human readable format
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function StatusTab({ onRefresh }: StatusTabProps) {
  // Get system status (refreshes every minute)
  const { 
    data: status,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus
  } = useSystemStatus();

  // Get live metrics (refreshes every second)
  const {
    data: metrics,
    error: metricsError
  } = useMetrics();

  if (statusLoading && !status) { // Only show loading on initial load
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (statusError && !status) {
    const errorMessage = statusError instanceof Error 
      ? statusError.message 
      : 'Failed to load status';

    return (
      <div className="space-y-4">
        <div className="bg-red-50 text-red-600 p-3 rounded-md break-words">
          {errorMessage}
        </div>
        <button
          onClick={() => refetchStatus()}
          className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return status ? (
    <div className="space-y-4">
      {/* Database Status */}
      <div className="border-b pb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium truncate max-w-[200px]" title={status.database.name}>
            Database
          </span>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              status.database.connected
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {status.database.connected ? 'Connected' : 'Disconnected'}
            </span>
            {statusLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-1 overflow-hidden">
            <p className="truncate" title={`${status.database.name} v${status.database.version}`}>
              {status.database.name} v{status.database.version}
            </p>
          </div>
          <p className="truncate" title={`Region: ${status.database.region}`}>
            Region: {status.database.region}
          </p>
          {status.database.error && (
            <p className="text-red-600 mt-1 break-words">
              {status.database.error}
            </p>
          )}
          <div className="flex justify-between items-center">
            <p>Ping: {metrics?.pingTimeMs ?? status.database.pingTimeMs}ms</p>
            <div className="flex items-center space-x-2">
              {metrics?.fromCache && (
                <span className="text-xs text-yellow-600">Cached</span>
              )}
              {metrics?.pingTimeMs !== status.database.pingTimeMs && (
                <span className="text-xs text-green-600">Live</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p>Data: {formatBytes(metrics?.dataTransferred ?? status.database.dataTransferred)}</p>
            <div className="flex items-center space-x-2">
              {metrics?.fromCache && (
                <span className="text-xs text-yellow-600">Cached</span>
              )}
              {metrics?.dataTransferred !== status.database.dataTransferred && (
                <span className="text-xs text-green-600">Live</span>
              )}
            </div>
          </div>
          {metricsError && (
            <p className="text-red-600 mt-1 text-xs break-words">
              {metricsError instanceof Error ? metricsError.message : 'Failed to fetch metrics'}
            </p>
          )}
        </div>
      </div>

      {/* AI Service Status */}
      <div className="border-b pb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium truncate max-w-[200px]" title={status.ai.service}>
            AI Service
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            status.ai.status === 'configured'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {status.ai.status}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <p className="truncate" title={status.ai.service}>{status.ai.service}</p>
          <p>Ping: {status.ai.pingTimeMs}ms</p>
          <p>Data: {formatBytes(status.ai.dataTransferred)}</p>
        </div>
      </div>

      {/* External Services */}
      <div>
        <span className="font-medium">External Services</span>
        <div className="mt-2 space-y-2">
          {Object.entries(status.externalServices).map(([service, data]) => (
            <div key={service} className="flex justify-between items-center">
              <span className="text-sm capitalize truncate max-w-[150px]" title={service}>
                {service}
              </span>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  data.status === 'configured'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {data.status}
                </span>
                <p className="text-xs text-gray-600">Ping: {data.pingTimeMs}ms</p>
                <p className="text-xs text-gray-600">Data: {formatBytes(data.dataTransferred)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Info */}
      <div className="text-xs text-gray-500 mt-4 flex justify-between items-center">
        <span className="truncate" title={new Date(status.lastChecked).toLocaleString()}>
          Last checked: {new Date(status.lastChecked).toLocaleString()}
        </span>
        {status.fromCache && (
          <span className="text-yellow-600 ml-2 shrink-0">Using cached data</span>
        )}
      </div>

      <button
        onClick={() => {
          refetchStatus();
          onRefresh();
        }}
        disabled={statusLoading}
        className={`mt-4 w-full py-2 rounded transition-colors ${
          statusLoading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {statusLoading ? 'Refreshing...' : 'Refresh Status'}
      </button>
    </div>
  ) : null;
}
