interface Meeting {
  context: string;
  time: string;
  person: string;
  date?: string;
}

/**
 * Clean up speech patterns and filler words
 */
function cleanSpeech(text: string): string {
  return text
    // Remove speech fillers at start
    .replace(/^(?:so|well|okay|um|uh|like|yeah|hey)\s+/gi, '')
    // Remove personal context
    .replace(/^(?:i\s+(?:need|have|want|should|must|going|am\s+going)\s+to|i\s+(?:am|was)\s+(?:going\s+)?to|let'?s|we\s+(?:need|have|should))\s+/gi, '')
    // Clean up remaining text
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into separate thoughts based on tasks and meetings
 */
export function splitIntoThoughts(text: string): string[] {
  // Clean up speech patterns first
  text = cleanSpeech(text);

  // Split by major punctuation first
  const segments = text.split(/(?:[.!?])+/).filter(Boolean);
  const thoughts: string[] = [];

  for (const segment of segments) {
    // Split by "and" and commas, but keep meeting parts together
    const parts = segment
      .split(/(?:,|\sand\s)+/)
      .map(part => part.trim())
      .filter(Boolean);

    for (const part of parts) {
      // Check if this part contains meeting information
      if (part.toLowerCase().includes('meeting') || part.toLowerCase().includes('meet with')) {
        // Try to find a time in nearby parts
        const timeMatch = extractTime(part) || parts.find(p => extractTime(p));
        const dateMatch = extractDate(part) || parts.find(p => extractDate(p));
        
        let meetingText = part;
        if (timeMatch && !part.includes(timeMatch)) {
          meetingText += ` at ${timeMatch}`;
        }
        if (dateMatch && !part.includes(dateMatch)) {
          meetingText += ` ${dateMatch}`;
        }
        
        thoughts.push(meetingText);
      } else if (hasTaskIndicators(part) || !hasEventIndicators(part)) {
        // If it's not a meeting and has task indicators or no event indicators,
        // treat it as a standalone task/note
        thoughts.push(cleanSpeech(part.replace(/^(?:need to|have to|must|should)\s+/i, '')));
      }
    }
  }

  return thoughts.filter(Boolean);
}

/**
 * Extract meeting information from text
 */
function normalizeTime(timeStr: string): string {
  if (timeStr.match(/midday|noon/i)) {
    return '12pm';
  }
  // Add pm if no am/pm specified and hour is less than 12
  if (!timeStr.match(/am|pm/i)) {
    const hour = parseInt(timeStr);
    return hour < 12 ? `${timeStr}am` : `${timeStr}pm`;
  }
  return timeStr;
}

function extractMeetings(text: string): Meeting[] {
  const meetings: Meeting[] = [];
  let lastDate: string | undefined;

  // Split by major punctuation first
  const segments = text.split(/(?:[.!?])+/);

  for (const segment of segments) {
    if (!segment.trim()) continue;

    // Update shared date context
    const date = extractDate(segment);
    if (date) lastDate = date;

    // Look for meeting patterns
    const meetingMatch = segment.match(/(?:meeting|meet)(?:\s+(?:tomorrow|today|next|\w+day))?\s*(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|midday|noon)?(?:\s+with\s+([A-Z][a-z]+))?/i);
    
    if (meetingMatch) {
      const [fullMatch, time, person] = meetingMatch;
      
      // Look for date in the same segment if not found earlier
      const meetingDate = date || extractDate(segment);
      
      // Look for time in the same segment if not found in the pattern
      const meetingTime = time ? normalizeTime(time) : extractTime(segment);

      meetings.push({
        context: segment.trim(),
        person: person || '',
        time: meetingTime || '',
        date: meetingDate
      });
    }
  }

  return meetings;
}

/**
 * Extract a single time reference from text
 */
export function extractTime(text: string): string | undefined {
  // Match patterns like:
  // "2pm", "at 2pm", "2:00pm"
  // "at 2", "at 2:00"
  // "midday", "noon"
  const timeMatch = text.match(/\b(?:at\s+)?(\d{1,2})(?::\d{2})?\s*(?:am|pm)?\b|(?:midday|noon)\b/i);
  
  if (!timeMatch) return undefined;
  
  // Get the full time match
  let time = timeMatch[0].replace(/^at\s+/, '');
  
  // Handle special cases
  if (time.match(/midday|noon/i)) {
    time = '12pm';
  } else {
    // Add am/pm if missing
    time = time.match(/am|pm/i) ? time : `${time}pm`;
  }
  
  return time;
}

/**
 * Extract date references from text
 */
export function extractDate(text: string): string | undefined {
  // Match patterns like:
  // "tomorrow", "today", "tonight"
  // "on Monday", "next Tuesday"
  const dateMatch = text.match(/\b(?:tomorrow|today|tonight|\b(?:next\s+)?(?:mon|tues|wednes|thurs|fri|satur|sun)day)\b/i);
  
  return dateMatch ? dateMatch[0] : undefined;
}

/**
 * Check if text contains strong time/date indicators that definitely make it an event
 */
export function hasStrongEventIndicators(text: string): boolean {
  // Clean text first
  text = cleanSpeech(text);

  // Specific time patterns (e.g., "at 10am", "at 3:30pm")
  const hasSpecificTime = /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)\b/.test(text) ||
                         /\b(?:at|on)\s+\d{1,2}(?::\d{2})?\b/.test(text);

  // Specific date patterns (e.g., "on Monday", "next Tuesday at")
  const hasSpecificDate = /\b(?:on\s+)?(?:mon|tues|wednes|thurs|fri|satur|sun)day\b/i.test(text) &&
                         /\b(?:at|from|until)\b/i.test(text);

  // Calendar event indicators
  const hasEventWords = /\b(?:meeting|appointment|call|session|interview)\b/i.test(text) &&
                       /\b(?:at|from|scheduled|tomorrow|today)\b/i.test(text);

  // Meeting with person
  const hasMeetingPerson = /\b(?:meet|meeting|with)\s+[A-Z][a-z]+\b/i.test(text) &&
                          /\b(?:at|tomorrow|today)\b/i.test(text);

  return hasSpecificTime || hasSpecificDate || hasEventWords || hasMeetingPerson;
}

/**
 * Check if text contains strong action indicators that definitely make it a task
 */
export function hasStrongTaskIndicators(text: string): boolean {
  // Clean text first
  text = cleanSpeech(text);

  // Action verbs at start of sentence
  const startsWithAction = /^(?:create|make|finish|complete|do|send|update|fix|add|remove|write|check|review)\b/i.test(text);

  // Clear task phrases
  const hasTaskPhrase = /\b(?:need to|have to|must|should|todo|to-do)\b/i.test(text) &&
                       !/\b(?:meeting|appointment|scheduled)\b/i.test(text);

  // Assignment/work indicators
  const hasWorkIndicators = /\b(?:assign|task|project|deadline)\b/i.test(text) &&
                           !/\b(?:at|scheduled for)\b/i.test(text);

  return startsWithAction || hasTaskPhrase || hasWorkIndicators;
}

/**
 * Check if text contains general task-like words (used for uncertainty check)
 */
export function hasTaskIndicators(text: string): boolean {
  // Clean text first
  text = cleanSpeech(text);

  const taskWords = [
    'do', 'make', 'create', 'finish', 'complete',
    'fix', 'update', 'change', 'add', 'remove',
    'send', 'write', 'read', 'review', 'check',
    'need to', 'have to', 'must', 'should',
    'assign', 'work on', 'implement'
  ];
  return taskWords.some(word => text.toLowerCase().includes(word));
}

/**
 * Check if text contains general time/date indicators (used for uncertainty check)
 */
export function hasEventIndicators(text: string): boolean {
  // Clean text first
  text = cleanSpeech(text);

  const timeWords = [
    'at', 'on', 'tomorrow', 'today', 'tonight',
    'morning', 'afternoon', 'evening', 'night',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
    'saturday', 'sunday', 'next week', 'next month',
    'scheduled', 'meeting', 'appointment'
  ];
  return timeWords.some(word => text.toLowerCase().includes(word));
}

/**
 * Helper to determine if text might be uncertain between task/event
 */
export function isUncertainType(text: string): boolean {
  // Clean text first
  text = cleanSpeech(text);

  // If we have strong indicators, it's not uncertain
  if (hasStrongEventIndicators(text)) return false;
  if (hasStrongTaskIndicators(text)) return false;

  // Only uncertain if it has both task and event indicators
  // but neither is strong enough to be definitive
  const hasTask = hasTaskIndicators(text);
  const hasEvent = hasEventIndicators(text);
  return hasTask && hasEvent;
}
