import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Thought {
  _id: string;
  content: string;
  thoughtType: 'task' | 'event' | 'note' | 'uncertain';
  confidence?: 'high' | 'low';
  possibleTypes?: Array<'task' | 'event' | 'note'>;
  processedContent: {
    title?: string;
    // Task fields
    dueDate?: string;
    priority?: string;
    // Event fields - support both naming conventions
    eventDate?: string;
    eventTime?: string;
    date?: string;
    time?: string;
    location?: string;
    person?: string;
    // Note fields
    details?: string;
    tags?: string[];
    // Uncertain fields
    suggestedDate?: string;
    suggestedAction?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface UseThoughtsOptions {
  thoughtType?: string;
  status: 'pending' | 'approved';
}

async function fetchThoughts({ thoughtType, status }: UseThoughtsOptions) {
  const params = new URLSearchParams({
    status,
    ...(thoughtType && { thoughtType })
  });
  
  const response = await fetch(`/api/thoughts?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch thoughts');
  }
  const data = await response.json();
  return data.data.items;
}

async function updateThoughtStatus(id: string, status: 'approved' | 'rejected') {
  const response = await fetch('/api/thoughts', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      updates: { status }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update thought status');
  }
}

async function updateThoughtType(id: string, thoughtType: 'task' | 'event' | 'note') {
  const response = await fetch('/api/thoughts', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
      updates: { 
        thoughtType,
        confidence: 'high' // User manually chose type
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update thought type');
  }
}

export function useThoughts({ thoughtType, status }: UseThoughtsOptions) {
  const queryClient = useQueryClient();

  const { data: thoughts = [], isLoading, error } = useQuery({
    queryKey: ['thoughts', thoughtType, status],
    queryFn: () => fetchThoughts({ thoughtType, status }),
    refetchOnWindowFocus: false,
    staleTime: 5000, // Consider data fresh for 5s
    gcTime: 10 * 60 * 1000, // Keep cache for 10 mins
    refetchInterval: 3000 // Poll every 3s
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => 
      updateThoughtStatus(id, status),
    onSuccess: () => {
      // Invalidate all thought queries
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
      
      // If we're not on pending tab and this is a new thought
      if (status !== 'pending') {
        // Trigger a refetch of pending thoughts
        queryClient.invalidateQueries({ 
          queryKey: ['thoughts', undefined, 'pending']
        });
      }
    }
  });

  const typeMutation = useMutation({
    mutationFn: ({ id, type }: { id: string, type: 'task' | 'event' | 'note' }) =>
      updateThoughtType(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    }
  });

  const handleApprove = async (id: string) => {
    await statusMutation.mutateAsync({ id, status: 'approved' });
  };

  const handleReject = async (id: string) => {
    await statusMutation.mutateAsync({ id, status: 'rejected' });
  };

  const handleTypeChange = async (id: string, newType: 'task' | 'event' | 'note') => {
    await typeMutation.mutateAsync({ id, type: newType });
  };

  return {
    thoughts,
    isLoading,
    error,
    handleApprove,
    handleReject,
    handleTypeChange
  };
}

export type { Thought };
