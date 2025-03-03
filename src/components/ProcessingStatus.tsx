import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

  const getThoughtTypeColor = (type: string) => {
    switch(type) {
      case 'task': return 'info';
      case 'event': return 'secondary';
      case 'note': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="mt-4 space-y-6">
      {/* Processing Steps */}
      {segments.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {segments.map((segment, i) => (
              <div key={i} className="relative pl-10">
                {/* Step Number */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-muted text-muted-foreground border">
                    {i + 1}
                  </div>
                </div>

                {/* Step Content */}
                <div 
                  className="p-4 rounded-md border bg-card/50 animate-fade-in"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="text-sm text-muted-foreground mb-2">{segment}</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Step {i + 1}</Badge>
                    <Badge variant="secondary">
                      {i === 0 ? 'Transcribing' : i === segments.length - 1 ? 'Finalizing' : 'Processing'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Processed Results */}
      {processedThoughts.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {processedThoughts.map((thought, i) => (
              <div
                key={i}
                className="p-4 border rounded-md bg-card animate-fade-in"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* Result Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={getThoughtTypeColor(thought.type)}>
                    {thought.type.charAt(0).toUpperCase() + thought.type.slice(1)}
                  </Badge>
                  
                  {thought.metadata?.time && (
                    <Badge variant="outline">{thought.metadata.time}</Badge>
                  )}
                </div>

                {/* Result Content */}
                <div className="text-sm pl-2 border-l-2 border-primary/20 py-1">
                  {thought.text}
                </div>

                {/* Result Metadata */}
                {(thought.metadata && Object.keys(thought.metadata).length > 0) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      {thought.type === 'event' && (
                        <>
                          {thought.metadata?.time && (
                            <Badge variant="outline">Time: {formatTime(thought.metadata.time)}</Badge>
                          )}
                          {thought.metadata?.date && (
                            <Badge variant="outline">Date: {thought.metadata.date}</Badge>
                          )}
                          {thought.metadata?.person && (
                            <Badge variant="outline">With: {thought.metadata.person}</Badge>
                          )}
                          {thought.metadata?.location && (
                            <Badge variant="outline">Location: {thought.metadata.location}</Badge>
                          )}
                        </>
                      )}
                      {thought.type === 'task' && (
                        <>
                          {thought.metadata?.priority && (
                            <Badge 
                              variant={thought.metadata.priority === 'high' ? 'destructive' : 'default'}
                            >
                              {thought.metadata.priority} priority
                            </Badge>
                          )}
                          {thought.metadata?.dueDate && (
                            <Badge variant="outline">
                              Due: {thought.metadata.dueDate}
                              {thought.metadata.dueTime ? ` at ${formatTime(thought.metadata.dueTime)}` : ''}
                            </Badge>
                          )}
                        </>
                      )}
                      {thought.type === 'note' && thought.metadata?.tags && (
                        <div className="flex flex-wrap gap-1">
                          {thought.metadata.tags.map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary">#{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
