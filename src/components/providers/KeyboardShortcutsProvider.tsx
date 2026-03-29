"use client";

import {
  useKeyboardShortcuts,
  GLOBAL_SHORTCUTS,
} from "@/hooks/useKeyboardShortcuts";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { ROUTES } from "@/constants";

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export default function KeyboardShortcutsProvider({
  children,
}: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const { toggleTheme } = useTheme();

  // Global keyboard shortcuts that work on all pages
  useKeyboardShortcuts([
    {
      ...GLOBAL_SHORTCUTS.TOGGLE_THEME,
      action: toggleTheme,
    },
    {
      ...GLOBAL_SHORTCUTS.SHOW_SHORTCUTS,
      action: () => {
        // This will be handled by the modal in each page
        // For now, just focus on navigation shortcuts
      },
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_HOME,
      action: () => router.push(ROUTES.HOME),
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_STATS,
      action: () => router.push(ROUTES.STATS),
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_SETTINGS,
      action: () => router.push(ROUTES.SETTINGS),
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_LEADERBOARD,
      action: () => router.push(ROUTES.LEADERBOARD),
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_FRIENDS,
      action: () => router.push(ROUTES.FRIENDS),
    },
  ]);

  return <>{children}</>;
}
