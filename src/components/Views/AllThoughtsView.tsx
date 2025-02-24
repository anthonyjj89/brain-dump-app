'use client';

import { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ContentCard from '../shared/ContentCard';
import { useThoughts, flattenThoughtPages } from '@/hooks/useThoughts';

interface AllThoughtsViewProps {
  status?: 'pending' | 'approved' | 'rejected';
  thoughtType?: 'task' | 'event' | 'note';
}

async function updateThoughtStatus(id: string, action: 'approve' | 'reject') {
  const response = await fetch(`/api/review?action=${action}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    throw new Error('Failed to update thought status');
  }

  return response.json();
}

export default function AllThoughtsView({ status = 'pending', thoughtType }: AllThoughtsViewProps) {
  const queryClient = useQueryClient();
  
  const approveMutation = useMutation({
    mutationFn: (id: string) => updateThoughtStatus(id, 'approve'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => updateThoughtStatus(id, 'reject'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(id);
  };
  const { ref: loadMoreRef, inView } = useInView();
  const hasTriggeredRef = useRef(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useThoughts({ status, thoughtType });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      hasTriggeredRef.current = true;
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/20 animate-pulse h-32 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500">
        Error: {error.message}
      </div>
    );
  }

  const thoughts = flattenThoughtPages(data?.pages);

  if (thoughts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No thoughts found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {thoughts.map((thought) => (
          <ContentCard
            key={thought._id}
            id={thought._id}
            title={thought.thoughtType.charAt(0).toUpperCase() + thought.thoughtType.slice(1)}
            content={thought.content}
            type={thought.thoughtType}
            timestamp={new Date(thought.createdAt).toLocaleString()}
            status={thought.status}
            onApprove={handleApprove}
            onReject={handleReject}
          />
      ))}

      {/* Loading indicator */}
      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <div className="text-center text-gray-500">Loading more...</div>
        )}
      </div>

      {/* No more data indicator */}
      {!hasNextPage && hasTriggeredRef.current && (
        <div className="text-center text-gray-500 py-4">
          No more thoughts to load
        </div>
      )}
    </div>
  );
}
