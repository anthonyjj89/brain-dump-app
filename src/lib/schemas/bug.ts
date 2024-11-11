export interface Bug {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  type: 'bug' | 'feature';  // Adding back the type field
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

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  type: 'feature';  // Always 'feature' for consistency
  requestedBy: string;
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  notes?: string;
  screenshot?: {
    path: string;
    timestamp: Date;
  };
}

export const BUG_STATUSES = ['Open', 'Closed'] as const;
export const BUG_PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const REPORT_TYPES = ['bug', 'feature'] as const;

export function generateBugId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `BUG-${timestamp}-${random}`.toUpperCase();
}

export function generateFeatureId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `FEAT-${timestamp}-${random}`.toUpperCase();
}

export function validateBug(bug: Partial<Bug>): bug is Bug {
  return (
    typeof bug.id === 'string' &&
    typeof bug.title === 'string' &&
    typeof bug.description === 'string' &&
    BUG_STATUSES.includes(bug.status as any) &&
    BUG_PRIORITIES.includes(bug.priority as any) &&
    typeof bug.type === 'string' &&
    REPORT_TYPES.includes(bug.type as any) &&
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

export function validateFeature(feature: Partial<Feature>): feature is Feature {
  return (
    typeof feature.id === 'string' &&
    typeof feature.title === 'string' &&
    typeof feature.description === 'string' &&
    BUG_STATUSES.includes(feature.status as any) &&
    BUG_PRIORITIES.includes(feature.priority as any) &&
    feature.type === 'feature' &&
    typeof feature.requestedBy === 'string' &&
    (!feature.requirements || (
      Array.isArray(feature.requirements) &&
      feature.requirements.every(req => typeof req === 'string')
    )) &&
    feature.createdAt instanceof Date &&
    feature.updatedAt instanceof Date &&
    (!feature.screenshot || (
      typeof feature.screenshot.path === 'string' &&
      feature.screenshot.timestamp instanceof Date
    ))
  );
}
