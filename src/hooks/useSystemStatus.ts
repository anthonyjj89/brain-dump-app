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

// Hook for system status
export function useSystemStatus() {
  return useQuery({
    queryKey: ['systemStatus'],
    queryFn: fetchSystemStatus,
    // Refetch every minute
    refetchInterval: 60 * 1000,
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

// Hook for live metrics
export function useMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    // Refetch every second for live updates
    refetchInterval: 1000,
    // Use placeholder data while fetching
    placeholderData: (previousData) => previousData,
    // Don't show loading state if we have data
    notifyOnChangeProps: ['data', 'error'],
  });
}
