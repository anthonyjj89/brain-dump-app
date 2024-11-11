# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Toggle functionality between bug and feature reports in the AdminPanel
- Screenshot upload capability for bug reports
- Sorting and filtering options for bug/feature reports
- Improved error handling and data validation in bug reporting system

### Changed
- Updated BugTab component to handle both bug and feature reports
- Modified AdminPanel component to manage reportType state
- Refactored BugReportForm to support new report types and screenshot uploads
- Fixed text color in ThoughtForm component for improved readability

### Fixed
- [BUG-MP-001] Input Text Color Too Light
  * Added explicit text color classes (text-gray-900 for light mode, dark:text-gray-100 for dark mode)
  * Applied to both textarea and select elements
  * Verified in both color schemes
- Resolved type checking issues in BugTab and AdminPanel components

### Known Issues
- External service integrations pending implementation
- Voice input feature not yet implemented

## [0.1.2] - 2024-03-20

### Added
- Implemented bug reporting functionality
- Added screenshot upload capability to bug reports
- Enhanced error handling in BugReportForm component

### Changed
- Updated API route for bug synchronization to handle new report types
- Improved validation for bug report submissions

### Fixed
- Various type checking issues across components

## [0.1.1] - 2024-03-19

### Added
- MongoDB Atlas integration
  * Successful database connection
  * Connection pooling and error handling
  * Database health monitoring
  * Test endpoints for verification
- Admin Panel with system status
- Database connection monitoring
- Comprehensive database documentation

### Technical Updates
- MongoDB connection configuration
- Database helper functions
- Status API endpoints
- Connection testing suite

### Documentation
- Added DATABASE_SETUP.md
- Updated project documentation
- Created MongoDB setup guide template

## [0.1.0] - 2024-03-19

### Added
- Initial project setup using Next.js 14 with App Router
- API Routes:
  - /api/thoughts: Submit and manage thoughts
  - /api/review: Review and approve categorized thoughts
  - /api/sync: Integration with external services (prepared)
- Components:
  - ThoughtForm: Submit new thoughts
  - ReviewCards: Review and manage categorized thoughts
- Environment configuration for:
  - OpenRouter API
  - External service placeholders (TickTick, Google Calendar, Notion)
- Basic error handling and loading states
- TypeScript support throughout the application

### Technical Details
- Framework: Next.js 14 with App Router
- Styling: Tailwind CSS
- State Management: React Hooks
- API Design: REST with Next.js API Routes

### Development Setup
- Development server configuration
- Environment variable management
- TypeScript configuration
- Git initialization

### Next Steps
- Implement external service integrations (TickTick, Google Calendar, Notion)
- Add user authentication
- Enhance AI categorization
- Add voice input support
- Implement error monitoring with Sentry
