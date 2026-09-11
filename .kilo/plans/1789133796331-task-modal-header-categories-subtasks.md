# Task Modal Responsiveness Plan: Move Categories & Subtasks to Header

## Goal
Improve modal responsiveness by moving "Categories" and "Subtasks" from tabs (compact) / sidebar (fullscreen) into dropdown selectors in the modal header, next to the fullscreen toggle.

## Current State
- **Compact mode**: 3 tabs (Details, Categories, Subtasks) - only one visible at a time
- **Fullscreen mode**: Details left (3/5), Categories + Subtasks right sidebar (2/5) as collapsible sections
- `TaskViewTabs.tsx` handles tab navigation (to be removed)
- `TaskModalHeader.tsx` has title, fullscreen toggle, close button

## Target State
- **Header**: Title | [Categories dropdown] [Subtasks dropdown] [Fullscreen toggle] [Close]
- **Content**: Always shows Details form (TaskFormContent / TaskFormContentFullscreen)
- No tabs, no sidebar - Categories/Subtasks open as dropdowns/popovers from header

## Files to Modify

### 1. `src/components/ui/Popover.tsx` (NEW)
Create a reusable Popover component for dropdowns:
- Trigger button + floating content panel
- Click outside to close
- ESC key to close
- Portal rendering (or relative positioning)
- Props: `trigger`, `content`, `open`, `onOpenChange`, `align` ("start" | "end")

### 2. `src/app/(app)/tasks/_components/modals/TaskModalHeader.tsx`
**Modify props interface:**
```tsx
interface TaskModalHeaderProps {
  isEditing: boolean;
  isFullScreen: boolean;
  onFullScreenToggle: () => void;
  onClose: () => void;
  // NEW:
  selectedSubDomain?: SubDomain;
  onSubDomainChange: (value: SubDomain | undefined) => void;
  subTasks: { title: string; completed: boolean }[];
  onSubTasksChange: (tasks: { title: string; completed: boolean }[]) => void;
}
```

**Add in header (between title and fullscreen toggle):**
- Categories dropdown button (shows selected category name or "Categories")
- Subtasks dropdown button (shows count badge: "3/5")
- Both use `<Popover>` with CategorySelector/SubTaskManager as content

### 3. `src/app/(app)/tasks/_components/forms/CategorySelector.tsx`
**Adapt for dropdown usage:**
- Add `compact?: boolean` prop
- When compact: reduce padding, smaller search input, tighter spacing
- Max height constraint (e.g., `max-h-[300px] overflow-y-auto`)
- Keep existing functionality

### 4. `src/app/(app)/tasks/_components/items/SubTaskManager.tsx`
**Adapt for dropdown usage:**
- Add `compact?: boolean` prop
- When compact: smaller input, tighter list items, max-height scroll
- Keep add/toggle/remove functionality

### 5. `src/app/(app)/tasks/_components/modals/TaskEditModal.tsx`
**Major refactor:**
- Remove `activeTab` state and `TaskViewTabs` import/usage
- Remove `isCategoriesOpen`, `isSubTasksOpen` state
- Remove sidebar rendering in fullscreen mode (lines 292-361)
- Simplify content: always render `TaskFormContent` / `TaskFormContentFullscreen`
- Pass category/subtask state & handlers to `TaskModalHeader`
- Remove `CategorySelector` and `SubTaskManager` imports from this file

### 6. `src/app/(app)/tasks/_components/modals/TaskViewTabs.tsx`
**DELETE** - no longer needed

## Component Interaction Flow

```
TaskEditModal (state owner)
  ├── selectedSubDomain, setSelectedSubDomain
  ├── subTasks, setSubTasks
  ├── TaskModalHeader
  │     ├── Categories Popover → CategorySelector(compact)
  │     └── Subtasks Popover → SubTaskManager(compact)
  ├── TaskFormContent / TaskFormContentFullscreen (unchanged)
  └── TaskModalFooter (unchanged)
```

## Responsive Behavior

| Breakpoint | Header Layout |
|------------|---------------|
| Mobile (<640px) | Stack: Title row | Categories + Subtasks row | Actions row |
| Tablet (640-1024px) | Title | Categories | Subtasks | Actions (flex-wrap) |
| Desktop (>1024px) | Title | Categories | Subtasks | Actions (single row) |

Use `flex-wrap` and `gap-2` on header actions container.

## Edge Cases

1. **Many categories**: CategorySelector already has search - ensure it works in compact dropdown
2. **Many subtasks**: SubTaskManager needs max-height + scroll in dropdown
3. **Click outside**: Popover must close on outside click (document listener)
4. **Keyboard**: ESC closes popover; Tab traps in open popover
5. **Initial data**: Header receives initialData.subDomain and initialData.subTasks
6. **Fullscreen toggle**: Should not affect header dropdowns (they stay in header)

## Testing Checklist

- [ ] Compact mode: header shows Categories + Subtasks dropdowns
- [ ] Fullscreen mode: header shows Categories + Subtasks dropdowns (no sidebar)
- [ ] Category selection works in dropdown
- [ ] Subtask add/toggle/remove works in dropdown
- [ ] Badge counts update correctly
- [ ] Click outside closes dropdowns
- [ ] ESC closes dropdowns
- [ ] Mobile layout stacks properly
- [ ] No console errors
- [ ] Existing tests pass (if any)

## Rollout

1. Create `Popover.tsx` component
2. Update `CategorySelector` and `SubTaskManager` with `compact` prop
3. Update `TaskModalHeader` with new props and dropdowns
4. Refactor `TaskEditModal` to remove tabs/sidebar
5. Delete `TaskViewTabs.tsx`
6. Test both compact and fullscreen modes