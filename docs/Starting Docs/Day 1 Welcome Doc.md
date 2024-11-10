Project Name: Brain Dump App

Project Overview
You are tasked with developing the Brain Dump App, a productivity tool to capture, organize, and sync user ideas. The app will:

Allow users to dump thoughts via voice or text.
Use AI to categorize input (tasks, events, or thought dumps).
Provide a card-based review system for approval before syncing.
Integrate with TickTick, Google Calendar, and Notion APIs.
Include a user bug reporting system for continuous improvement.
Tech Stack
Frontend: React.js with Tailwind CSS.
Backend: FastAPI (Python).
Database: MongoDB Atlas.
Authentication: Firebase Auth (email/password login).
AI Integration: Claude Haiku 3.5 via OpenRouter.
Hosting: Vercel (Frontend) and Heroku (Backend).
Monitoring: Sentry for error tracking and performance monitoring.
Key Features
Thought Dumping:

Input via voice or text.
Live transcription with visual corrections.
AI-powered categorization into:
Tasks (e.g., "Call plumber tomorrow").
Events (e.g., "Dinner with John at 7 PM").
Thought Dumps (e.g., "Brainstorm for project X").
Card-Based Review System:

Generate cards for AI-processed input.
Allow users to:
Approve tasks/events/thought dumps.
Edit or discard content.
Push approved items to external services.
Third-Party Integrations:

TickTick API: Sync tasks.
Google Calendar API: Create events with reminders.
Notion API: Add thought dumps as sub-pages in a "Brain Inbox."
Notifications:

Morning reminders to process pending items.
Sunday review notifications for the upcoming week.
Archive and Search:

Archive synced items.
Enable keyword search across archived data.
User Bug Reporting:

Integrated bug reporting system in the app.
Data stored in MongoDB and synchronized with BUG_JOURNAL.md.
Error Monitoring:

Sentry integration to track errors and monitor performance.
Project Structure
Provide a clear file structure with placeholders for implementation:

graphql
Copy code
BrainDumpApp/
├── docs/                      # Project documentation
│   ├── README.md             # Overview
│   ├── BUG_JOURNAL.md        # Bug tracking
│   ├── MONITORING_SETUP.md   # Sentry setup
│   ├── HANDOVER.md           # Developer guide
│   └── ...
├── frontend/                 # React.js app
│   ├── components/           # UI components
│   ├── hooks/                # Custom hooks
│   ├── styles/               # Tailwind CSS
│   ├── App.tsx               # Main React component
│   └── ...
├── backend/                  # FastAPI app
│   ├── routes/               # API endpoints
│   │   ├── dump.py          # Placeholder: Submit thoughts
│   │   ├── review.py        # Placeholder: Fetch review cards
│   │   ├── sync.py          # Placeholder: Sync tasks/events
│   └── ...
│   ├── services/             # Third-party API integrations
│   │   ├── ticktick.py      # TickTick API integration
│   │   ├── calendar.py      # Google Calendar API integration
│   │   ├── notion.py        # Notion API integration
│   └── ...
│   ├── models/               # Pydantic models
│   ├── utils/                # Helper functions
│   └── main.py               # FastAPI entry point
├── database/                 # MongoDB scripts/configs
│   ├── init.py               # MongoDB initialization
│   └── schemas/              # Data schemas for collections
└── ...
Immediate Tasks for Day 1
Set Up the Backend:

Install FastAPI and configure MongoDB.
Create placeholders for key API endpoints:
/dump: Submit thoughts.
/cards: Fetch review cards.
/sync: Push tasks/events to third-party services.
Frontend Prototype:

Build a simple UI for input (voice/text).
Create mock cards for the review system.
Integrations:

Set up test connections with:
TickTick API for tasks.
Google Calendar API for events.
Notion API for thought dumps.
Monitoring:

Integrate Sentry with backend and frontend.
Test error tracking with intentional errors.
Guidelines
Use modular design to make switching between frameworks (e.g., FastAPI to Node.js) easy.
Keep documentation updated, especially:
Synchronization logic for BUG_JOURNAL.md.
Any modifications to the project structure.
Use GitHub Actions to automate testing and deployment.
Deliverables for First Session
Basic backend setup with functional endpoints.
Frontend prototype for thought input and review cards.
Working integrations with mock/test data.
Documentation updated with progress.