import { useInfiniteQuery } from '@tanstack/react-query';

interface Thought {
  _id: string;
  content: string;
  thoughtType: 'task' | 'event' | 'note';
  processedContent: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface ThoughtsResponse {
  status: string;
  data: {
    items: Thought[];
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

interface UseThoughtsParams {
  status?: string;
  thoughtType?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchThoughts({ 
  pageParam = null, 
  status = 'pending',
  thoughtType,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: {
  pageParam?: string | null;
} & UseThoughtsParams) {
  const params = new URLSearchParams({
    status,
    limit: limit.toString(),
    sortBy,
    sortOrder,
  });

  if (pageParam) {
    params.append('cursor', pageParam);
  }
  if (thoughtType) {
    params.append('thoughtType', thoughtType);
  }

  const response = await fetch(`/api/thoughts?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export function useThoughts({
  status = 'pending',
  thoughtType,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: UseThoughtsParams = {}) {
  return useInfiniteQuery({
    queryKey: ['thoughts', status, thoughtType, sortBy, sortOrder] as const,
    queryFn: async ({ pageParam = null }) => fetchThoughts({ 
      pageParam, 
      status, 
      thoughtType,
      limit,
      sortBy,
      sortOrder
    }),
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
    initialPageParam: null,
  });
}

// Helper function to flatten pages of thoughts
export function flattenThoughtPages(pages: ThoughtsResponse[] | undefined): Thought[] {
  if (!pages) return [];
  return pages.flatMap(page => page.data.items);
}
