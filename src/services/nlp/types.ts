/**
 * NLP Service Types
 */

export type ThoughtType = 'task' | 'event' | 'note' | 'uncertain';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ProcessingStrategy = 'rule-based' | 'nlp-library' | 'llm' | 'fallback';

export interface TimeInfo {
  time?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  isSpecific: boolean;
}

export interface PersonInfo {
  name: string;
  role?: string;
}

export interface LocationInfo {
  name: string;
  type?: string;
}

export interface TaskContent {
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority?: string;
  details?: string;
}

export interface EventContent {
  title: string;
  time?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  person?: string;
  location?: string;
  details?: string;
}

export interface NoteContent {
  title: string;
  tags?: string[];
  details?: string;
}

export interface UncertainContent {
  title: string;
  suggestedDate?: string;
  suggestedAction?: string;
  details?: string;
}

export type ProcessedContent = TaskContent | EventContent | NoteContent | UncertainContent;

export interface Thought {
  thoughtType: ThoughtType;
  confidence: ConfidenceLevel;
  possibleTypes?: ThoughtType[];
  processedContent: ProcessedContent;
}

export interface ProcessingMetadata {
  processingTime: number;
  strategy: ProcessingStrategy;
  originalText?: string;
  confidence: number;
}

export interface ProcessingResult {
  thoughts: Thought[];
  metadata: ProcessingMetadata;
}

export interface NLPServiceOptions {
  useLLM?: boolean;
  confidenceThreshold?: number;
  deduplicateResults?: boolean;
}
