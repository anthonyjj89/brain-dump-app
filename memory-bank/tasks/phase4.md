# Phase 4: Testing & Documentation

## Overview
Implement comprehensive testing and documentation to ensure code quality, maintainability, and ease of future development.

## Goals
1. Add comprehensive test coverage
2. Create API documentation
3. Document components
4. Add setup instructions

## Tasks

### 1. Unit Testing

#### a. Test NLP Service
- [ ] Create `src/services/nlp/__tests__/index.test.ts`
```typescript
describe('NLP Service', () => {
  describe('Text Processing', () => {
    test('extracts tasks correctly', () => {
      const input = "tidy the plate and brush the cat";
      const result = nlpService.process(input);
      expect(result.thoughts).toHaveLength(2);
      expect(result.thoughts[0].type).toBe('task');
    });

    test('handles empty input', () => {
      const input = "";
      const result = nlpService.process(input);
      expect(result.thoughts).toHaveLength(0);
    });

    test('handles invalid input', () => {
      const input = null;
      expect(() => nlpService.process(input)).toThrow();
    });
  });
});
```

#### b. Test Components
- [ ] Create component test files
```typescript
// src/components/ProcessingStatus/__tests__/index.test.tsx
import { render, screen } from '@testing-library/react';

describe('ProcessingStatus', () => {
  test('shows correct step indicators', () => {
    render(<ProcessingStatus state="recording" />);
    expect(screen.getByText('Recording')).toHaveClass('active');
  });

  test('handles errors gracefully', () => {
    const error = new Error('Test error');
    render(<ProcessingStatus state="error" error={error} />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```

### 2. Integration Testing

#### a. Test Processing Pipeline
- [ ] Create `src/tests/integration/pipeline.test.ts`
```typescript
describe('Processing Pipeline', () => {
  test('processes voice input correctly', async () => {
    const audio = await loadTestAudio('test.webm');
    const result = await processVoiceInput(audio);
    expect(result.transcription).toBeTruthy();
    expect(result.thoughts).toBeDefined();
  });

  test('handles network errors', async () => {
    // Mock API failure
    server.use(
      rest.post('/api/transcribe', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    const audio = await loadTestAudio('test.webm');
    await expect(processVoiceInput(audio)).rejects.toThrow();
  });
});
```

#### b. Test Data Flow
- [ ] Create data flow tests
```typescript
describe('Data Flow', () => {
  test('saves thoughts to database', async () => {
    const thought = createTestThought();
    await saveThought(thought);
    const saved = await findThoughtById(thought.id);
    expect(saved).toEqual(thought);
  });

  test('updates UI after processing', async () => {
    const { result } = renderHook(() => useThoughts());
    act(() => {
      result.current.addThought(createTestThought());
    });
    expect(result.current.thoughts).toHaveLength(1);
  });
});
```

### 3. E2E Testing

#### a. Setup Cypress
- [ ] Configure Cypress
```javascript
// cypress.config.ts
export default {
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts'
  }
};
```

#### b. Create Test Scenarios
- [ ] Create `cypress/e2e/voice-input.cy.ts`
```typescript
describe('Voice Input', () => {
  it('records and processes voice input', () => {
    cy.visit('/');
    cy.get('[data-testid="record-button"]').click();
    cy.wait(3000);
    cy.get('[data-testid="stop-button"]').click();
    cy.get('[data-testid="processing-status"]')
      .should('contain', 'Processing');
    cy.get('[data-testid="thought-card"]')
      .should('exist');
  });
});
```

### 4. API Documentation

#### a. Create OpenAPI Spec
- [ ] Create `docs/api/openapi.yaml`
```yaml
openapi: 3.0.0
info:
  title: Brain Dump API
  version: 1.0.0
paths:
  /api/thoughts/stream:
    post:
      summary: Process voice input
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                audio:
                  type: string
                  format: binary
      responses:
        200:
          description: Success
          content:
            text/event-stream:
              schema:
                type: object
```

#### b. Document API Routes
- [ ] Add JSDoc comments to routes
```typescript
/**
 * Process voice input and return thoughts
 * @route POST /api/thoughts/stream
 * @param {Blob} audio - Voice recording
 * @param {string} type - Processing type
 * @returns {EventStream} Processing updates
 */
export async function POST(request: Request) {
  // ...
}
```

### 5. Component Documentation

#### a. Create Storybook Stories
- [ ] Create story files
```typescript
// src/components/ProcessingStatus/ProcessingStatus.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ProcessingStatus> = {
  component: ProcessingStatus,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProcessingStatus>;

export const Recording: Story = {
  args: {
    state: 'recording',
  },
};
```

#### b. Add Component Documentation
- [ ] Add README files
```markdown
# ProcessingStatus Component

Displays the current status of voice processing and shows results.

## Props

- `state`: Current processing state
- `transcription`: Transcribed text
- `thoughts`: Processed thoughts
- `error`: Error object if any

## Usage

\`\`\`tsx
<ProcessingStatus
  state="processing"
  transcription="Meeting tomorrow at 9am"
/>
\`\`\`
```

### 6. Setup Documentation

#### a. Update Project README
- [ ] Update `README.md`
```markdown
# Brain Dump App

Voice-to-text task management application.

## Setup

1. Clone repository
2. Install dependencies: \`npm install\`
3. Set up environment variables
4. Start development server: \`npm run dev\`

## Development

- \`npm run dev\`: Start development server
- \`npm test\`: Run tests
- \`npm run build\`: Build for production
```

#### b. Add Development Guides
- [ ] Create development documentation
```markdown
# Development Guide

## Architecture

The app uses a modular architecture with:
- NLP Service for text processing
- MongoDB for storage
- Next.js for API routes
- React for UI

## Adding Features

1. Create component in \`src/components\`
2. Add tests in \`__tests__\` directory
3. Update documentation
4. Submit PR
```

## Success Criteria
1. Test Coverage
   - > 90% code coverage
   - All critical paths tested
   - E2E tests passing

2. Documentation
   - Complete API documentation
   - Component usage guides
   - Clear setup instructions

3. Code Quality
   - All tests passing
   - No TypeScript errors
   - Consistent code style

## Dependencies
- Phase 1-3 completion required
  - All features implemented
  - UI components built
  - Error handling in place

## Timeline
- Day 1: Unit tests
- Day 2: Integration tests
- Day 3: Documentation

## Risks
1. Test coverage gaps
2. Documentation outdating
3. Complex test scenarios
4. Time constraints

## Revision History
- 2024-02-24: Initial task document created
