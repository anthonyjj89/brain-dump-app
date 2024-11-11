# Brain Dump App

A productivity tool that uses AI to capture, categorize, and sync your thoughts across various platforms.

## Version: 0.1.2

## Overview

Brain Dump App allows users to quickly capture thoughts via text (and soon voice), uses AI to categorize them, and syncs them to appropriate services:
- Tasks → TickTick
- Events → Google Calendar
- Notes → Notion

## Branch Structure

- `main` - Production branch, deployed to Heroku
- `dev` - Development branch, for feature integration
- `experimental` - Experimental features and testing

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: MongoDB Atlas
- **AI**: OpenRouter (Claude 3 Haiku)
- **Styling**: Tailwind CSS
- **Deployment**: Heroku
- **Data Fetching**: React Query
- **External Services** (Coming Soon):
  - TickTick API
  - Google Calendar API
  - Notion API

## Features

- 🤖 AI-powered thought categorization
- 📝 Text input (Voice coming soon)
- 🔄 Review system for categorized thoughts
- 📊 System status monitoring
- 🔗 External service integration (in progress)
- 🎨 Clean, responsive UI
- ⚡ Real-time updates with React Query
- 🔍 Connection health monitoring
- 📈 Performance metrics tracking

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- OpenRouter API key

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/brain-dump-app.git
   ```

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

### Branch Management

- For production changes:
  ```bash
  git checkout main
  ```

- For development work:
  ```bash
  git checkout dev
  ```

- For experimental features:
  ```bash
  git checkout experimental
  ```

## Project Structure

See [PROJECT_TREE.md](PROJECT_TREE.md) for detailed structure.

## Documentation

- [CHANGELOG.md](CHANGELOG.md) - Version history
- [CURRENT_TASKS.md](CURRENT_TASKS.md) - Active development tasks
- [HANDOVER.md](HANDOVER.md) - Development handover notes
- [PROJECT_TREE.md](PROJECT_TREE.md) - Project structure
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide

## Contributing

1. Check [CURRENT_TASKS.md](CURRENT_TASKS.md) for active tasks
2. Create a feature branch from `dev`
3. Make your changes
4. Submit a pull request to `dev`

## Deployment

The application is deployed on Heroku:
- Production: [URL Pending]
- Development: [URL Pending]

## License

This project is private and confidential.

## Contact

[Contact Information Pending]
