# Brain Dump App

A productivity tool that uses AI to capture, categorize, and sync your thoughts across various platforms.

## Version: 0.1.2

## Overview

Brain Dump App allows users to quickly capture thoughts via text (and soon voice), uses AI to categorize them, and syncs them to appropriate services:
- Tasks → TickTick
- Events → Google Calendar
- Notes → Notion

## Features

- 🤖 AI-powered thought categorization
- 📝 Text input for thoughts and ideas
- 🐛 Bug and feature request tracking system
- 🔄 Review system for categorized thoughts
- 🔗 External service integration (in progress)
- 🎨 Clean, responsive UI with Tailwind CSS
- ⚡ Real-time updates
- 📊 Admin panel with system status monitoring
- 🖼️ Screenshot upload capability for bug reports

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

See [PROJECT_TREE.md](docs/PROJECT_TREE.md) for detailed structure.

## Documentation

- [CHANGELOG.md](docs/CHANGELOG.md) - Version history
- [CURRENT_TASKS.md](docs/CURRENT_TASKS.md) - Active development tasks
- [HANDOVER.md](docs/HANDOVER.md) - Development handover notes
- [PROJECT_TREE.md](docs/PROJECT_TREE.md) - Project structure
- [BUG_TRACKER.md](docs/BUG_TRACKER.md) - Bug and feature request tracking

## Contributing

1. Check [CURRENT_TASKS.md](docs/CURRENT_TASKS.md) for active tasks
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and confidential.

## Contact

[Contact Information Pending]
