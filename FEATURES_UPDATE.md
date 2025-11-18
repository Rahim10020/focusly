# Focusly - Subtasks & Time Management Update

## 🎯 Overview

This update introduces comprehensive **hierarchical task management**, **advanced time scheduling**, and **enhanced productivity features** to Focusly.

---

## ✨ New Features

### 1. 🌳 Hierarchical Task Management

**Parent-Child Task Relationships**
- Tasks can now have parent-child relationships, creating unlimited nesting levels
- Visual indentation shows task hierarchy clearly
- Cascade delete: deleting a parent task automatically deletes all its children
- Progress tracking: parent task progress auto-calculates based on subtask completion

**Database Schema Updates**
```sql
-- New fields in tasks table:
- parent_id: UUID (references tasks.id with CASCADE delete)
- progress: INTEGER (0-100, auto-calculated)
- reminder_time: TIMESTAMP
- reminder_sent: BOOLEAN
```

**New Table: task_dependencies**
```sql
- id: UUID
- task_id: UUID (the dependent task)
- depends_on_task_id: UUID (the task it depends on)
- Prevents circular dependencies
```

---

### 2. ⏰ Advanced Time Management

**Time Scheduling**
- Start date & time for tasks
- End time with duration auto-calculation
- Visual time slot representation
- Estimated duration in minutes

**Smart Validation**
- ✅ Time range validation (start < end)
- ✅ Date range validation (start ≤ due date)
- ⚠️ Overlap detection across all tasks
- ⚠️ Duration warnings (too short/long)

**Time Utilities** (`/src/lib/utils/timeValidation.ts`)
```typescript
// Core functions:
- validateTimeRange()
- validateDateRange()
- checkTimeOverlaps()
- calculateDuration()
- calculateEndTime()
- estimatePomodoros()
- suggestTimeSlots()  // AI-like time slot suggestions
```

---

### 3. 📋 Enhanced Subtask Management

**Subtask Features**
- Inline subtask creation
- Drag & drop reordering with visual feedback
- Individual completion tracking
- Order persistence
- Expand/collapse animations

**SubTaskManager Component** (`/src/components/tasks/SubTaskManager.tsx`)
- Progress bar showing completion percentage
- Quick add with Enter key support
- Delete with confirmation
- Drag handles for reordering

---

### 4. 🗓️ Calendar View

**Monthly Calendar** (Already exists: `/src/components/calendar/CalendarView.tsx`)
- Visual representation of scheduled tasks
- Priority color coding (high/medium/low)
- Click to see task details
- Navigate months with Previous/Next/Today buttons
- Selected date task list sidebar

**Features**
- Task count indicators
- Today highlighting
- Current month emphasis
- Responsive grid layout

---

### 5. 📄 Enhanced Task Management

**Routes**
- `/create-task` → Create new task (using modal)
- `/task/[id]` → View/Edit existing task

**Features**
- Modal-based task creation
- Full-width form layout for editing
- Real-time validation feedback
- Inline subtask management
- Time overlap warnings
- Category search
- Estimated Pomodoro calculation
- Auto-save to database

---

### 6. 🚀 Enhanced useTasks Hook

**New Hook: `useTasksEnhanced`** (`/src/lib/hooks/useTasksEnhanced.ts`)

**Hierarchical Task Support**
```typescript
interface Task {
  // ... existing fields
  parentId?: string;
  children?: Task[];
  depth?: number;
  hasChildren?: boolean;
  progress?: number;
  reminderTime?: number;
  reminderSent?: boolean;
}
```

**New Methods**
```typescript
- buildTaskHierarchy()      // Recursive tree building
- flattenTasks()            // Convert tree to flat list
- getRootTasks()            // Get only top-level tasks
- getChildTasks(parentId)   // Get children of specific task
- syncSubTasks()            // Sync subtasks with database
```

**Optimistic Locking**
- Version-based conflict detection
- Prevents concurrent edit issues
- Auto-reload on conflict

---

### 7. 📊 Database Performance Optimizations

**New Indexes** (from migration file)
```sql
idx_tasks_parent_id          -- Hierarchical queries
idx_tasks_date_range         -- Date-based filtering
idx_tasks_completed          -- Completion status
idx_tasks_order              -- Drag & drop
idx_tasks_priority           -- Priority filtering
idx_tasks_reminders          -- Reminder queries
idx_tasks_list               -- Composite index for lists
idx_subtasks_task_id         -- Subtask queries
idx_subtasks_order           -- Subtask reordering
```

**Database Functions**
```sql
calculate_task_progress(task_uuid)
  → Returns progress % based on subtasks

calculate_total_duration(task_uuid)
  → Recursively calculates total time including children

check_time_overlap(user_id, task_id, start_date, start_time, end_time)
  → Returns true if time slot conflicts exist

update_parent_task_progress()
  → Trigger function that auto-updates parent progress
```

---

### 8. 🎨 UI/UX Improvements

**Validation Feedback**
- ❌ Red error boxes for blocking issues
- ⚠️ Yellow warning boxes for potential problems
- ℹ️ Info boxes for helpful tips

**Overlap Detection Display**
- Shows list of conflicting tasks
- Click to view conflicting task details
- Priority badges for easy identification

**Smart Duration Display**
- "2h 30m" human-readable format
- "≈ 6 Pomodoros" estimation
- Auto-calculate from start/end times

**Accessibility**
- Keyboard navigation support (Tab, Enter, Escape)
- Focus states on all interactive elements
- ARIA labels for screen readers
- Semantic HTML structure

---

## 📁 File Structure

```
/focusly
├── supabase-migration-subtasks-time.sql     # Database migration
├── FEATURES_UPDATE.md                       # This file
├── src/
│   ├── app/
│   │   ├── task/[id]/page.tsx              # New unified task page
│   │   └── create-task/page.tsx            # Redirects to /task/new
│   ├── components/
│   │   ├── calendar/
│   │   │   └── CalendarView.tsx            # Existing calendar
│   │   └── tasks/
│   │       └── SubTaskManager.tsx          # New subtask component
│   ├── lib/
│   │   ├── hooks/
│   │   │   ├── useTasks.ts                 # Original hook
│   │   │   └── useTasksEnhanced.ts         # New enhanced hook
│   │   └── utils/
│   │       └── timeValidation.ts           # Time utilities
│   └── types/
│       └── index.ts                        # Updated types
```

---

## 🔄 Migration Guide

### 1. **Apply Database Migration**
```bash
# Connect to your Supabase instance
psql <YOUR_DATABASE_URL>

# Run migration
\i supabase-migration-subtasks-time.sql
```

### 2. **Update Imports (Gradual Migration)**

**Option A: Use new hook directly**
```typescript
// Old
import { useTasks } from '@/lib/hooks/useTasks';

// New
import { useTasksEnhanced as useTasks } from '@/lib/hooks/useTasksEnhanced';
```

**Option B: Keep old hook**
```typescript
// Original useTasks.ts still works for backward compatibility
import { useTasks } from '@/lib/hooks/useTasks';
```

### 3. **Update Task Creation Calls**

```typescript
// Old
addTask(title, priority, tags, dueDate, notes, subDomain);

// New (with additional optional parameters)
addTask(
  title,
  priority,
  tags,
  dueDate,
  notes,
  subDomain,
  startDate,      // NEW
  startTime,      // NEW
  endTime,        // NEW
  estimatedDuration, // NEW
  parentId,       // NEW (for hierarchical tasks)
  reminderTime    // NEW
);
```

---

## 🧪 Testing Checklist

### Task Management
- [ ] Create root task
- [ ] Create child task under root task
- [ ] Create grandchild task (3+ levels deep)
- [ ] Delete parent task → children auto-delete
- [ ] Reorder tasks with drag & drop
- [ ] Complete parent task → children inherit completion

### Subtasks
- [ ] Add subtask to task
- [ ] Toggle subtask completion
- [ ] Delete subtask
- [ ] Reorder subtasks
- [ ] Parent progress updates automatically

### Time Management
- [ ] Set start date & time
- [ ] Set end time
- [ ] Auto-calculate duration
- [ ] Detect time overlaps
- [ ] Display overlap warnings
- [ ] Create task with overlapping time → show warning

### Calendar
- [ ] Navigate months (Previous/Next/Today)
- [ ] Click date → see tasks for that day
- [ ] Click task → navigate to task details
- [ ] View tasks with priority colors

### Validation
- [ ] Start time after end time → error
- [ ] Start date after due date → error
- [ ] Very short duration → warning
- [ ] Very long duration → warning
- [ ] Time overlap → warning with task list

---

## 🚨 Breaking Changes

### None!
All changes are **backward compatible**. Existing tasks will continue to work without modification.

**New fields are optional:**
- `parentId` defaults to `null` (root task)
- `progress` defaults to `0`
- `reminderTime` defaults to `null`

---

## 💡 Usage Examples

### Create a Hierarchical Task

```typescript
const { addTask } = useTasks();

// Create parent task
await addTask(
  'Complete Project Alpha',
  'high',
  ['work'],
  Date.now() + 7 * 24 * 60 * 60 * 1000, // Due in 1 week
  'Main project milestone'
);

// Create child task
await addTask(
  'Design mockups',
  'medium',
  ['design'],
  Date.now() + 2 * 24 * 60 * 60 * 1000, // Due in 2 days
  'Create Figma mockups',
  undefined,
  Date.now(),                            // Start today
  '09:00',                               // 9 AM
  '12:00',                               // 12 PM
  180,                                   // 3 hours
  parentTaskId                           // Link to parent
);
```

### Check for Time Overlaps

```typescript
import { checkTimeOverlaps } from '@/lib/utils/timeValidation';

const result = checkTimeOverlaps(
  tasks,
  taskId,
  startDate,
  '14:00',
  '16:00'
);

if (result.hasOverlap) {
  console.log('Conflicts with:', result.overlappingTasks);
}
```

### Calculate Task Progress

```sql
-- Automatically handled by trigger!
-- When subtasks are toggled, parent progress updates automatically

-- Manual calculation (if needed):
SELECT calculate_task_progress('task-uuid-here');
```

---

## 🐛 Known Issues

None at this time. Please report issues to the development team.

---

## 🛣️ Future Roadmap

### Phase 2 (Planned)
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Bulk operations
- [ ] Advanced filtering (by date range, priority, tags)
- [ ] Task dependencies visualization (Gantt chart)
- [ ] Export tasks to iCal/Google Calendar
- [ ] Notification system integration
- [ ] Mobile app support

### Phase 3 (Under Consideration)
- [ ] Collaboration (share tasks with team)
- [ ] Time tracking integration
- [ ] AI-powered task suggestions
- [ ] Voice input for task creation
- [ ] Task analytics dashboard

---

## 📚 Additional Resources

- **Database Migration**: `supabase-migration-subtasks-time.sql`
- **Type Definitions**: `src/types/index.ts`
- **Time Utilities**: `src/lib/utils/timeValidation.ts`
- **Enhanced Hook**: `src/lib/hooks/useTasksEnhanced.ts`

---

## 👥 Contributors

- **Development**: Claude
- **Requested by**: Rahim10020

---

## 📝 License

Same as Focusly project license.

---

**Last Updated**: 2025-11-17
**Version**: 2.0.0
