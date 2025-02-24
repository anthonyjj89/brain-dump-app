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

  // First extract meetings
  const meetings = extractMeetings(text);
  const meetingStrings = meetings.map(meeting => {
    let thought = `meeting with ${meeting.person}`;
    if (meeting.date) thought += ` ${meeting.date}`;
    if (meeting.time) thought += ` at ${meeting.time}`;
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
function normalizeTime(timeStr: string): string {
  if (timeStr.match(/midday|noon/i)) {
    return '12pm';
  }
  // Add pm if no am/pm specified
  if (!timeStr.match(/am|pm/i)) {
    return `${timeStr}pm`;
  }
  return timeStr;
}

function extractMeetings(text: string): Meeting[] {
  const meetings: Meeting[] = [];
  let lastDate: string | undefined;

  // Split by conjunctions and commas
  const segments = text.split(/(?:\s*,\s*|\s+and\s+|\s*\.\s*)/);

  for (const segment of segments) {
    if (!segment.trim()) continue;

    // Update shared date context
    const date = extractDate(segment);
    if (date) lastDate = date;

    // Pattern 1: "meeting tomorrow at X with Person"
    const pattern1 = segment.match(/(?:meeting|meet)(?:\s+(?:tomorrow|today|next))?\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|midday|noon)\s+with\s+([A-Z][a-z]+)/i);
    if (pattern1) {
      const [_, time, person] = pattern1;
      meetings.push({
        context: segment,
        person,
        time: normalizeTime(time),
        date: lastDate
      });
      continue;
    }

    // Pattern 2: "meeting with Person at Time"
    const pattern2 = segment.match(/(?:meeting|meet)\s+with\s+([A-Z][a-z]+)(?:\s+(?:tomorrow|today|next))?\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|midday|noon)/i);
    if (pattern2) {
      const [_, person, time] = pattern2;
      meetings.push({
        context: segment,
        person,
        time: normalizeTime(time),
        date: lastDate
      });
      continue;
    }

    // Pattern 3: "X with Person"
    const pattern3 = segment.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|midday|noon)\s+with\s+([A-Z][a-z]+)/i);
    if (pattern3) {
      const [_, time, person] = pattern3;
      meetings.push({
        context: segment,
        person,
        time: normalizeTime(time),
        date: lastDate
      });
      continue;
    }

    // Pattern 4: "Person at Time"
    const pattern4 = segment.match(/([A-Z][a-z]+)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|midday|noon)/i);
    if (pattern4) {
      const [_, person, time] = pattern4;
      meetings.push({
        context: segment,
        person,
        time: normalizeTime(time),
        date: lastDate
      });
      continue;
    }

    // Pattern 5: Just a person with previous context
    const personMatch = segment.match(/(?:with\s+)?([A-Z][a-z]+)(?:\s+(?:tomorrow|today|next))?/i);
    if (personMatch && meetings.length > 0) {
      const [_, person] = personMatch;
      const prevMeeting = meetings[meetings.length - 1];
      if (prevMeeting.time && !prevMeeting.person) {
        prevMeeting.person = person;
      }
    }

    // Pattern 6: Just a time with previous context
    const timeMatch = extractTime(segment);
    if (timeMatch && meetings.length > 0 && !meetings[meetings.length - 1].time) {
      meetings[meetings.length - 1].time = timeMatch;
    }
  }

  return meetings;
}

/**
 * Extract a single time reference from text
 */
function extractTime(text: string): string | undefined {
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
function extractDate(text: string): string | undefined {
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
