# Bug Database

## Database Synchronization

This document serves as a synchronized database of all project bugs, automatically maintained with MongoDB. Each entry contains comprehensive bug information and maintains real-time synchronization with the database.

### Synchronization Details
- Database: MongoDB
- Collection: `bugs`
- Sync Frequency: Real-time
- Two-way sync enabled
- MongoDB ObjectId referenced in each entry

## Active Bugs

### [BUG-MP-001] Input Text Color Too Light
**MongoDB ID**: 65f9d8a1e4b0a6f2c3d1e5f8  
**Status**: 🟢 Resolved  
**Source**: User Feedback System  
**Reporter**: john.doe@example.com  
**Date Reported**: 2024-03-19 14:30 UTC  
**Last Updated**: 2024-03-19 15:45 UTC  

**Description**: 
Text in the thought input box appears grey, making it difficult to read.

**Steps to Reproduce**:
1. Open the application
2. Focus on the "What's on your mind?" input box
3. Type some text
4. Observe the text color is too light grey

**Expected Behavior**:
Text should be dark and easily readable.

**Actual Behavior**:
Text appears in a light grey color, reducing readability.

**Environment**:
- Browser: All browsers
- OS: All operating systems
- Component: ThoughtForm
- File: src/components/ThoughtForm.tsx

**Impact**: 
- Severity: Medium
- Affected Users: All users entering thoughts
- Business Impact: Reduced usability and accessibility

**Priority**: Medium  
**Assigned To**: TBD  

**Resolution**: 
Added explicit text color classes to ensure readability:
- Light mode: text-gray-900
- Dark mode: dark:text-gray-100
- Applied to both textarea and select elements
- Verified in both color schemes

**Updates**:
- 2024-03-19 15:45 UTC: Bug resolved - implemented text color fix
- 2024-03-19 14:30 UTC: Bug identified and documented

### [BUG-002] Memory Leak in Dashboard
**MongoDB ID**: 6548a7b9e4b0a6f2c3d1e5f9  
**Status**: 🟡 In Progress  
**Source**: Internal Testing  
**Reporter**: @developer.name  
**Date Reported**: 2024-11-07 16:00 UTC  
**Last Updated**: 2024-11-07 16:30 UTC  

[Similar structure as above...]

## Database Schema

```typescript
interface Bug {
  _id: ObjectId;
  bugId: string;
  title: string;
  status: BugStatus;
  source: BugSource;
  reporter: string;
  dateReported: Date;
  lastUpdated: Date;
  description: string;
  steps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: Environment;
  impact: Impact;
  priority: Priority;
  assignedTo: string;
  resolution: string;
  updates: Update[];
}

enum BugStatus {
  Open = '🔴 Open',
  InProgress = '🟡 In Progress',
  ReadyForReview = '🟣 Ready for Review',
  Resolved = '🟢 Resolved',
  Closed = '⚫ Closed'
}

interface Environment {
  browser?: string;
  os?: string;
  resolution?: string;
  device?: string;
  version?: string;
}

interface Impact {
  severity: 'High' | 'Medium' | 'Low';
  affectedUsers: string;
  businessImpact: string;
}

interface Update {
  timestamp: Date;
  message: string;
  author: string;
}
```

## Status Definitions

- 🔴 Open: New or reopened bug
- 🟡 In Progress: Under active development
- 🟣 Ready for Review: Fix implemented, awaiting review
- 🟢 Resolved: Fix verified and deployed
- ⚫ Closed: Verified in production

## Priority Levels

- Critical: Immediate attention required
- High: Address in current sprint
- Medium: Schedule for upcoming sprint
- Low: Address when resources available

## Source Categories

- User Feedback: Reported through application
- Internal Testing: Found during QA
- Production Monitoring: Detected by systems
- Security Scan: Identified by security tools

## Database Entry Template

```markdown
### [BUG-XXX] Title
**MongoDB ID**: [ObjectId]  
**Status**: [Status]  
**Source**: [Source]  
**Reporter**: [Name/Email]  
**Date Reported**: [YYYY-MM-DD HH:MM UTC]  
**Last Updated**: [YYYY-MM-DD HH:MM UTC]  

**Description**: 
[Clear description of the bug]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Environment**:
- Browser: [Browser details]
- OS: [Operating system]
- Component: [Affected component]
- File: [Relevant file path]

**Impact**: 
- Severity: [High/Medium/Low]
- Affected Users: [Who is affected]
- Business Impact: [Impact description]

**Priority**: [Priority Level]  
**Assigned To**: [Developer name/team]  

**Resolution**: 
[Resolution details or pending]

**Updates**:
- [Date Time]: [Update message]
