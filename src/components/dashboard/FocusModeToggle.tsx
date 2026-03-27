/**
 * @fileoverview Focus mode toggle button component
 */

"use client";

import Button from "@/components/ui/Button";
import { CircleIcon, CloseLgIcon } from "../shared/icons";

interface FocusModeToggleProps {
  isFocusMode: boolean;
  onToggle: () => void;
}

export function FocusModeToggle({
  isFocusMode,
  onToggle,
}: FocusModeToggleProps) {
  return (
    <Button
      onClick={onToggle}
      className="fixed top-6 right-6 z-50 gap-2"
      variant={isFocusMode ? "primary" : "outline"}
      title="Toggle Focus Mode (F)"
    >
      {isFocusMode ? (
        <>
          <CloseLgIcon size={16} />
          Quitter Focus
        </>
      ) : (
        <>
          {/* A changer apres quand j'aurai une meilleure icone */}
          <CircleIcon size={16} />
          Mode Focus
        </>
      )}
    </Button>
  );
}
