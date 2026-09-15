# Leaderboard Responsive Plan

## Overview
Make the leaderboard page fully responsive on mobile devices by adjusting layout, typography, and component behavior across all breakpoints.

## Affected Files
- `src/app/(app)/leaderboard/page.tsx`
- `src/app/(app)/leaderboard/_components/LeaderboardHeader.tsx`
- `src/app/(app)/leaderboard/_components/LeaderboardPodium.tsx`
- `src/app/(app)/leaderboard/_components/LeaderboardList.tsx`
- `src/app/(app)/leaderboard/_components/LeaderboardPagination.tsx`
- `src/app/globals.css` (optional typography tweaks)

## Issues to Fix

### 1. LeaderboardHeader
- **Problem**: `text-4xl` is too large on mobile (not covered by existing media query).
- **Fix**: Add responsive text sizing — use `text-3xl sm:text-4xl` or add a media query for `text-4xl`.

### 2. LeaderboardPodium
- **Problem**: On mobile (`grid-cols-1`), the order is 2nd → 1st → 3rd due to `md:order-*` classes.
- **Fix**: On mobile, display 1st place first. Options:
  - Remove `md:order-*` and use a column reverse on mobile, OR
  - Conditionally render order based on screen size, OR
  - Use `flex-col` with conditional ordering.
- **Problem**: Avatar sizes (`w-20 h-20` for 1st, `w-16 h-16` for others) are too large on mobile.
- **Fix**: Reduce avatar sizes on mobile (e.g., `w-16 h-16 md:w-20 md:h-20`).

### 3. LeaderboardList
- **Problem**: The "Send Friend Request" button may be cramped on mobile.
- **Fix**: Reduce padding and font sizes on mobile for list items. Consider stacking the action button below the user info on mobile.

### 4. LeaderboardPagination
- **Problem**: Page number buttons (`w-10 h-10`) can overflow horizontally on mobile.
- **Fix**: On mobile, show only a minimal pagination (Previous/Next + current page indicator) instead of 5 page number buttons.

### 5. Your Rank Card (page.tsx)
- **Problem**: Flex layout with `text-3xl` rank number and `gap-4` may be cramped.
- **Fix**: Stack vertically on mobile with responsive text sizes.

### 6. Tabs
- **Problem**: The tab bar uses `max-w-md mx-auto` which is okay but could be more readable.
- **Fix**: Keep as-is or reduce padding on mobile.

## Implementation Plan

### Step 1: Update `globals.css` (optional)
- Add `text-4xl` to the mobile font size adjustment media query if needed.

### Step 2: Update `LeaderboardHeader.tsx`
- Change `text-4xl` to `text-3xl sm:text-4xl` for better mobile scaling.

### Step 3: Update `LeaderboardPodium.tsx`
- Change grid to `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3` — on tablets, show 2 columns (1st and 2nd side by side, 3rd below), on desktop show 3.
- Remove `md:order-*` classes and use natural DOM order (1st, 2nd, 3rd) so mobile stacking is correct.
- Reduce avatar sizes: `w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20` for 1st place, similar scaling for others.

### Step 4: Update `LeaderboardList.tsx`
- Reduce avatar size on mobile: `w-10 h-10 sm:w-12 sm:h-12`.
- Reduce gap on mobile: `gap-2 sm:gap-4`.
- Stack friend request button below username on mobile (use `flex-col sm:flex-row`).

### Step 5: Update `LeaderboardPagination.tsx`
- On mobile (below `sm` breakpoint), hide page number buttons and show only Previous/Next with current page indicator.
- Use conditional rendering based on `totalPages` and screen size.

### Step 6: Update `page.tsx` (Your Rank Card)
- Stack vertically on mobile with responsive text sizes.
- Reduce padding and gap on mobile.

## Validation
- Run `npm run lint` and `npm run typecheck` after changes.
- Test in browser dev tools at mobile breakpoints (320px, 375px, 414px, 768px, 1024px).