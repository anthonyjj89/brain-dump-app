import { useThoughts, type Thought } from '@/hooks/useThoughts';
import ContentCard from '../shared/ContentCard';

interface NotesViewProps {
  status: 'pending' | 'approved';
}

export default function NotesView({ status }: NotesViewProps) {
  const { thoughts, isLoading, error, handleApprove, handleReject, handleTypeChange } = useThoughts({ 
    thoughtType: 'note',
    status 
  });

  const handleFix = async (id: string, method: 'voice' | 'text') => {
    // TODO: Implement fix functionality
    console.log('Fix note:', id, method);
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
        Error loading notes
      </div>
    );
  }

  if (thoughts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        {status === 'pending' ? 'No notes to review' : 'No approved notes yet'}
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
