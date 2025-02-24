import { useState, useEffect } from 'react';
import ProcessingBreakdown from './ProcessingBreakdown';

interface ProcessingStatusProps {
  transcribedText: string;
  segments?: string[];
  foundItems: Array<{
    type: 'task' | 'event' | 'note';
    text: string;
  }>;
}

export default function ProcessingStatus({ transcribedText, segments = [], foundItems }: ProcessingStatusProps) {
  const [processedThoughts, setProcessedThoughts] = useState<Array<{
    type: 'task' | 'event' | 'note';
    text: string;
    metadata?: any;
  }>>([]);

  useEffect(() => {
    setProcessedThoughts(
      foundItems.map(item => ({
        ...item,
        metadata: getMetadata(item)
      }))
    );
  }, [foundItems]);

  // Extract metadata from text
  const getMetadata = (item: { type: string; text: string }) => {
    const metadata: {
      time?: string;
      date?: string;
      priority?: string;
      person?: string;
    } = {};

    // Extract time
    const timeMatch = item.text.match(/\b(?:at\s+)?(\d{1,2})(?::\d{2})?\s*(?:am|pm)\b/i);
    if (timeMatch) {
      metadata.time = timeMatch[0].replace(/^at\s+/, '');
    }

    // Extract date
    const dateMatch = item.text.match(/\b(?:tomorrow|today|tonight|\b(?:next\s+)?(?:mon|tues|wednes|thurs|fri|satur|sun)day)\b/i);
    if (dateMatch) {
      metadata.date = dateMatch[0];
    }

    // Extract priority for tasks
    if (item.type === 'task') {
      if (item.text.match(/\b(?:urgent|asap|important)\b/i)) {
        metadata.priority = 'high';
      } else {
        metadata.priority = 'medium';
      }
    }

    // Extract person for meetings
    const personMatch = item.text.match(/\b(?:meet|meeting|with)\s+(\w+)\b/i);
    if (personMatch) {
      metadata.person = personMatch[1];
    }

    return metadata;
  };

  return (
    <div className="mt-4 space-y-6">
      {/* Processing Steps */}
      {segments.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 animate-fade-up">
          <div className="text-sm font-medium text-slate-400 mb-4">Processing Steps:</div>
          <div className="space-y-4">
            {segments.map((segment, i) => (
              <div
                key={i}
                className="relative"
              >
                {/* Step Number */}
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 -translate-x-full">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-mono text-slate-300 border border-slate-600">
                    {i + 1}
                  </div>
                </div>

                {/* Step Content */}
                <div 
                  className="bg-slate-700/30 rounded-lg p-4 border-l-4 border-yellow-500/50 animate-fade-up"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-slate-300 font-mono">{segment}</div>
                      <div className="mt-2 flex gap-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                          Step {i + 1}
                        </span>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                          {i === 0 ? 'Transcribing' : i === segments.length - 1 ? 'Finalizing' : 'Processing'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Results */}
      {processedThoughts.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 animate-fade-up">
          <div className="text-sm font-medium text-slate-400 mb-4">Processed Results:</div>
          <div className="space-y-4">
            {processedThoughts.map((thought, i) => (
              <div
                key={i}
                className="bg-slate-700/30 rounded-lg p-4 border-l-4 border-green-500/50 animate-fade-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Result Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`
                    w-2 h-2 rounded-full
                    ${thought.type === 'task' ? 'bg-blue-500' : 
                      thought.type === 'event' ? 'bg-purple-500' : 
                      'bg-green-500'}
                  `} />
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800/50 text-slate-300">
                    {thought.type}
                  </span>
                  {thought.metadata?.time && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800/50 text-slate-300">
                      {thought.metadata.time}
                    </span>
                  )}
                </div>

                {/* Result Content */}
                <div className="text-sm text-slate-300 font-mono pl-4 border-l border-slate-600">
                  {thought.text}
                </div>

                {/* Result Metadata */}
                {thought.metadata && Object.keys(thought.metadata).length > 0 && (
                  <div className="mt-3 pl-4 pt-3 border-t border-slate-700">
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(thought.metadata) as [string, string | undefined][]).map(([key, value]) => 
                        value ? (
                          <span key={key} className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                            {key}: {value}
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
