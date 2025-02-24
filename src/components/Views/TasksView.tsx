import { useThoughts, type Thought } from '@/hooks/useThoughts';
import ContentCard from '../shared/ContentCard';

interface TasksViewProps {
  status: 'pending' | 'approved';
}

export default function TasksView({ status }: TasksViewProps) {
  const { thoughts, isLoading, error, handleApprove, handleReject, handleTypeChange } = useThoughts({ 
    thoughtType: 'task',
    status 
  });

  const handleFix = async (id: string, method: 'voice' | 'text') => {
    // TODO: Implement fix functionality
    console.log('Fix task:', id, method);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading tasks
      </div>
    );
  }

  if (thoughts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        {status === 'pending' ? 'No tasks to review' : 'No approved tasks yet'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {thoughts.map((thought: Thought) => (
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
          onApprove={status === 'pending' ? handleApprove : undefined}
          onReject={status === 'pending' ? handleReject : undefined}
          onFix={status === 'pending' ? handleFix : undefined}
        />
      ))}
    </div>
  );
}
