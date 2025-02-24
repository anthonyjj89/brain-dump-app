# Brain Dump App - Technical Context

## Development Environment

### Core Technologies
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: MongoDB
- **APIs**: 
  - OpenAI Whisper (transcription)
  - Claude-3-Haiku (NLP)

### Development Tools
- **IDE**: Visual Studio Code
- **Version Control**: Git
- **Package Manager**: npm
- **Testing**: Jest
- **API Testing**: Postman

### Environment Variables
```env
# API Keys
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...

# Database
MONGODB_URI=mongodb://...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

### Directory Layout
```
brain-dump-app/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Library code
│   ├── providers/       # React context providers
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions
├── public/              # Static assets
├── docs/               # Documentation
└── memory-bank/        # Project memory
```

### Key Files
- `src/utils/ai.ts`: AI/LLM integration
- `src/utils/text.ts`: Text processing
- `src/app/api/thoughts/stream/route.ts`: Main processing endpoint
- `src/components/ProcessingStatus.tsx`: UI feedback

## API Endpoints

### Voice Processing
```typescript
POST /api/thoughts/stream
Content-Type: multipart/form-data
Body: {
  audio: Blob,
  type: 'complete' | 'partial'
}
Response: Server-Sent Events
```

### Thought Management
```typescript
GET /api/thoughts
POST /api/thoughts
PUT /api/thoughts/:id
DELETE /api/thoughts/:id
```

## Data Models

### Thought Model
```typescript
interface Thought {
  id: string;
  content: string;
  inputType: 'voice' | 'text';
  thoughtType: 'task' | 'event' | 'note' | 'uncertain';
  confidence: 'high' | 'low';
  processedContent: {
    title?: string;
    dueDate?: string;
    priority?: string;
    eventDate?: string;
    eventTime?: string;
    location?: string;
    tags?: string[];
    details?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    source: string;
    batchId: string;
    categorization: string;
  };
}
```

## Technical Constraints

### API Rate Limits
- Whisper API: 50 requests/minute
- Claude API: 100 requests/minute
- MongoDB Atlas: Standard tier limits

### Performance Targets
- Voice processing: < 2s
- UI interactions: < 100ms
- API responses: < 500ms

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- No IE11 support required
- Mobile browser support required

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm run dev`

### Testing
1. Unit tests: `npm test`
2. Integration tests: `npm run test:integration`
3. E2E tests: `npm run test:e2e`

### Deployment
1. Build: `npm run build`
2. Deploy to production: `npm run deploy`

## Monitoring & Logging

### Metrics
- Processing time
- API usage
- Error rates
- Cost tracking

### Logging
- Request/response logs
- Error logs
- Performance logs

### Alerts
- Error rate thresholds
- Performance degradation
- Cost thresholds

## Security Considerations

### API Security
- API key rotation
- Rate limiting
- Input validation

### Data Security
- Data encryption
- Secure storage
- Access control

## Dependencies

### Core Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "mongodb": "^6.0.0"
}
```

### Development Dependencies
```json
{
  "jest": "^29.0.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0"
}
```

## Known Issues

### Current Limitations
1. No offline support
2. Limited error recovery
3. Basic progress feedback
4. No multi-user support

### Technical Debt
1. Tight coupling in API routes
2. Limited test coverage
3. Basic error handling
4. No performance monitoring

## Future Technical Considerations

### Planned Improvements
1. Service worker for offline support
2. WebSocket for real-time updates
3. Redis for caching
4. Proper error boundaries

### Scalability Plans
1. Microservices architecture
2. Load balancing
3. Horizontal scaling
4. CDN integration

## Revision History
- 2024-02-24: Initial technical context document created
