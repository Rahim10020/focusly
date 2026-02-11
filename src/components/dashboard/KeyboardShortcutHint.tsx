/**
 * @fileoverview Keyboard shortcut hint button component
 */

'use client';

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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground"
      >
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <path d="M6 8h.001"></path>
        <path d="M10 8h.001"></path>
        <path d="M14 8h.001"></path>
        <path d="M18 8h.001"></path>
        <path d="M8 12h.001"></path>
        <path d="M12 12h.001"></path>
        <path d="M16 12h.001"></path>
        <path d="M7 16h10"></path>
      </svg>
    </button>
  );
}
