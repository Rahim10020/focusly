/**
 * @fileoverview TaskModalHeader component for modal header.
 */

import { CloseLgIcon, ExpandIcon, ShrinkIcon } from "@/components/shared/icons";

interface TaskModalHeaderProps {
  isEditing: boolean;
  isFullScreen: boolean;
  onFullScreenToggle: () => void;
  onClose: () => void;
}

export default function TaskModalHeader({
  isEditing,
  isFullScreen,
  onFullScreenToggle,
  onClose,
}: TaskModalHeaderProps) {
  return (
    <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
      <h2 className="text-xl font-semibold text-foreground">
        {isEditing ? "Edit Task" : "Create New Task"}
      </h2>
      <div className="flex items-center gap-3">
        <button
          onClick={onFullScreenToggle}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
          title={
            isFullScreen
              ? "Switch to compact mode"
              : "Switch to full screen mode"
          }
        >
          {isFullScreen ? <ShrinkIcon size={20} /> : <ExpandIcon size={20} />}
        </button>
        <button
          onClick={onClose}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <CloseLgIcon size={20} />
        </button>
      </div>
    </div>
  );
}
