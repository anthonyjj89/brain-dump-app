import { useState } from 'react';
import { usePendingThoughts } from '@/hooks/usePendingThoughts';
import type { Thought } from '@/hooks/usePendingThoughts';
import ContentCard from '../shared/ContentCard';

const filters = [
  { id: '', label: 'All Types' },
  { id: 'task', label: 'Tasks' },
  { id: 'event', label: 'Events' },
  { id: 'note', label: 'Notes' }
];

export default function ReviewContainer() {
  const [activeFilter, setActiveFilter] = useState('');
  const { thoughts, isLoading, error, handleApprove, handleReject, handleTypeChange } = usePendingThoughts(activeFilter);

  const handleFix = async (id: string, method: 'voice' | 'text') => {
    // TODO: Implement fix functionality
    console.log('Fix thought:', id, method);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="text-red-500 p-4">
          Error loading pending thoughts
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Pending Review</h2>
        <span className="bg-yellow-500 text-white px-2 py-1 rounded text-sm">
          {thoughts.length} pending
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 mb-6">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              activeFilter === filter.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Thoughts Grid */}
      <div className="space-y-4">
        {thoughts.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No pending thoughts to review
          </div>
        ) : (
          thoughts.map((thought: Thought) => (
            <ContentCard
              key={thought._id}
              thought={{
                id: thought._id,
                thoughtType: thought.thoughtType,
                confidence: thought.confidence,
                possibleTypes: thought.possibleTypes,
                content: thought.content,
                status: thought.status,
                processedContent: thought.processedContent
              }}
              onTypeChange={handleTypeChange}
              onApprove={handleApprove}
              onReject={handleReject}
              onFix={handleFix}
            />
          ))
        )}
      </div>
    </div>
  );
}
