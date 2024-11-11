# Project Feedback Tracker

> Last Updated: 2024-11-11T20:00:57.090Z
> This document is automatically synchronized with MongoDB. Manual edits will be overwritten.

## Quick Stats
🔄 Auto-generated from database
- 🐛 Active Bugs: 16
- ✨ Active Features: 1
- ✅ Recently Completed: 0

## Active Reports

### Open Bugs

#### [BUG-M3DFBJ90-NDC] 2nd test after rebuild bug bug
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 11:35:49 PM
**Steps to Reproduce**:
1. bug

#### [BUG-M3DF2V20-AZF] after deployment with sync changes
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 11:29:05 PM
**Steps to Reproduce**:
1. yo

#### [BUG-M3DEWKBU-EB3] Test bug after the new sync script is in
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 11:24:11 PM
**Steps to Reproduce**:
1. sync script

#### [BUG-M3DEO9G0-JFY] Bug after new sync tool added test
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 11:17:44 PM
**Steps to Reproduce**:
1. test it yo

#### [BUG-M3DEEHDE-Z64] Test
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: Medium
**Reported By**: User
**Created**: 11/11/2024, 11:10:07 PM
**Steps to Reproduce**:
1. test

#### [BUG-M3CT2FS1-67F] Test Bug
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 1:12:53 PM
**Steps to Reproduce**:
1. Do it
**Screenshot**: [View](/screenshots/screenshot-1731316372108.png)

#### [BUG-1731277520516] consider further connection infomration for the API connections on teh UI in system sttaus, amount of data transfered. current ping etc updated every 1 sec
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 2:25:20 AM
**Steps to Reproduce**:
1. NA

#### [BUG-1731277455674] Lets add a toggle between bug and feature for this report system. And make sure all documentation is updated as well as the guide we made for our template folder
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 2:24:15 AM
**Steps to Reproduce**:
1. NA

#### [BUG-1731277387489] check bug docs MD has some kind of sync with the mongo DB. Something that runs in the background maybe on app/server start up script
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 2:23:07 AM
**Steps to Reproduce**:
1. NA

#### [BUG-1731277318663] Add sorting function to bug report list on admin panel
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: Medium
**Reported By**: User
**Created**: 11/11/2024, 2:21:58 AM
**Steps to Reproduce**:
1. NA

#### [BUG-1731277294595] admin panel can close when clicked outside of it as well as the close X button
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 2:21:34 AM
**Steps to Reproduce**:
1. NA

#### [BUG-1731277260983] bug reports can show a little screenshot thumbnail with click to expand function
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: Medium
**Reported By**: User
**Created**: 11/11/2024, 2:21:00 AM
**Steps to Reproduce**:
1. just feedback

#### [BUG-1731275108698] Admin panel is in the way when scren shoting, also it opens up a share thing like youre in a zoom call. lets just make it screen shot the current tab yo
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: Medium
**Reported By**: User
**Created**: 11/11/2024, 1:45:08 AM
**Steps to Reproduce**:
1. screen shot you can see admin panel is in teh way 

#### [BUG-1731275058249] admin panel also has grey text on input boxes and a few other areas.
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: High
**Reported By**: User
**Created**: 11/11/2024, 1:44:18 AM
**Steps to Reproduce**:
1. Look at it

#### [BUG-1731273892698] Input Text Color Too Light
**Status**: 🔴 Open
**Type**: 🐛 Bug
**Priority**: Medium
**Reported By**: Development Team
**Created**: 11/11/2024, 1:24:52 AM
**Steps to Reproduce**:
1. Open the application
2. Focus on the What's on your mind? input box
3. Type some text
4. Observe the text color is too light grey


### Open Feature Requests

#### [BUG-M3CTUIR3-JCK] Add microphone icon for voice section inpu
**Status**: 🔴 Open
**Type**: ✨ Feature
**Priority**: Medium
**Reported By**: User
**Created**: 11/11/2024, 1:34:44 PM


## Guidelines

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

## Database Details

### Collections
- `bugs`: Bug reports and tracking
- `features`: Feature requests and planning

### Schema Overview
```typescript
interface Report {
  _id: ObjectId;
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  type: 'bug' | 'feature';
  reportedBy: string;
  steps?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedBy?: string;
  notes?: string;
  screenshot?: {
    path: string;
    timestamp: Date;
  };
}
```

## Templates

### Bug Report Template
```markdown
#### [BUG-XX-###] Title
**Status**: 🔴 Open/🟡 In Progress/🟢 Fixed
**Priority**: High/Medium/Low
**Description**: Clear description of the issue
**Steps to Reproduce**:
1. Step 1
2. Step 2
**Expected**: What should happen
**Actual**: What actually happens
```

### Feature Request Template
```markdown
#### [FEAT-XX-###] Title
**Status**: 📋 Planned/🚧 Building/✅ Completed
**Priority**: High/Medium/Low
**Description**: Feature description
**Requirements**:
- [ ] Requirement 1
- [ ] Requirement 2
```

---
> This file is automatically generated and synchronized with MongoDB.
> Last sync performed by local sync script.