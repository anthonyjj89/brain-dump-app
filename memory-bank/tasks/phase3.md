# Phase 3: UI Improvements

## Overview
Enhance the user interface to provide better feedback during processing, improve metadata display, and handle errors more gracefully.

## Goals
1. Update ProcessingStatus component
2. Add progress indicators
3. Improve metadata display
4. Enhance error handling

## Tasks

### 1. Update ProcessingStatus Component

#### a. Refactor Component Structure
- [ ] Create `src/components/ProcessingStatus/index.tsx`
```typescript
interface ProcessingStatusProps {
  state: ProcessingState;
  transcription?: string;
  thoughts?: Thought[];
  error?: Error;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  state,
  transcription,
  thoughts,
  error
}) => {
  return (
    <div className="space-y-4">
      <ProcessingSteps state={state} />
      <TranscriptionView text={transcription} />
      <ThoughtsList thoughts={thoughts} />
      {error && <ErrorDisplay error={error} />}
    </div>
  );
};
```

#### b. Add Processing Steps Component
- [ ] Create `src/components/ProcessingStatus/ProcessingSteps.tsx`
```typescript
const steps = [
  { id: 'recording', label: 'Recording' },
  { id: 'transcribing', label: 'Transcribing' },
  { id: 'processing', label: 'Processing' },
  { id: 'complete', label: 'Complete' }
];

const ProcessingSteps: React.FC<{ state: ProcessingState }> = ({ state }) => {
  return (
    <div className="flex gap-4">
      {steps.map(step => (
        <StepIndicator
          key={step.id}
          active={state === step.id}
          complete={isStepComplete(state, step.id)}
          label={step.label}
        />
      ))}
    </div>
  );
};
```

### 2. Add Progress Indicators

#### a. Create Progress Components
- [ ] Create `src/components/shared/Progress/index.tsx`
```typescript
interface ProgressProps {
  percent: number;
  status: 'active' | 'success' | 'error';
  showInfo?: boolean;
}

const Progress: React.FC<ProgressProps> = ({
  percent,
  status,
  showInfo = true
}) => {
  return (
    <div className="relative w-full h-2 bg-slate-200 rounded">
      <div
        className={`absolute h-full rounded ${
          status === 'error' ? 'bg-red-500' :
          status === 'success' ? 'bg-green-500' :
          'bg-blue-500'
        }`}
        style={{ width: `${percent}%` }}
      />
      {showInfo && (
        <div className="mt-1 text-xs text-slate-600">
          {percent}%
        </div>
      )}
    </div>
  );
};
```

#### b. Add Loading States
- [ ] Create loading skeletons
- [ ] Add progress animations
- [ ] Implement cancelation UI

### 3. Improve Metadata Display

#### a. Update Thought Card Component
- [ ] Create `src/components/shared/ThoughtCard/index.tsx`
```typescript
interface ThoughtCardProps {
  thought: Thought;
  onEdit?: (thought: Thought) => void;
  onDelete?: (id: string) => void;
}

const ThoughtCard: React.FC<ThoughtCardProps> = ({
  thought,
  onEdit,
  onDelete
}) => {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex justify-between items-start">
        <ThoughtTitle thought={thought} />
        <ThoughtActions onEdit={onEdit} onDelete={onDelete} />
      </div>
      <ThoughtMetadata metadata={thought.processedContent} />
      <ThoughtFooter thought={thought} />
    </div>
  );
};
```

#### b. Create Metadata Components
- [ ] Create time/date display
- [ ] Create person/location tags
- [ ] Add metadata icons
- [ ] Implement tooltips

### 4. Enhance Error Handling

#### a. Create Error Boundary
- [ ] Create `src/components/ErrorBoundary/index.tsx`
```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to service
    console.error('UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### b. Create Error Components
- [ ] Create error displays
- [ ] Add retry mechanisms
- [ ] Implement fallback UI

### 5. Add Animation and Transitions

#### a. Create Animation Hooks
- [ ] Create `src/hooks/useTransition.ts`
```typescript
function useTransition(state: ProcessingState) {
  return {
    enter: state === 'entering',
    exit: state === 'exiting',
    className: getTransitionClass(state)
  };
}
```

#### b. Add Transition Components
- [ ] Create fade transitions
- [ ] Add slide animations
- [ ] Implement loading states

## Success Criteria
1. User Feedback
   - Clear processing status
   - Smooth transitions
   - Intuitive progress indication

2. Metadata Display
   - Complete information shown
   - Consistent formatting
   - Clear visual hierarchy

3. Error Handling
   - Graceful error recovery
   - Clear error messages
   - Retry mechanisms

4. Performance
   - Smooth animations
   - No UI freezes
   - < 100ms interaction response

## Dependencies
- Phase 1 & 2 completion required
  - Processing pipeline
  - Metadata extraction
  - Error handling

## Timeline
- Day 1-2: ProcessingStatus updates
- Day 3-4: Progress indicators
- Day 5: Metadata display
- Day 6-7: Error handling and polish

## Risks
1. Complex state management
2. Animation performance
3. Error recovery edge cases
4. Browser compatibility

## Revision History
- 2024-02-24: Initial task document created
