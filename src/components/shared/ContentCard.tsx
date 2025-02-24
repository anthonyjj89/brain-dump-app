interface ContentCardProps {
  title: string;
  content: string;
  type: 'task' | 'event' | 'note';
  timestamp: string;
  status?: string;
  id?: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onAction?: () => void;
  actionLabel?: string;
}

export default function ContentCard({
  title,
  content,
  type,
  timestamp,
  status,
  id,
  onApprove,
  onReject,
  onAction,
  actionLabel
}: ContentCardProps) {
  const typeColors = {
    task: 'bg-purple-900/50 text-purple-200 border-purple-700',
    event: 'bg-green-900/50 text-green-200 border-green-700',
    note: 'bg-blue-900/50 text-blue-200 border-blue-700'
  };

  const statusColors = {
    pending: 'text-yellow-400',
    approved: 'text-green-400',
    rejected: 'text-red-400'
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-xl p-6 mb-4 border border-slate-700 hover:shadow-2xl hover:border-slate-600 transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <span className={`inline-block px-3 py-1.5 rounded-md text-xs font-medium ${typeColors[type]}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>
        <span className="text-sm text-gray-400">{timestamp}</span>
      </div>
      
      <p className="text-gray-300 mb-4 whitespace-pre-wrap">{content}</p>
      
      <div className="flex justify-between items-center">
        {status && (
          <span className={`text-sm ${statusColors[status as keyof typeof statusColors] || 'text-gray-400'}`}>
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
        <div className="flex gap-2">
          {status === 'pending' && (
            <>
              <button
                onClick={() => onApprove?.(id!)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                Approve
              </button>
              <button
                onClick={() => onReject?.(id!)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                Reject
              </button>
            </>
          )}
          {onAction && actionLabel && (
            <button
              onClick={onAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
