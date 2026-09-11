"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: "start" | "end";
  className?: string;
}

export default function Popover({
  trigger,
  content,
  open,
  onOpenChange,
  align = "end",
  className = "",
}: PopoverProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: align === "end" ? rect.right - 320 : rect.left,
    });
  }, [align]);

  useEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const popover = document.querySelector('[data-popover]');
      if (popover?.contains(target)) return;
      onOpenChange(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    const handleResize = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [open, onOpenChange, updatePosition]);

  if (typeof document === "undefined") return null;

  return (
    <div className="relative inline-flex">
      <div
        ref={triggerRef}
        onClick={() => onOpenChange(!open)}
        className="inline-flex"
      >
        {trigger}
      </div>
      {open &&
        position &&
        createPortal(
          <div
            data-popover
            className={`fixed z-[60] w-80 max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg ${className}`}
            style={{ top: position.top, left: position.left }}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
}
