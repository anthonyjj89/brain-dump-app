import { TimeProcessor } from './time';
import { EntityProcessor } from './entities';
import { 
  Thought, 
  ProcessingResult, 
  ThoughtType, 
  ConfidenceLevel, 
  NLPServiceOptions,
  ProcessingStrategy
} from './types';

/**
 * NLP Service for processing text input and extracting structured thoughts
 */
export class NLPService {
  private timeProcessor: TimeProcessor;
  private entityProcessor: EntityProcessor;
  private options: NLPServiceOptions;
  
  constructor(options: NLPServiceOptions = {}) {
    this.timeProcessor = new TimeProcessor();
    this.entityProcessor = new EntityProcessor();
    this.options = {
      useLLM: options.useLLM ?? true,
      confidenceThreshold: options.confidenceThreshold ?? 0.7,
      deduplicateResults: options.deduplicateResults ?? true
    };
  }
  
  /**
   * Process text input and extract structured thoughts
   */
  async process(text: string): Promise<ProcessingResult> {
    const startTime = performance.now();
    
    // Clean the text
    const cleanedText = this.cleanText(text);
    
    // Split into sentences
    const sentences = this.splitIntoSentences(cleanedText);
    
    // Process each sentence
    const thoughts: Thought[] = [];
    
    for (const sentence of sentences) {
      const sentenceThoughts = await this.processSentence(sentence);
      thoughts.push(...sentenceThoughts);
    }
    
    // Deduplicate thoughts if needed
    const finalThoughts = this.options.deduplicateResults 
      ? this.deduplicateThoughts(thoughts)
      : thoughts;
    
    return {
      thoughts: finalThoughts,
      metadata: {
        processingTime: performance.now() - startTime,
        strategy: 'nlp-library',
        originalText: text,
        confidence: this.calculateOverallConfidence(finalThoughts)
      }
    };
  }
  
  /**
   * Process a single sentence
   */
  private async processSentence(sentence: string): Promise<Thought[]> {
    // Extract time information
    const timeInfo = this.timeProcessor.extractTimeInfo(sentence);
    
    // Extract entities
    const entities = this.entityProcessor.extractEntities(sentence);
    
    // Determine thought type
    const { thoughtType, confidence } = this.determineThoughtType(sentence, timeInfo.isSpecific);
    
    // Create thought based on type
    if (thoughtType === 'event') {
      return [{
        thoughtType,
        confidence,
        processedContent: {
          title: this.generateTitle(sentence, thoughtType),
          time: timeInfo.time,
          date: timeInfo.date,
          startTime: timeInfo.startTime,
          endTime: timeInfo.endTime,
          person: entities.people.length > 0 ? entities.people[0].name : undefined,
          location: entities.locations.length > 0 ? entities.locations[0].name : undefined
        }
      }];
    } else if (thoughtType === 'task') {
      return [{
        thoughtType,
        confidence,
        processedContent: {
          title: this.generateTitle(sentence, thoughtType),
          dueDate: timeInfo.date,
          dueTime: timeInfo.time,
          priority: this.determinePriority(sentence)
        }
      }];
    } else {
      return [{
        thoughtType,
        confidence,
        processedContent: {
          title: this.generateTitle(sentence, thoughtType),
          details: sentence
        }
      }];
    }
  }
  
  /**
   * Clean text by removing filler words and normalizing
   */
  private cleanText(text: string): string {
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
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Split by punctuation but preserve the structure
    return text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);
  }
  
  /**
   * Determine the thought type based on content
   */
  private determineThoughtType(text: string, hasTimeInfo: boolean): { 
    thoughtType: ThoughtType; 
    confidence: ConfidenceLevel 
  } {
    // Check for task indicators
    if (this.hasTaskIndicators(text)) {
      return { 
        thoughtType: 'task', 
        confidence: this.hasStrongTaskIndicators(text) ? 'high' : 'medium' 
      };
    }
    
    // Check for event indicators
    if (this.hasEventIndicators(text) || hasTimeInfo) {
      return { 
        thoughtType: 'event', 
        confidence: this.hasStrongEventIndicators(text) || hasTimeInfo ? 'high' : 'medium' 
      };
    }
    
    // Default to note
    return { thoughtType: 'note', confidence: 'medium' };
  }
  
  /**
   * Check if text has task indicators
   */
  private hasTaskIndicators(text: string): boolean {
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
   * Check if text has strong task indicators
   */
  private hasStrongTaskIndicators(text: string): boolean {
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
   * Check if text has event indicators
   */
  private hasEventIndicators(text: string): boolean {
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
   * Check if text has strong event indicators
   */
  private hasStrongEventIndicators(text: string): boolean {
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
   * Generate a title for the thought
   */
  private generateTitle(text: string, type: ThoughtType): string {
    // For tasks, extract the verb-noun pair
    if (type === 'task') {
      const match = text.match(/\b(create|make|finish|complete|do|send|update|fix|add|remove|write|check|review)\s+([a-z]+(?:\s+[a-z]+)?)/i);
      if (match) {
        return match[0].charAt(0).toUpperCase() + match[0].slice(1);
      }
    }
    
    // For events, extract the event type
    if (type === 'event') {
      if (text.toLowerCase().includes('meeting')) {
        return 'Meeting';
      }
      if (text.toLowerCase().includes('appointment')) {
        return 'Appointment';
      }
      if (text.toLowerCase().includes('call')) {
        return 'Call';
      }
    }
    
    // Default: use the first part of the text
    const firstSentence = text.split(/[.!?]/)[0].trim();
    if (firstSentence.length <= 50) {
      return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
    }
    
    // If the first sentence is too long, truncate it
    return firstSentence.substring(0, 47) + '...';
  }
  
  /**
   * Determine priority for tasks
   */
  private determinePriority(text: string): string {
    if (/\b(?:urgent|asap|immediately|critical|high priority)\b/i.test(text)) {
      return 'high';
    }
    if (/\b(?:low priority|whenever|if you have time|not urgent)\b/i.test(text)) {
      return 'low';
    }
    return 'medium';
  }
  
  /**
   * Deduplicate thoughts
   */
  private deduplicateThoughts(thoughts: Thought[]): Thought[] {
    const uniqueThoughts: Thought[] = [];
    
    for (const thought of thoughts) {
      // Check if we already have a similar thought
      const similarThought = uniqueThoughts.find(t => 
        t.thoughtType === thought.thoughtType && 
        this.areSimilarTitles(
          t.processedContent.title || '', 
          thought.processedContent.title || ''
        )
      );
      
      if (!similarThought) {
        uniqueThoughts.push(thought);
      } else {
        // Merge the thoughts, keeping the one with higher confidence
        if (thought.confidence === 'high' && similarThought.confidence !== 'high') {
          // Replace the existing thought with the new one
          const index = uniqueThoughts.indexOf(similarThought);
          uniqueThoughts[index] = thought;
        }
      }
    }
    
    return uniqueThoughts;
  }
  
  /**
   * Check if two titles are similar
   */
  private areSimilarTitles(title1: string, title2: string): boolean {
    // Normalize titles
    const normalize = (title: string) => 
      title.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const normalizedTitle1 = normalize(title1);
    const normalizedTitle2 = normalize(title2);
    
    // Check for exact match
    if (normalizedTitle1 === normalizedTitle2) {
      return true;
    }
    
    // Check if one is a substring of the other
    if (normalizedTitle1.includes(normalizedTitle2) || 
        normalizedTitle2.includes(normalizedTitle1)) {
      return true;
    }
    
    // Calculate word overlap
    const words1 = normalizedTitle1.split(' ');
    const words2 = normalizedTitle2.split(' ');
    
    const commonWords = words1.filter(word => 
      words2.includes(word) && word.length > 3
    );
    
    // If there are at least 2 common words, consider them similar
    return commonWords.length >= 2;
  }
  
  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(thoughts: Thought[]): number {
    if (thoughts.length === 0) {
      return 0;
    }
    
    const confidenceMap = {
      'high': 1,
      'medium': 0.7,
      'low': 0.4
    };
    
    const totalConfidence = thoughts.reduce((sum, thought) => {
      return sum + confidenceMap[thought.confidence];
    }, 0);
    
    return totalConfidence / thoughts.length;
  }
}
