import { ObjectId } from 'mongodb';

export interface Bug {
  _id?: ObjectId;
  id: string;
  title: string;
  status: 'Open' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  reportedBy: string;
  steps: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedBy?: string;
  notes?: string;
  screenshot?: {
    path: string;  // Path to screenshot in public/screenshots
    timestamp: Date;
  };
}

export const BUG_STATUSES = ['Open', 'Closed'] as const;
export const BUG_PRIORITIES = ['Low', 'Medium', 'High'] as const;

export function generateBugId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `BUG-${timestamp}-${random}`.toUpperCase();
}

export function validateBug(bug: Partial<Bug>): bug is Bug {
  return (
    typeof bug.id === 'string' &&
    typeof bug.title === 'string' &&
    BUG_STATUSES.includes(bug.status as any) &&
    BUG_PRIORITIES.includes(bug.priority as any) &&
    typeof bug.reportedBy === 'string' &&
    Array.isArray(bug.steps) &&
    bug.steps.every(step => typeof step === 'string') &&
    bug.createdAt instanceof Date &&
    bug.updatedAt instanceof Date &&
    (!bug.screenshot || (
      typeof bug.screenshot.path === 'string' &&
      bug.screenshot.timestamp instanceof Date
    ))
  );
}
