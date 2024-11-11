const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// MongoDB connection string from .env.local
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

function getStatusEmoji(status) {
  switch (status) {
    case 'Open': return '🔴';
    case 'In Progress': return '🟡';
    case 'Closed': return '🟢';
  }
}

function formatReportsToMarkdown(reports) {
  // Calculate stats
  const activeCount = reports.filter(r => r.status === 'Open').length;
  const featureCount = reports.filter(r => r.type === 'feature' && r.status === 'Open').length;
  const completedCount = reports.filter(r => r.status === 'Closed').length;

  // Sort reports by status and date
  const openBugs = reports.filter(r => r.status === 'Open' && r.type === 'bug')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const openFeatures = reports.filter(r => r.status === 'Open' && r.type === 'feature')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const inProgressItems = reports.filter(r => r.status === 'In Progress')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  const recentlyClosed = reports.filter(r => r.status === 'Closed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5); // Show only 5 most recent

  let content = `# Project Feedback Tracker

> Last Updated: ${new Date().toISOString()}
> This document is automatically synchronized with MongoDB. Manual edits will be overwritten.

## Quick Stats
🔄 Auto-generated from database
- 🐛 Active Bugs: ${activeCount}
- ✨ Active Features: ${featureCount}
- ✅ Recently Completed: ${completedCount}

## Active Reports\n\n`;

  if (openBugs.length > 0) {
    content += '### Open Bugs\n\n';
    openBugs.forEach(bug => {
      content += formatReportToMarkdown(bug);
    });
  }

  if (openFeatures.length > 0) {
    content += '\n### Open Feature Requests\n\n';
    openFeatures.forEach(feature => {
      content += formatReportToMarkdown(feature);
    });
  }

  if (inProgressItems.length > 0) {
    content += '\n### In Progress\n\n';
    inProgressItems.forEach(item => {
      content += formatReportToMarkdown(item);
    });
  }

  if (recentlyClosed.length > 0) {
    content += '\n### Recently Completed\n\n';
    recentlyClosed.forEach(item => {
      content += formatReportToMarkdown(item);
    });
  }

  content += `\n## Guidelines

### Priority Levels

#### Bug Priority
- **High**: System-breaking issues affecting all users
- **Medium**: Functional issues affecting some users
- **Low**: Minor issues, cosmetic problems

#### Feature Priority
- **High**: Core functionality, immediate business value
- **Medium**: Important improvements, scheduled updates
- **Low**: Nice-to-have features, future considerations

### Status Definitions

#### Bug Status
- 🔴 Open: Reported but not yet addressed
- 🟡 In Progress: Currently being worked on
- 🟢 Fixed: Resolution completed and verified

#### Feature Status
- 📋 Planned: Approved but not started
- 🚧 Building: Currently in development
- ✅ Completed: Implemented and deployed

## Database Schema

### Bug Report Schema
\`\`\`typescript
interface BugReport {
  id: string;
  title: string;
  type: 'bug';
  status: BugStatus;
  priority: Priority;
  description: string;
  steps: string[];
  expected: string;
  actual: string;
  impact: string;
  technical: string;
  notes: string;
  reported: Date;
  updated: Date;
  resolved?: Date;
  resolvedBy?: string;
}
\`\`\`

### Feature Request Schema
\`\`\`typescript
interface FeatureRequest {
  id: string;
  title: string;
  type: 'feature';
  status: FeatureStatus;
  priority: Priority;
  description: string;
  requirements: string[];
  dependencies: string[];
  technical: string;
  requested: Date;
  updated: Date;
  completed?: Date;
  implementedBy?: string;
}
\`\`\`

---
> This file is automatically generated and synchronized with MongoDB.
> Last sync performed by local sync script.`;

  return content;
}

function formatReportToMarkdown(report) {
  const statusEmoji = getStatusEmoji(report.status);
  const typeEmoji = report.type === 'bug' ? '🐛' : '✨';
  
  let content = `#### [${report.id}] ${report.title}\n`;
  content += `**Status**: ${statusEmoji} ${report.status}\n`;
  content += `**Type**: ${typeEmoji} ${report.type === 'bug' ? 'Bug' : 'Feature'}\n`;
  content += `**Priority**: ${report.priority}\n`;
  content += `**Reported By**: ${report.reportedBy}\n`;
  content += `**Created**: ${new Date(report.createdAt).toLocaleString()}\n`;
  
  if (report.steps && report.steps.length > 0) {
    content += '**Steps to Reproduce**:\n';
    report.steps.forEach((step, index) => {
      content += `${index + 1}. ${step}\n`;
    });
  }

  if (report.status === 'Closed' && report.resolvedBy) {
    content += `**Resolved By**: ${report.resolvedBy}\n`;
  }

  if (report.notes) {
    content += `**Notes**: ${report.notes}\n`;
  }

  if (report.screenshot) {
    content += `**Screenshot**: [View](${report.screenshot.path})\n`;
  }

  content += '\n';
  return content;
}

async function main() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const bugsCollection = db.collection('bugs');
    const featuresCollection = db.collection('features');

    // Fetch all reports
    const [bugs, features] = await Promise.all([
      bugsCollection.find({}).toArray(),
      featuresCollection.find({}).toArray()
    ]);

    console.log(`Found ${bugs.length} bugs and ${features.length} features`);

    // Transform and combine reports
    const reports = [
      ...bugs.map(doc => ({ ...doc, type: 'bug' })),
      ...features.map(doc => ({ ...doc, type: 'feature' }))
    ];

    // Generate markdown
    const markdownContent = formatReportsToMarkdown(reports);

    // Write to file
    const filePath = path.join(process.cwd(), 'docs', 'FEEDBACK_TRACKER.md');
    await fs.writeFile(filePath, markdownContent, 'utf8');

    console.log('Successfully synced feedback tracker');

    // Optional: Commit changes
    const { execSync } = require('child_process');
    try {
      execSync('git add docs/FEEDBACK_TRACKER.md');
      execSync('git commit -m "chore: sync feedback tracker from database"');
      execSync('git push origin experimental');
      console.log('Changes committed and pushed to GitHub');
    } catch (error) {
      console.log('Note: No changes to commit or push');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
