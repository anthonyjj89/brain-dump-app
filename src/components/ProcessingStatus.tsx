import { useState, useEffect } from 'react';
import ProcessingBreakdown from './ProcessingBreakdown';

interface ProcessingStatusProps {
  transcribedText: string;
  foundItems: Array<{
    type: 'task' | 'event' | 'note';
    text: string;
  }>;
}

export default function ProcessingStatus({ transcribedText, foundItems }: ProcessingStatusProps) {
  // Keep track of last processed text
  const [lastProcessed, setLastProcessed] = useState<{
    text: string;
    segments: string[];
    thoughts: Array<{
      type: 'task' | 'event' | 'note';
      text: string;
      metadata?: any;
    }>;
  } | null>(null);

  useEffect(() => {
    if (transcribedText && foundItems.length > 0) {
      setLastProcessed({
        text: transcribedText,
        segments: transcribedText
          .split(/(?:,|\sand\s|\.|!|\?)+/)
          .map(s => s.trim())
          .filter(Boolean),
        thoughts: foundItems.map(item => ({
          ...item,
          metadata: getMetadata(item)
        }))
      });
    }
  }, [transcribedText, foundItems]);

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

  // Get segments from transcribed text
  const segments = transcribedText
    .split(/(?:,|\sand\s|\.|!|\?)+/)
    .map(s => s.trim())
    .filter(Boolean);

  // Add metadata to thoughts
  const thoughts = foundItems.map(item => ({
    ...item,
    metadata: getMetadata(item)
  }));

  return (
    <div className="mt-4">
      {lastProcessed ? (
        <ProcessingBreakdown
          originalText={lastProcessed.text}
          segments={lastProcessed.segments}
          thoughts={lastProcessed.thoughts}
        />
      ) : (
        <div className="
          bg-slate-800/50 backdrop-blur
          rounded-xl p-6
          border border-slate-700/50
          text-center text-slate-400
        ">
          No voice input processed yet
        </div>
      )}
    </div>
  );
}
