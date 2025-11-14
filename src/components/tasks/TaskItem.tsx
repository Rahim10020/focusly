'use client';

import { useState } from 'react';
import { Task, Tag, DOMAINS, getDomainFromSubDomain } from '@/types';
import Button from '@/components/ui/Button';
import PriorityBadge from '@/components/ui/PriorityBadge';
import TagBadge from '@/components/ui/TagBadge';
import DueDateBadge from '@/components/ui/DueDateBadge';
import TaskDetailsModal from './TaskDetailsModal';
import { useSound } from '@/lib/hooks/useSound';

interface TaskItemProps {
    task: Task;
    isActive: boolean;
    tags: Tag[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onAddSubTask: (taskId: string, title: string) => void;
    onToggleSubTask: (taskId: string, subTaskId: string) => void;
    onDeleteSubTask: (taskId: string, subTaskId: string) => void;
    isDragging?: boolean;
    dragHandleProps?: any;
}

export default function TaskItem({
    task,
    isActive,
    tags,
    onToggle,
    onDelete,
    onSelect,
    onUpdate,
    onAddSubTask,
    onToggleSubTask,
    onDeleteSubTask,
    isDragging,
    dragHandleProps,
}: TaskItemProps) {
    const [showDetails, setShowDetails] = useState(false);
    const { playWorkComplete } = useSound();
    const taskTags = tags.filter(tag => task.tags?.includes(tag.id));

    const completedSubTasks = (task.subTasks || []).filter(st => st.completed).length;
    const totalSubTasks = (task.subTasks || []).length;

    return (
        <>
            <div
                className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 group ${isActive
                    ? 'bg-primary/10 border-2 border-primary/30 shadow-md'
                    : 'bg-card hover:bg-accent/50 border-2 border-border hover:border-primary/20 hover:shadow-sm'
                    } ${isDragging ? 'opacity-50 scale-95 rotate-1' : ''}`}
            >
                {/* Drag Handle */}
                <div
                    {...dragHandleProps}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-primary transition-all mt-1"
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
                        <line x1="8" y1="6" x2="8" y2="6.01"></line>
                        <line x1="16" y1="6" x2="16" y2="6.01"></line>
                        <line x1="8" y1="12" x2="8" y2="12.01"></line>
                        <line x1="16" y1="12" x2="16" y2="12.01"></line>
                        <line x1="8" y1="18" x2="8" y2="18.01"></line>
                        <line x1="16" y1="18" x2="16" y2="18.01"></line>
                    </svg>
                </div>

                {/* Checkbox */}
                <button
                    onClick={() => {
                        // Jouer le son de fin de tâche si on la marque comme terminée
                        if (!task.completed) {
                            playWorkComplete();
                        }
                        onToggle(task.id);
                    }}
                    className={`flex-shrink-0 w-6 h-6 rounded-full cursor-pointer border-2 flex items-center justify-center transition-all duration-300 mt-0.5 ${
                        task.completed
                            ? 'bg-success border-success scale-110'
                            : 'border-primary hover:bg-primary/10 hover:scale-110'
                    }`}
                >
                    {task.completed && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white animate-scale-in"
                        >
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                    {/* Title and Active badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <p
                            className={`text-base font-medium ${task.completed
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'
                                }`}
                        >
                            {task.title}
                        </p>
                        {isActive && (
                            <span className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-semibold animate-pulse-soft">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <circle cx="10" cy="10" r="5"/>
                                </svg>
                                Active
                            </span>
                        )}
                    </div>

                    {/* Priority, Tags, Due Date, Subdomain */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {task.priority && <PriorityBadge priority={task.priority} />}
                        {taskTags.map(tag => (
                            <TagBadge key={tag.id} tag={tag} />
                        ))}
                        {task.dueDate && (
                            <DueDateBadge dueDate={task.dueDate} completed={task.completed} />
                        )}
                        {task.subDomain && (
                            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                                {DOMAINS[getDomainFromSubDomain(task.subDomain)].subDomains[task.subDomain]}
                            </span>
                        )}
                    </div>

                    {/* Sub-tasks progress */}
                    {totalSubTasks > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                                <polyline points="9 11 12 14 22 4"></polyline>
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                            <span>{completedSubTasks} / {totalSubTasks} sub-tasks</span>
                        </div>
                    )}

                    {/* Pomodoro Count */}
                    {task.pomodoroCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                            🍅 {task.pomodoroCount} pomodoro{task.pomodoroCount > 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                    {/* View Details */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(true)}
                        className="md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-accent"
                        title="View details"
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
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </Button>

                    {/* Set Active / Unset */}
                    {!task.completed && !isActive && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelect(task.id)}
                            className="md:opacity-0 md:group-hover:opacity-100 transition-all"
                        >
                            Set Active
                        </Button>
                    )}

                    {isActive && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onSelect(null)}
                        >
                            Unset
                        </Button>
                    )}

                    {/* Delete */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(task.id)}
                        className="md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-error/10 hover:text-error"
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

            {/* Details Modal */}
            {showDetails && (
                <TaskDetailsModal
                    task={task}
                    tags={tags}
                    onClose={() => setShowDetails(false)}
                    onUpdate={(updates) => onUpdate(task.id, updates)}
                    onAddSubTask={(title) => onAddSubTask(task.id, title)}
                    onToggleSubTask={(subTaskId) => onToggleSubTask(task.id, subTaskId)}
                    onDeleteSubTask={(subTaskId) => onDeleteSubTask(task.id, subTaskId)}
                />
            )}
        </>
    );
}