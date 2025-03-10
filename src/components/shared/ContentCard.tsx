interface ContentCardProps {
  thought: {
    id: string;
    thoughtType: 'task' | 'event' | 'note' | 'uncertain';
    confidence?: 'high' | 'low';
    possibleTypes?: Array<'task' | 'event' | 'note'>;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
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
  };
  onTypeChange?: (id: string, newType: 'task' | 'event' | 'note') => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onFix?: (id: string, method: 'voice' | 'text') => void;
}

export default function ContentCard({ thought, onTypeChange, onApprove, onReject, onFix }: ContentCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '✓';
      case 'event':
        return '📅';
      case 'note':
        return '📝';
      case 'uncertain':
        return '❓';
      default:
        return '•';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-500';
      case 'event':
        return 'bg-green-500';
      case 'note':
        return 'bg-gray-500';
      case 'uncertain':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  return (
    <div className={`
      bg-slate-800 rounded-lg p-6 space-y-4
      border border-slate-700
      shadow-lg shadow-black/20
      hover:border-slate-600
      transition-all duration-300
      relative
      ${thought.status === 'pending' ? 'animate-slide-in' : ''}
    `}>
      {/* Gradient line at bottom */}
      <div className="absolute inset-x-0 -bottom-px h-[1px] bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`${getTypeColor(thought.thoughtType)} w-6 h-6 rounded-full flex items-center justify-center text-white`}>
            {getIcon(thought.thoughtType)}
          </span>
          <h3 className="font-medium text-white">
            {thought.processedContent.title || 'Untitled'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {thought.confidence === 'low' && (
            <span className="text-xs text-yellow-500">Low Confidence</span>
          )}
          <span className={`${getStatusColor(thought.status)} px-2 py-1 rounded text-xs text-white`}>
            {getStatusText(thought.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="text-gray-300 text-sm">
        {thought.thoughtType === 'task' && (
          <>
            {thought.processedContent.dueDate && (
              <div className="text-blue-400">Due: {thought.processedContent.dueDate}</div>
            )}
            {thought.processedContent.priority && (
              <div className="text-blue-400">Priority: {thought.processedContent.priority}</div>
            )}
          </>
        )}

        {thought.thoughtType === 'event' && (
          <>
            {thought.processedContent.eventDate && (
              <div className="text-green-400">Date: {thought.processedContent.eventDate}</div>
            )}
            {thought.processedContent.eventTime && (
              <div className="text-green-400">Time: {thought.processedContent.eventTime}</div>
            )}
            {thought.processedContent.location && (
              <div className="text-green-400">Location: {thought.processedContent.location}</div>
            )}
          </>
        )}

        {thought.thoughtType === 'note' && (
          <>
            <div>{thought.processedContent.details}</div>
            {thought.processedContent.tags && thought.processedContent.tags.length > 0 && (
              <div className="flex gap-2 mt-2">
                {thought.processedContent.tags.map((tag, index) => (
                  <span key={index} className="bg-slate-700 px-2 py-1 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {thought.thoughtType === 'uncertain' && (
          <>
            <div>{thought.content}</div>
            {thought.processedContent.suggestedDate && (
              <div className="text-yellow-400">Date Mentioned: {thought.processedContent.suggestedDate}</div>
            )}
            {thought.processedContent.suggestedAction && (
              <div className="text-yellow-400">Action Mentioned: {thought.processedContent.suggestedAction}</div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {/* Type Change Buttons */}
        {thought.thoughtType === 'uncertain' && onTypeChange && (
          <>
            {thought.possibleTypes?.includes('task') && (
              <button
                onClick={() => onTypeChange(thought.id, 'task')}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
              >
                Make Task
              </button>
            )}
            {thought.possibleTypes?.includes('event') && (
              <button
                onClick={() => onTypeChange(thought.id, 'event')}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 transition-colors"
              >
                Make Event
              </button>
            )}
            {thought.possibleTypes?.includes('note') && (
              <button
                onClick={() => onTypeChange(thought.id, 'note')}
                className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition-colors"
              >
                Make Note
              </button>
            )}
          </>
        )}

        {/* Approve/Reject/Fix Buttons */}
        {thought.status === 'pending' && (
          <div className="flex gap-2 ml-auto">
            {onApprove && (
              <button
                onClick={() => onApprove(thought.id)}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 transition-colors"
              >
                Approve
              </button>
            )}
            {onReject && (
              <button
                onClick={() => onReject(thought.id)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 transition-colors"
              >
                Reject
              </button>
            )}
            {onFix && (
              <div className="relative inline-block">
                <button
                  onClick={() => onFix(thought.id, 'text')}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 transition-colors"
                >
                  Fix
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
