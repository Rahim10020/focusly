'use client';

import { Task, Tag } from '@/types';
import Button from '@/components/ui/Button';
import PriorityBadge from '@/components/ui/PriorityBadge';
import TagBadge from '@/components/ui/TagBadge';

interface TaskItemProps {
    task: Task;
    isActive: boolean;
    tags: Tag[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string | null) => void;
}

export default function TaskItem({
    task,
    isActive,
    tags,
    onToggle,
    onDelete,
    onSelect,
}: TaskItemProps) {
    const taskTags = tags.filter(tag => task.tags?.includes(tag.id));

    return (
        <div
            className={`flex items-start gap-3 p-3 rounded-xl transition-all group ${isActive
                ? 'bg-primary/10 border-2 border-primary'
                : 'bg-muted hover:bg-accent border-2 border-transparent'
                }`}
        >
            <button
                onClick={() => onToggle(task.id)}
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center hover:bg-primary transition-colors mt-0.5"
            >
                {task.completed && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary-foreground"
                    >
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                )}
            </button>

            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <p
                        className={`text-sm ${task.completed
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                            }`}
                    >
                        {task.title}
                    </p>
                    {isActive && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                            Active
                        </span>
                    )}
                </div>

                {/* Priority and Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                    {task.priority && <PriorityBadge priority={task.priority} />}
                    {taskTags.map(tag => (
                        <TagBadge key={tag.id} tag={tag} />
                    ))}
                </div>

                {/* Pomodoro Count */}
                {task.pomodoroCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                        🍅 {task.pomodoroCount} pomodoro{task.pomodoroCount > 1 ? 's' : ''}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-1">
                {!task.completed && !isActive && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelect(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                        Set Active
                    </Button>
                )}

                {isActive && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelect(null)}
                        className="text-xs"
                    >
                        Unset
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
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
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </Button>
            </div>
        </div>
    );
}