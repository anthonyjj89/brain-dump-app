# Phase 1: Rule-Based Processing

## Overview
Improve the app's natural language processing capabilities by implementing a robust rule-based processing system that handles common cases efficiently, reducing reliance on LLM processing.

## Goals
1. Create modular NLP service
2. Improve text processing accuracy
3. Implement deduplication
4. Add comprehensive tests

## Tasks

### 1. Create NLP Service Module
- [ ] Create `src/services/nlp/index.ts`
```typescript
// Basic structure
export class NLPService {
  async process(text: string): Promise<ProcessingResult> {
    // 1. Clean text
    // 2. Apply rules
    // 3. Check confidence
    // 4. Return result
  }
}
```

- [ ] Create service interfaces
```typescript
interface ProcessingResult {
  thoughts: Thought[];
  confidence: 'high' | 'low';
  metadata: {
    processingTime: number;
    strategy: 'rule-based' | 'llm';
  };
}
```

- [ ] Add dependency injection for strategies
```typescript
interface ProcessingStrategy {
  process(text: string): Promise<ProcessingResult>;
}
```

### 2. Update Text Processing

#### a. Task Detection
- [ ] Update verb patterns in `text.ts`
```typescript
const taskVerbs = [
  'make', 'do', 'create', 'finish', 'complete',
  'send', 'buy', 'get', 'prepare', 'clean',
  'update', 'check', 'review', 'tidy', 'brush'
];
```

- [ ] Add verb-noun pair detection
```typescript
function extractTaskPairs(text: string): string[] {
  // Example: "tidy plate" -> ["tidy", "plate"]
  const pattern = /\b(${taskVerbs.join('|')})\s+(\w+)\b/gi;
  return Array.from(text.matchAll(pattern));
}
```

#### b. Time Processing
- [ ] Improve time format handling
```typescript
function normalizeTime(time: string): string {
  // Handle formats:
  // - "9am", "9:00am", "9 am"
  // - "9 in the morning"
  // - "noon", "midnight"
  // Return: "09:00 AM"
}
```

#### c. Person Detection
- [ ] Enhance name extraction
```typescript
function extractPerson(text: string): string | null {
  // Handle formats:
  // - "with [Name]"
  // - "meet [Name]"
  // - "[Name] at [time]"
}
```

### 3. Implement Deduplication

#### a. Create Deduplication Service
- [ ] Create `src/services/deduplication/index.ts`
```typescript
export class DeduplicationService {
  findDuplicates(thoughts: Thought[]): Thought[][] {
    // Group similar thoughts
    // Calculate similarity scores
    // Return groups of duplicates
  }

  mergeDuplicates(duplicates: Thought[]): Thought {
    // Merge metadata
    // Preserve unique information
    // Return consolidated thought
  }
}
```

#### b. Add Similarity Scoring
- [ ] Implement scoring functions
```typescript
function calculateSimilarity(a: Thought, b: Thought): number {
  // Compare titles
  // Compare times
  // Compare metadata
  // Return score 0-1
}
```

### 4. Add Tests

#### a. Unit Tests
- [ ] Test text processing
```typescript
describe('Text Processing', () => {
  test('extracts tasks correctly', () => {
    const input = "tidy the plate and brush the cat";
    const tasks = extractTasks(input);
    expect(tasks).toEqual([
      { verb: 'tidy', object: 'plate' },
      { verb: 'brush', object: 'cat' }
    ]);
  });
});
```

- [ ] Test time normalization
```typescript
describe('Time Normalization', () => {
  test('handles various formats', () => {
    expect(normalizeTime('9am')).toBe('09:00 AM');
    expect(normalizeTime('9:30 am')).toBe('09:30 AM');
    expect(normalizeTime('noon')).toBe('12:00 PM');
  });
});
```

#### b. Integration Tests
- [ ] Test complete pipeline
```typescript
describe('Processing Pipeline', () => {
  test('processes compound input correctly', async () => {
    const input = "I need to drink water and have a meeting at 9am";
    const result = await nlpService.process(input);
    expect(result.thoughts).toHaveLength(2);
    expect(result.thoughts[0].type).toBe('task');
    expect(result.thoughts[1].type).toBe('event');
  });
});
```

## Success Criteria
1. Task Detection
   - Correctly identifies verb-noun pairs
   - Handles compound tasks
   - > 95% accuracy on test cases

2. Time Processing
   - Handles all common time formats
   - Normalizes to consistent format
   - Preserves time zones

3. Deduplication
   - Identifies similar events
   - Merges metadata correctly
   - No false positives

4. Test Coverage
   - > 90% code coverage
   - All edge cases covered
   - Integration tests passing

## Dependencies
- None - This is Phase 1

## Timeline
- Day 1-2: NLP service setup
- Day 3-4: Text processing improvements
- Day 5: Deduplication implementation
- Day 6-7: Testing and refinement

## Risks
1. Complex regex patterns might be brittle
2. Deduplication might be too aggressive/conservative
3. Edge cases in time format handling

## Revision History
