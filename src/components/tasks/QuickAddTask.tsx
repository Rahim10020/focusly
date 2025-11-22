/**
 * @fileoverview QuickAddTask component for rapid task creation.
 * Provides a minimal interface for quickly adding tasks with just a title.
 * Supports keyboard shortcuts for efficient workflow.
 */

'use client';

import { useState, KeyboardEvent } from 'react';
import Button from '../ui/Button';

/**
 * Props for the QuickAddTask component.
 */
interface QuickAddTaskProps {
    onAdd: (title: string) => void;
    /** Custom placeholder text for the input */
    placeholder?: string;
}

/**
 * QuickAddTask component provides a streamlined interface for rapid task creation.
 * Features an expandable input that appears when clicked, with keyboard shortcuts
 * for saving (Enter) and canceling (Escape). Ideal for quick task capture.
 *
 * @param {QuickAddTaskProps} props - Component props
 * @param {function} props.onAdd - Callback when task is added with the title
 * @param {string} [props.placeholder] - Custom placeholder text
 *
 * @example
 * <QuickAddTask
 *   onAdd={(title) => createTask({ title })}
 *   placeholder="What do you need to do?"
 * />
 */
export default function QuickAddTask({
    onAdd,
    placeholder = 'Add a task... Press Enter to save, Esc to cancel',
}: QuickAddTaskProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [value, setValue] = useState('');

    const handleSubmit = () => {
        if (value.trim()) {
            onAdd(value.trim());
            setValue('');
            setIsExpanded(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            setValue('');
            setIsExpanded(false);
        }
    };

    const handleCancel = () => {
        setValue('');
        setIsExpanded(false);
    };

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full group flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-left cursor-pointer"
            >
                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-muted-foreground/40 group-hover:border-primary/60 flex items-center justify-center transition-all">
                    <svg
                        className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </div>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    Add a task
                </span>
            </button>
        );
    }

    return (
        <div className="p-4 rounded-xl border-2 border-primary/30 bg-card shadow-md space-y-3 animate-scale-in">
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus
                className="w-full px-0 py-2 bg-transparent text-foreground text-base font-medium placeholder:text-muted-foreground focus:outline-none"
            />

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Enter</kbd>
                    <span>to save</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono ml-2">Esc</kbd>
                    <span>to cancel</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!value.trim()}
                    >
                        Add Task
                    </Button>
                </div>
            </div>
        </div>
    );
}
