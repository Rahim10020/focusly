import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * @fileoverview TaskTitleInput component for entering task title.
 */

interface TaskTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function TaskTitleInput({
  value,
  onChange,
  placeholder = "What needs to be done?",
  autoFocus = false,
}: TaskTitleInputProps) {
  const isMobile = useIsMobile();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!isMobile || !textArea) return;

    textArea.style.height = "auto";
    textArea.style.height = `${textArea.scrollHeight}px`;
  }, [isMobile, value]);

  return (
    <div className="space-y-2">
      {isMobile ? (
        <textarea
          ref={textAreaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={1}
          className="w-full resize-none overflow-hidden break-words border-0 bg-transparent p-0 text-4xl font-medium leading-tight text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full border-0 bg-transparent p-0 text-4xl font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
        />
      )}
    </div>
  );
}
