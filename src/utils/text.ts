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
 * Format time to consistent 12-hour format
 */
export function formatTime(timeStr: string): string {
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

  // Default to AM for times between 7-11 without AM/PM specified
  if (!period) {
    period = hourNum >= 7 && hourNum <= 11 ? 'am' : 'pm';
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

/**
 * Split text into separate thoughts based on tasks and meetings
 */
export function splitIntoThoughts(text: string): string[] {
  // Clean up speech patterns first
  text = cleanSpeech(text);

  // First extract meetings
  const meetings = extractMeetings(text);
  const meetingStrings = meetings.map(meeting => {
    let thought = 'meeting';
    if (meeting.person) thought += ` with ${meeting.person}`;
    if (meeting.time) thought += ` at ${meeting.time}`;
    if (meeting.date) thought += ` ${meeting.date}`;
    return thought;
  });

  // Then extract standalone tasks (excluding meeting parts)
  const meetingParts = meetings.map(m => m.context).join('|');
  const meetingRegex = meetingParts ? new RegExp(`(?:${meetingParts})`, 'g') : null;
  const textWithoutMeetings = meetingRegex ? text.replace(meetingRegex, '') : text;

  const tasks = textWithoutMeetings
    .split(/(?:,|\sand\s|\.|!|\?)+/g)
    .map(task => task.trim())
    .filter(task => {
      return task && 
        !task.toLowerCase().includes('meeting') &&
        !task.toLowerCase().includes('meet with');
    })
    .map(task => {
      // Remove leading task indicators and clean speech patterns
      return cleanSpeech(task.replace(/^(?:need to|have to|must|should)\s+/i, ''));
    });

  return [...tasks, ...meetingStrings].filter(Boolean);
}

/**
 * Extract meeting information from text
 */
export function extractMeetings(text: string): Meeting[] {
  const meetings: Meeting[] = [];
  let lastDate: string | undefined;

  // Split by major punctuation first
  const segments = text.split(/(?:[.!?])+/);

  for (const segment of segments) {
    if (!segment.trim()) continue;

    // Update shared date context
    const date = extractDate(segment);
    if (date) lastDate = date;

    // Extract all times in the segment
    const timeMatches = Array.from(segment.matchAll(/\b(?:at\s+)?(\d{1,2})(?::\d{2})?\s*(?:am|pm)?\b/gi));
    const times = timeMatches.map(match => formatTime(match[0]));

    // Extract person names
    const personMatches = segment.match(/\b(?:with\s+)(\w+)(?:\s|$)/i);
    const person = personMatches ? personMatches[1] : undefined;

    // If we have both time and person, it's likely a meeting
    if (times.length > 0 && person) {
      times.forEach(time => {
        meetings.push({
          context: segment.trim(),
          time,
          person,
          date: lastDate
        });
      });
      continue;
    }

    // Look for meeting keywords
    if (segment.toLowerCase().includes('meeting') || segment.toLowerCase().includes('meet with')) {
      const time = times[0];
      meetings.push({
        context: segment.trim(),
        time: time || '',
        person: person || '',
        date: lastDate
      });
    }
  }

  return meetings;
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
  const hasMeetingPerson = /\b(?:meet|meeting|with)\s+\w+\b/i.test(text) &&
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
