# Project Structure

## Branch Organization

```
Repository Branches
├── main              # Production branch, deployed to Heroku
├── dev               # Development branch, for feature integration
└── experimental      # Experimental features and testing
```

## Project Structure

```
Brain Dump App/
├── docs/                           # Project documentation
│   ├── CHANGELOG.md               # Version history and changes
│   ├── CURRENT_TASKS.md          # Active development tasks
│   ├── HANDOVER.md               # Development handover notes
│   ├── PROJECT_TREE.md           # This file
│   └── ...                       # Other documentation
│
├── src/                          # Main Next.js application
│   ├── app/                      # Next.js App Router
│   │   ├── api/                 # API Routes
│   │   │   ├── thoughts/        # Thought submission endpoints
│   │   │   ├── review/         # Review system endpoints
│   │   │   ├── sync/           # External service sync endpoints
│   │   │   ├── status/         # System status endpoints
│   │   │   └── test-db/        # Database test endpoints
│   │   └── page.tsx            # Main application page
│   │
│   ├── components/              # React components
│   │   ├── AdminPanel/         # Admin interface components
│   │   │   ├── StatusTab.tsx   # System status display
│   │   │   └── BugTab.tsx      # Bug tracking interface
│   │   ├── ThoughtForm.tsx     # Thought input form
│   │   └── ReviewCards.tsx     # Review card display
│   │
│   ├── lib/                    # Library code
│   │   ├── mongodb.ts         # MongoDB configuration
│   │   └── schemas/           # Database schemas
│   │
│   ├── utils/                 # Utility functions
│   │   ├── ai.ts             # AI categorization logic
│   │   └── screenshot.ts     # Screenshot handling
│   │
│   ├── hooks/                # Custom React hooks
│   │   └── useSystemStatus.ts # System status management
│   │
│   └── providers/            # React context providers
│       └── QueryProvider.tsx # React Query configuration
│
├── public/                   # Static files
│   ├── screenshots/         # Screenshot storage
│   └── ...                 # Other static assets
│
├── scripts/                 # Utility scripts
│   └── restart-app.ps1     # Development server management
│
├── .env.local              # Environment variables
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── tailwind.config.js      # Tailwind CSS configuration
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
- `/api/status`: System status monitoring
- `/api/test-db`: Database health checks

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
- MongoDB Atlas (Database)
- Heroku (Deployment)

### Development Tools
- Git (Version Control)
- npm (Package Management)
- VS Code (IDE)
- React Query (Data Fetching)
