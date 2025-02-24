import { usePendingThoughts } from '@/hooks/usePendingThoughts';

interface ReviewButtonProps {
  onClick: () => void;
}

export default function ReviewButton({ onClick }: ReviewButtonProps) {
  const { thoughts } = usePendingThoughts();
  
  if (thoughts.length === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-white px-4 py-2 rounded-full shadow-lg transition-colors flex items-center gap-2"
    >
      <span className="text-sm font-medium">Review</span>
      <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
        {thoughts.length}
      </span>
    </button>
  );
}
