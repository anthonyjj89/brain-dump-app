import { useQuery } from '@tanstack/react-query';

export interface StatusData {
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
  fromCache?: boolean;
}

// Fetch function for system status
async function fetchSystemStatus(): Promise<StatusData> {
  const response = await fetch('/api/status');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch status');
  }
  return response.json();
}

interface UseSystemStatusOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Hook for system status
export function useSystemStatus({ 
  autoRefresh = false, 
  refreshInterval = 60 * 1000 
}: UseSystemStatusOptions = {}) {
  return useQuery({
    queryKey: ['systemStatus'],
    queryFn: fetchSystemStatus,
    // Only refetch if auto-refresh is enabled
    refetchInterval: autoRefresh ? refreshInterval : 0,
    // Start fetching immediately when hook is mounted
    refetchOnMount: true,
    // Use placeholder data while fetching
    placeholderData: (previousData) => previousData,
  });
}

// Metrics interface
export interface Metrics {
  pingTimeMs: number;
  dataTransferred: number;
  fromCache?: boolean;
  error?: string;
}

// Fetch function for metrics
async function fetchMetrics(): Promise<Metrics> {
  const response = await fetch('/api/status/metrics');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch metrics');
  }
  return response.json();
}

interface UseMetricsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Hook for live metrics
export function useMetrics({
  autoRefresh = false,
  refreshInterval = 5000
}: UseMetricsOptions = {}) {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    // Only refetch if auto-refresh is enabled
    refetchInterval: autoRefresh ? refreshInterval : 0,
    // Use placeholder data while fetching
    placeholderData: (previousData) => previousData,
    // Don't show loading state if we have data
    notifyOnChangeProps: ['data', 'error'],
  });
}
