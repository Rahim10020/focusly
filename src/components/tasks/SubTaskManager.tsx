'use client';

import { useState, useRef, useEffect } from 'react';
import { SubTask } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface SubTaskManagerProps {
    subTasks: SubTask[];
    onAdd: (title: string) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder?: (startIndex: number, endIndex: number) => void;
    readonly?: boolean;
}

export default function SubTaskManager({
    subTasks,
    onAdd,
    onToggle,
    onDelete,
    onReorder,
    readonly = false
}: SubTaskManagerProps) {
    const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAddSubTask = () => {
        if (newSubTaskTitle.trim()) {
            onAdd(newSubTaskTitle.trim());
            setNewSubTaskTitle('');
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubTask();
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newSubTasks = [...subTasks];
        const draggedItem = newSubTasks[draggedIndex];
        newSubTasks.splice(draggedIndex, 1);
        newSubTasks.splice(index, 0, draggedItem);

        setDraggedIndex(index);
        onReorder?.(draggedIndex, index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const completedCount = subTasks.filter(st => st.completed).length;
    const totalCount = subTasks.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    >
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    <span>Subtasks</span>
                    {totalCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                            ({completedCount}/{totalCount})
                        </span>
                    )}
                </button>

                {totalCount > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                            {progress}%
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div
                className={`space-y-2 overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                {/* Add Subtask Input */}
                {!readonly && (
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            type="text"
                            value={newSubTaskTitle}
                            onChange={(e) => setNewSubTaskTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add a subtask..."
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            onClick={handleAddSubTask}
                            disabled={!newSubTaskTitle.trim()}
                            variant="outline"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </Button>
                    </div>
                )}

                {/* Subtask List */}
                {subTasks.length > 0 ? (
                    <div className="space-y-1">
                        {subTasks
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((subTask, index) => (
                                <div
                                    key={subTask.id}
                                    draggable={!readonly && onReorder !== undefined}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-2 p-2 bg-muted rounded-lg group transition-all ${draggedIndex === index
                                            ? 'opacity-50'
                                            : 'hover:bg-accent'
                                        } ${!readonly && onReorder ? 'cursor-move' : ''}`}
                                >
                                    {/* Drag Handle */}
                                    {!readonly && onReorder && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-muted-foreground"
                                            >
                                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                                <line x1="3" y1="18" x2="21" y2="18"></line>
                                            </svg>
                                        </div>
                                    )}

                                    {/* Checkbox */}
                                    <button
                                        type="button"
                                        onClick={() => onToggle(subTask.id)}
                                        disabled={readonly}
                                        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${subTask.completed
                                                ? 'bg-primary border-primary'
                                                : 'border-border hover:border-primary'
                                            } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
                                    >
                                        {subTask.completed && (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        )}
                                    </button>

                                    {/* Title */}
                                    <span
                                        className={`flex-1 text-sm ${subTask.completed
                                                ? 'line-through text-muted-foreground'
                                                : 'text-foreground'
                                            }`}
                                    >
                                        {subTask.title}
                                    </span>

                                    {/* Delete Button */}
                                    {!readonly && (
                                        <button
                                            type="button"
                                            onClick={() => onDelete(subTask.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 p-1 rounded cursor-pointer"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                    </div>
                ) : (
                    !readonly && (
                        <div className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
                            No subtasks yet. Add one above!
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
