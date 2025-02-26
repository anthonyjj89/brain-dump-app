import { useThoughts, type Thought } from '@/hooks/useThoughts';
import ContentCard from '../shared/ContentCard';
import { useQueryClient } from '@tanstack/react-query';

interface NotesViewProps {
  status: 'pending' | 'approved';
}

export default function NotesView({ status }: NotesViewProps) {
  const { thoughts, isLoading, error, handleApprove, handleReject, handleTypeChange } = useThoughts({
    thoughtType: 'note',
    status
  });
  const queryClient = useQueryClient();

  const handleFix = async (id: string, method: 'voice' | 'text') => {
    // TODO: Implement fix functionality
    console.log('Fix note:', id, method);
  };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/review`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            console.log('Delete API response:', response);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to delete thought. Status:', response.status, 'Response:', errorText);
                throw new Error('Failed to delete thought');
            }

            // Invalidate and refetch - refetch all thoughts, not just pending
            queryClient.invalidateQueries({ queryKey: ['thoughts', status] });

        } catch (error) {
            console.error('Error deleting thought:', error);
        }
    }

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
                    onDelete={status === 'approved' ? handleDelete : undefined}
                    showDelete={status === 'approved'}
                />
            ))}
        </div>
    );
}
