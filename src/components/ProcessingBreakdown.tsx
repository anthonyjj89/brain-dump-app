import { useState, useEffect } from 'react';
import MiniCard from './shared/MiniCard';

interface ProcessingBreakdownProps {
  originalText: string;
  segments: string[];
  thoughts: Array<{
    type: 'task' | 'event' | 'note';
    text: string;
    metadata?: {
      time?: string;
      date?: string;
      priority?: string;
      person?: string;
    };
  }>;
}

export default function ProcessingBreakdown({ originalText, segments, thoughts }: ProcessingBreakdownProps) {
  const [processedSegments, setProcessedSegments] = useState<string[]>([]);
  const [showThoughts, setShowThoughts] = useState(false);

  // Reset state when original text changes
  useEffect(() => {
    setProcessedSegments([]);
    setShowThoughts(false);
  }, [originalText]);

  // Process segments one by one
  useEffect(() => {
    if (segments.length > processedSegments.length) {
      const nextSegment = segments[processedSegments.length];
      const timer = setTimeout(() => {
        setProcessedSegments(prev => [...prev, nextSegment]);
      }, 200);
      return () => clearTimeout(timer);
    } else if (segments.length > 0 && processedSegments.length === segments.length) {
      // Show thoughts after all segments are processed
      const timer = setTimeout(() => setShowThoughts(true), 300);
      return () => clearTimeout(timer);
    }
  }, [segments, processedSegments]);

  return (
    <div className="
      bg-slate-800/50 backdrop-blur
      rounded-xl p-6 space-y-6
      border border-slate-700/50
      max-w-[600px] mx-auto
    ">
      {/* Original Text - Show immediately */}
      <div className="animate-fade-in">
        <div className="text-sm font-medium text-slate-400 mb-2">Voice Input:</div>
        <div className="
          text-gray-300 font-mono
          border-l-2 border-blue-500/50
          pl-4 py-2
          bg-slate-800/30 rounded-lg
          animate-type-in
        ">
          &quot;{originalText}&quot;
        </div>
      </div>

      {/* Segments - Add progressively */}
      {processedSegments.length > 0 && (
        <div className="animate-fade-in">
          <div className="text-sm font-medium text-slate-400 mb-2">Processing Steps:</div>
          <div className="space-y-2">
            {processedSegments.map((segment, i) => (
              <div
                key={i}
                className="
                  bg-slate-700/30 rounded-lg p-3
                  border-l-2 border-yellow-500/50
                  transform hover:scale-[1.02] transition-all
                  flex items-start gap-3
                  animate-fade-up
                "
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="
                  text-xs font-mono text-slate-500
                  bg-slate-800/50 rounded px-2 py-1
                  min-w-[2rem] text-center
                ">
                  {i + 1}
                </div>
                <div className="text-sm text-slate-300 flex-1">
                  {segment}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Thoughts - Show after segments */}
      {showThoughts && (
        <div className="animate-fade-up">
          <div className="text-sm font-medium text-slate-400 mb-2">Processed Results:</div>
          <div className="space-y-2">
            {thoughts.map((thought, i) => (
              <MiniCard
                key={i}
                {...thought}
                index={i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
