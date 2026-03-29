/**
 * @fileoverview Keyboard shortcut hint button component
 */

"use client";

import KeyboardIcon from "../../shared/icons/KeyboardIcon";

interface KeyboardShortcutHintProps {
  onClick: () => void;
}

export function KeyboardShortcutHint({ onClick }: KeyboardShortcutHintProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 p-3 bg-card border-2 border-border rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
      title="Keyboard shortcuts (Shift + ?)"
    >
      <KeyboardIcon size={20} className="text-foreground" />
    </button>
  );
}
