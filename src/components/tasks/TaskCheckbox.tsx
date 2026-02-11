/**
 * @fileoverview Task checkbox component
 */

'use client';

interface TaskCheckboxProps {
  completed: boolean;
  onToggle: () => void;
}

export function TaskCheckbox({ completed, onToggle }: TaskCheckboxProps) {
  return (
    <button
      onClick={onToggle}
      className={`shrink-0 w-6 h-6 rounded-full cursor-pointer border-2 flex items-center justify-center transition-all duration-300 mt-0.5 ${completed
        ? 'bg-success border-success scale-110'
        : 'border-primary hover:bg-primary/10 hover:scale-110'
        }`}
    >
      {completed && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white animate-scale-in"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </button>
  );
}
