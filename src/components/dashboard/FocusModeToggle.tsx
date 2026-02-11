/**
 * @fileoverview Focus mode toggle button component
 */

'use client';

import Button from '@/components/ui/Button';

interface FocusModeToggleProps {
  isFocusMode: boolean;
  onToggle: () => void;
}

export function FocusModeToggle({ isFocusMode, onToggle }: FocusModeToggleProps) {
  return (
    <Button
      onClick={onToggle}
      className="fixed top-6 right-6 z-50 gap-2"
      variant={isFocusMode ? 'primary' : 'outline'}
      title="Toggle Focus Mode (F)"
    >
      {isFocusMode ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Quitter Focus
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6m0 6v6M1 12h6m6 0h6" />
          </svg>
          Mode Focus
        </>
      )}
    </Button>
  );
}
