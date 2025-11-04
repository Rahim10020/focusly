'use client';

import { useState } from 'react';
import { SubTask } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface SubTaskListProps {
    subTasks: SubTask[];
    onAdd: (title: string) => void;
    onToggle: (subTaskId: string) => void;
    onDelete: (subTaskId: string) => void;
}

export default function SubTaskList({
    subTasks,
    onAdd,
    onToggle,
    onDelete
}: SubTaskListProps) {
    const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
    const [showInput, setShowInput] = useState(false);

    const handleAdd = () => {
        if (newSubTaskTitle.trim()) {
            onAdd(newSubTaskTitle.trim());
            setNewSubTaskTitle('');
            setShowInput(false);
        }
    };

    const completedCount = subTasks.filter(st => st.completed).length;
    const totalCount = subTasks.length;

    return (
        <div className="space-y-3">
            {/* Progress bar */}
            {totalCount > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Sub-tasks progress</span>
                        <span>{completedCount} / {totalCount}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${(completedCount / totalCount) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Sub-tasks list */}
            {subTasks.length > 0 && (
                <div className="space-y-1">
                    {subTasks.map(subTask => (
                        <div
                            key={subTask.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <button
                                onClick={() => onToggle(subTask.id)}
                                className="flex-shrink-0 w-4 h-4 rounded border-2 border-muted-foreground flex items-center justify-center hover:border-primary transition-colors"
                            >
                                {subTask.completed && (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-primary"
                                    >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </button>

                            <span
                                className={`flex-1 text-sm ${subTask.completed
                                    ? 'line-through text-muted-foreground'
                                    : 'text-foreground'
                                    }`}
                            >
                                {subTask.title}
                            </span>

                            <button
                                onClick={() => onDelete(subTask.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-black dark:hover:text-white"
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
                        </div>
                    ))}
                </div>
            )}

            {/* Add sub-task */}
            {showInput ? (
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={newSubTaskTitle}
                        onChange={(e) => setNewSubTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdd();
                            if (e.key === 'Escape') {
                                setShowInput(false);
                                setNewSubTaskTitle('');
                            }
                        }}
                        placeholder="Sub-task title..."
                        className="flex-1 text-sm"
                        autoFocus
                    />
                    <Button onClick={handleAdd} size="sm" disabled={!newSubTaskTitle.trim()}>
                        Add
                    </Button>
                    <Button
                        onClick={() => {
                            setShowInput(false);
                            setNewSubTaskTitle('');
                        }}
                        variant="ghost"
                        size="sm"
                    >
                        Cancel
                    </Button>
                </div>
            ) : (
                <button
                    onClick={() => setShowInput(true)}
                    className="flex items-center cursor-pointer gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
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
                    Add sub-task
                </button>
            )}
        </div>
    );
}