# Brain Dump App

A productivity tool that uses AI to capture, categorize, and sync your thoughts across various platforms.

## Version: 0.1.1

## Overview

Brain Dump App allows users to quickly capture thoughts via text (and soon voice), uses AI to categorize them, and syncs them to appropriate services:
- Tasks → TickTick
- Events → Google Calendar
- Notes → Notion

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: MongoDB Atlas
- **AI**: OpenRouter (Claude 3 Haiku)
- **Styling**: Tailwind CSS
- **External Services** (Coming Soon):
  - TickTick API
  - Google Calendar API
  - Notion API

## Features

### Core Features
- 🤖 AI-powered thought categorization
- 📝 Text input (Voice coming soon)
- 🔄 Review system for categorized thoughts
- 🔗 External service integration (in progress)
- 🎨 Clean, responsive UI
- ⚡ Real-time updates

### New in v0.1.1
- 🗃️ MongoDB Atlas integration with connection pooling
- 🐛 Bug tracking system with screenshot capability
- 📊 System status monitoring
- 🔄 Git hooks for automated tasks
- 📚 Comprehensive documentation

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- OpenRouter API key

### Environment Setup

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd brain-dump-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create `.env.local` with required environment variables:
   ```env
   MONGODB_URI=your_mongodb_uri
   OPENROUTER_API_KEY=your_openrouter_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Development

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

See [PROJECT_TREE.md](PROJECT_TREE.md) for detailed structure.

## Documentation

### Core Documentation
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [CURRENT_TASKS.md](CURRENT_TASKS.md) - Active development tasks
- [HANDOVER.md](HANDOVER.md) - Development handover notes
- [PROJECT_TREE.md](PROJECT_TREE.md) - Project structure

### Development Guides
- [BUG_TRACKING_SYSTEM_GUIDE.md](docs/BUG_TRACKING_SYSTEM_GUIDE.md) - Bug system implementation
- [GIT_HUSKY_GUIDE.md](docs/GIT_HUSKY_GUIDE.md) - Git workflow and automation

## Features in Development

### Coming Soon
1. External Service Integration
   - TickTick for tasks
   - Google Calendar for events
   - Notion for notes

2. Voice Input
   - Real-time transcription
   - Voice commands
   - Multi-language support

3. Enhanced AI Features
   - Improved categorization
   - Smart suggestions
   - Pattern recognition

## Contributing

1. Check [CURRENT_TASKS.md](CURRENT_TASKS.md) for active tasks
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and confidential.

## Contact

[Contact Information Pending]
