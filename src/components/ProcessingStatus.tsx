import { useState, useEffect } from 'react';
import ProcessingBreakdown from './ProcessingBreakdown';

// Helper function to format time strings
function formatTime(timeStr: string): string {
  // Remove leading "at" if present
  timeStr = timeStr.replace(/^at\s+/, '');
  
  // Handle special cases
  if (timeStr.match(/midday|noon/i)) {
    return '12:00 PM';
  }

  // Extract hour, minute, and period
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return timeStr;

  let [_, hour, minute, period] = match;
  let hourNum = parseInt(hour);

  // Default to PM for times between 1-6 without AM/PM specified
  if (!period && hourNum >= 1 && hourNum <= 6) {
    period = 'pm';
  }

  // Convert to 12-hour format
  if (period?.toLowerCase() === 'pm' && hourNum < 12) {
    hourNum += 12;
  }
  if (period?.toLowerCase() === 'am' && hourNum === 12) {
    hourNum = 0;
  }

  // Format with leading zeros and minutes
  const formattedHour = (hourNum % 12 || 12).toString().padStart(2, '0');
  const formattedMinute = minute ? minute : '00';
  const formattedPeriod = hourNum >= 12 ? 'PM' : 'AM';

  return `${formattedHour}:${formattedMinute} ${formattedPeriod}`;
}

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
      location?: string;
      dueDate?: string;
      dueTime?: string;
      tags?: string[];
    } = {};

    // Extract time
    const timeMatch = item.text.match(/\b(?:at\s+)?(\d{1,2})(?::\d{2})?\s*(?:am|pm)\b/i);
    if (timeMatch) {
      metadata.time = formatTime(timeMatch[0].replace(/^at\s+/, ''));
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

      // Extract due date/time for tasks
      if (metadata.date) {
        metadata.dueDate = metadata.date;
        delete metadata.date;
      }
      if (metadata.time) {
        metadata.dueTime = metadata.time;
        delete metadata.time;
      }
    }

    // Extract person for meetings
    const personMatch = item.text.match(/\b(?:meet|meeting|with)\s+(\w+)\b/i);
    if (personMatch) {
      metadata.person = personMatch[1];
    }

    // Extract location
    const locationMatch = item.text.match(/\b(?:at|in)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b(?!\s+(?:am|pm))/i);
    if (locationMatch && locationMatch[1] !== metadata.person) {
      metadata.location = locationMatch[1];
    }

    // Extract tags for notes
    if (item.type === 'note') {
      const words = item.text.toLowerCase().split(/\s+/);
      const tags = words.filter(word => 
        word.length > 3 && 
        !['with', 'the', 'and', 'for', 'that', 'this', 'have', 'from'].includes(word)
      ).slice(0, 3);
      if (tags.length > 0) {
        metadata.tags = tags;
      }
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
                <div className="mt-3 pl-4 pt-3 border-t border-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {thought.type === 'event' && (
                      <>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                          Time: {thought.metadata?.time ? formatTime(thought.metadata.time) : '-'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                          Date: {thought.metadata?.date || '-'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                          With: {thought.metadata?.person || '-'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                          Location: {thought.metadata?.location || '-'}
                        </span>
                      </>
                    )}
                    {thought.type === 'task' && (
                      <>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                          Priority: {thought.metadata?.priority || 'medium'}
                        </span>
                        {thought.metadata?.dueDate && (
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                            Due: {thought.metadata.dueDate}
                            {thought.metadata.dueTime ? ` at ${formatTime(thought.metadata.dueTime)}` : ''}
                          </span>
                        )}
                      </>
                    )}
                    {thought.type === 'note' && thought.metadata?.tags && (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 text-slate-400">
                        Tags: {thought.metadata.tags.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
