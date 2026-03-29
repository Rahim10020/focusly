/**
 * @fileoverview Focus mode toggle button component
 */

"use client";

import Button from "@/components/ui/Button";
import { CircleIcon, CloseLgIcon } from "@/components/shared/icons";

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
      className="fixed top-2.5 right-50 z-50"
      variant={isFocusMode ? "outline" : "primary"}
      title="Toggle Focus Mode (F)"
    >
      {isFocusMode ? (
        <>
          <CloseLgIcon size={16} />
        </>
      ) : (
        <>
          {/* A changer apres quand j'aurai une meilleure icone */}
          <CircleIcon size={16} />
        </>
      )}
    </Button>
  );
}
