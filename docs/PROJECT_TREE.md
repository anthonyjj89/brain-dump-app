# Project Structure

```
Brain Dump App/
├── docs/                           # Project documentation
│   ├── CHANGELOG.md               # Version history and changes
│   ├── CURRENT_TASKS.md          # Active development tasks
│   ├── HANDOVER.md               # Development handover notes
│   ├── PROJECT_TREE.md           # This file
│   └── ...                       # Other documentation
│
├── brain-dump-app/                # Main Next.js application
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── api/             # API Routes
│   │   │   │   ├── thoughts/    # Thought submission endpoints
│   │   │   │   ├── review/      # Review system endpoints
│   │   │   │   └── sync/        # External service sync endpoints
│   │   │   └── page.tsx         # Main application page
│   │   │
│   │   ├── components/          # React components
│   │   │   ├── ThoughtForm.tsx  # Thought input form
│   │   │   └── ReviewCards.tsx  # Review card display
│   │   │
│   │   ├── lib/                 # Library code
│   │   │   └── mongodb.ts       # MongoDB configuration
│   │   │
│   │   └── utils/               # Utility functions
│   │       └── ai.ts            # AI categorization logic
│   │
│   ├── public/                  # Static files
│   │   └── ...
│   │
│   ├── .env.local              # Environment variables
│   ├── package.json            # Project dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   └── tailwind.config.js      # Tailwind CSS configuration
│
└── README.md                    # Project overview

```

## Key Components

### Frontend (Next.js)
- `src/app/page.tsx`: Main application interface
- `src/components/`: Reusable React components
- `src/lib/`: Core functionality and configurations
- `src/utils/`: Helper functions and utilities

### API Routes
- `/api/thoughts`: Thought submission and management
- `/api/review`: Review system endpoints
- `/api/sync`: External service synchronization

### Configuration
- `.env.local`: Environment variables
- `tsconfig.json`: TypeScript settings
- `tailwind.config.js`: Styling configuration

### Documentation
- `docs/`: Project documentation
- `CHANGELOG.md`: Version history
- `CURRENT_TASKS.md`: Active tasks
- `HANDOVER.md`: Development handover notes

## Technology Stack

### Core Technologies
- Next.js 14 (React Framework)
- TypeScript
- MongoDB (Database)
- Tailwind CSS (Styling)

### External Services
- OpenRouter API (AI)
- TickTick API (Tasks) - Pending
- Google Calendar API (Events) - Pending
- Notion API (Notes) - Pending

### Development Tools
- Git (Version Control)
- npm (Package Management)
- VS Code (IDE)
