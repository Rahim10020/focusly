/**
 * @fileoverview Task checkbox component
 */

"use client";

import { CheckboxCheckIcon } from "../../shared/icons";

interface TaskCheckboxProps {
  completed: boolean;
  onToggle: () => void;
}

export function TaskCheckbox({ completed, onToggle }: TaskCheckboxProps) {
  return (
    <button
      onClick={onToggle}
      className={`shrink-0 w-6 h-6 rounded-full cursor-pointer border-2 flex items-center justify-center transition-all duration-300 mt-0.5 ${
        completed
          ? "bg-success border-success scale-110"
          : "border-primary hover:bg-primary/10 hover:scale-110"
      }`}
    >
      {completed && (
        <CheckboxCheckIcon size={14} className="text-white animate-scale-in" />
      )}
    </button>
  );
}
