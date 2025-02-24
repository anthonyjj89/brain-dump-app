import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Thought {
  _id: string;
  content: string;
  thoughtType: 'task' | 'event' | 'note' | 'uncertain';
  confidence?: 'high' | 'low';
  possibleTypes?: Array<'task' | 'event' | 'note'>;
  processedContent: {
    title?: string;
    dueDate?: string;
    priority?: string;
    eventDate?: string;
    eventTime?: string;
    location?: string;
    details?: string;
    tags?: string[];
    suggestedDate?: string;
    suggestedAction?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

async function fetchPendingThoughts(thoughtType?: string) {
  const params = new URLSearchParams({
    status: 'pending',
    ...(thoughtType && { thoughtType })
  });
  
  const response = await fetch(`/api/thoughts?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch pending thoughts');
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

export function usePendingThoughts(filter?: string) {
  const queryClient = useQueryClient();

  const { data: thoughts = [], isLoading, error } = useQuery({
    queryKey: ['thoughts', 'pending', filter],
    queryFn: () => fetchPendingThoughts(filter)
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => 
      updateThoughtStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
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
