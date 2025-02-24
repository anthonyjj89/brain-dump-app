interface MiniCardProps {
  type: 'task' | 'event' | 'note';
  text: string;
  metadata?: {
    time?: string;
    date?: string;
    priority?: string;
    person?: string;
  };
  index: number;
}

export default function MiniCard({ type, text, metadata, index }: MiniCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'task':
        return '✓';
      case 'event':
        return '📅';
      case 'note':
        return '📝';
      default:
        return '•';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'task':
        return 'bg-blue-500/20 text-blue-400';
      case 'event':
        return 'bg-green-500/20 text-green-400';
      case 'note':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div 
      className="
        w-full max-w-full
        bg-slate-800/50 backdrop-blur
        rounded-lg p-3 mb-2
        border border-slate-700/50
        transform transition-all duration-300
        hover:border-slate-600/50
        flex flex-wrap items-center gap-3
        animate-slide-in
      "
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Type Icon */}
      <div className={`
        rounded-full p-2 
        ${getTypeColor()}
        animate-pop-in
      `} style={{ animationDelay: `${index * 150 + 100}ms` }}>
        {getTypeIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{text}</div>
        {metadata && (
          <div className="text-sm text-slate-400 mt-1 flex flex-wrap gap-3">
            {metadata.time && (
              <span>⏰ {metadata.time}</span>
            )}
            {metadata.date && (
              <span>📅 {metadata.date}</span>
            )}
            {metadata.priority && (
              <span>🎯 {metadata.priority}</span>
            )}
            {metadata.person && (
              <span>👤 {metadata.person}</span>
            )}
          </div>
        )}
      </div>

      {/* Type Badge */}
      <div className={`
        text-xs px-2 py-1 rounded-full
        ${getTypeColor()}
        animate-fade-in
      `} style={{ animationDelay: `${index * 150 + 200}ms` }}>
        {type}
      </div>
    </div>
  );
}
