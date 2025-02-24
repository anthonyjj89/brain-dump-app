# Phase 2: LLM Integration

## Overview
Improve the app's handling of uncertain cases by implementing a more sophisticated LLM integration that works in conjunction with the rule-based system from Phase 1.

## Goals
1. Create prompt templates
2. Implement processing pipeline
3. Add validation
4. Add performance metrics

## Tasks

### 1. Create Prompt Templates

#### a. Create Template System
- [ ] Create `src/services/nlp/prompts/index.ts`
```typescript
interface PromptTemplate {
  name: string;
  template: string;
  examples: string[];
  validation: {
    required: string[];
    optional: string[];
  };
}

const templates: Record<string, PromptTemplate> = {
  taskExtraction: {
    name: 'Task Extraction',
    template: `Extract tasks from the following text...`,
    examples: [
      'Input: "tidy the plate and brush the cat"',
      'Output: [{ verb: "tidy", object: "plate" }, { verb: "brush", object: "cat" }]'
    ],
    validation: {
      required: ['verb', 'object'],
      optional: ['context', 'priority']
    }
  }
};
```

#### b. Add Specialized Templates
- [ ] Task detection template
- [ ] Event extraction template
- [ ] Metadata extraction template
- [ ] Relationship detection template

### 2. Implement Processing Pipeline

#### a. Create Pipeline Manager
- [ ] Create `src/services/nlp/pipeline/index.ts`
```typescript
export class PipelineManager {
  constructor(
    private ruleBasedStrategy: ProcessingStrategy,
    private llmStrategy: ProcessingStrategy
  ) {}

  async process(text: string): Promise<ProcessingResult> {
    // 1. Try rule-based first
    // 2. Check confidence
    // 3. Use LLM if needed
    // 4. Merge results
  }
}
```

#### b. Add Confidence Scoring
- [ ] Implement confidence calculation
```typescript
function calculateConfidence(result: ProcessingResult): number {
  // Score based on:
  // - Pattern match strength
  // - Context clarity
  // - Metadata completeness
  return score; // 0-1
}
```

#### c. Add Result Merging
- [ ] Implement result merger
```typescript
function mergeResults(
  ruleBasedResult: ProcessingResult,
  llmResult: ProcessingResult
): ProcessingResult {
  // Combine insights from both sources
  // Preserve high-confidence results
  // Merge metadata
}
```

### 3. Add Validation

#### a. Create Schema Validation
- [ ] Create `src/services/nlp/validation/index.ts`
```typescript
import { z } from 'zod';

const ThoughtSchema = z.object({
  thoughtType: z.enum(['task', 'event', 'note', 'uncertain']),
  confidence: z.enum(['high', 'low']),
  processedContent: z.object({
    title: z.string(),
    // ... other fields
  })
});
```

#### b. Add Runtime Validation
- [ ] Implement validation helpers
```typescript
function validateLLMResponse(response: unknown): ProcessingResult {
  // Parse JSON safely
  // Validate against schema
  // Handle validation errors
  // Return typed result
}
```

### 4. Add Performance Metrics

#### a. Create Metrics Service
- [ ] Create `src/services/metrics/index.ts`
```typescript
export class MetricsService {
  trackProcessingTime(duration: number): void;
  trackLLMUsage(tokens: number): void;
  trackAccuracy(expected: string, actual: string): void;
  getMetrics(): ProcessingMetrics;
}
```

#### b. Add Metric Collection Points
- [ ] Track processing time
- [ ] Track LLM usage
- [ ] Track accuracy
- [ ] Track costs

### 5. Testing

#### a. Unit Tests
- [ ] Test prompt templates
```typescript
describe('Prompt Templates', () => {
  test('generates correct task extraction prompt', () => {
    const prompt = generatePrompt('taskExtraction', {
      text: 'tidy the plate'
    });
    expect(prompt).toContain('Extract tasks from');
    expect(prompt).toContain('tidy the plate');
  });
});
```

#### b. Integration Tests
- [ ] Test pipeline
```typescript
describe('Processing Pipeline', () => {
  test('falls back to LLM for uncertain cases', async () => {
    const input = "maybe we should consider the project timeline";
    const result = await pipeline.process(input);
    expect(result.metadata.strategy).toBe('llm');
  });
});
```

## Success Criteria
1. LLM Integration
   - Seamless fallback for uncertain cases
   - Proper error handling
   - Cost-effective usage

2. Validation
   - No invalid responses reach production
   - Clear error messages
   - Type safety throughout

3. Performance
   - Processing time < 2s
   - LLM usage reduced by 50%
   - Error rate < 1%

4. Metrics
   - Comprehensive tracking
   - Cost monitoring
   - Accuracy measurement

## Dependencies
- Phase 1 completion required
  - Rule-based processing
  - Basic validation
  - Test infrastructure

## Timeline
- Day 1-2: Prompt templates and validation
- Day 3-4: Pipeline implementation
- Day 5: Metrics implementation
- Day 6-7: Testing and optimization

## Risks
1. LLM response inconsistency
2. Cost management for LLM usage
3. Performance impact of validation
4. Complex error scenarios

## Revision History
- 2024-02-24: Initial task document created
