# Plan: Reduce board column minimum height when empty

## Context

In board view (`TaskBoardView.tsx`), each Kanban column has `min-h-[500px]` (line 105). When a column has no tasks, it is still forced to 500px tall, making the board look very large and empty.

**Root cause:** `min-h-[500px]` on the column `div` at `src/app/(app)/tasks/_components/board/TaskBoardView.tsx:105`.

## Design Decisions

1. **Dynamic min-height based on content:** When a column is empty, use a smaller min-height (`min-h-[200px]`). When tasks exist, keep a comfortable min-height so short lists still look balanced (`min-h-[350px]`).
2. **No change to `TaskBoardCard` itself** — cards already size to content. The issue is the column container, not individual cards.
3. **No change to the "No tasks" placeholder** — it is already vertically centered and visually fine; only the column height needs reduction.

## Changes

### File: `src/app/(app)/tasks/_components/board/TaskBoardView.tsx`

**Line 105** — Replace the static `min-h-[500px]` with a conditional class:

```tsx
// Before:
className="flex flex-col min-h-[500px]"

// After:
className={`flex flex-col ${columnTasks.length === 0 ? "min-h-[200px]" : "min-h-[350px]"}`}
```

This:
- Shrinks empty columns from 500px → 200px (the complaint scenario).
- Keeps non-empty columns at 350px min (down from 500px) so they still look substantial but not oversized. Columns with multiple tasks will still grow naturally beyond the min via content.

## Validation

- Board view with 0 tasks in a column → column should render ~200px tall (collapses to show "No tasks" placeholder in a compact space).
- Board view with tasks in a column → column should render at least 350px, growing with content.
- All three columns (To Do, In Progress, Done) should behave consistently.
- Run typecheck: `npx tsc --noEmit` (if configured) or the project's lint/build command.
