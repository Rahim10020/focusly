'use client';

import { useState } from 'react';
import { Task, Tag, DOMAINS, getDomainFromSubDomain } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PriorityBadge from '@/components/ui/PriorityBadge';
import TagBadge from '@/components/ui/TagBadge';
import SubTaskList from './SubTaskList';

interface TaskDetailsModalProps {
    task: Task;
    tags: Tag[];
    onClose: () => void;
    onUpdate: (updates: Partial<Task>) => void;
    onAddSubTask: (title: string) => void;
    onToggleSubTask: (subTaskId: string) => void;
    onDeleteSubTask: (subTaskId: string) => void;
}

export default function TaskDetailsModal({
    task,
    tags,
    onClose,
    onUpdate,
    onAddSubTask,
    onToggleSubTask,
    onDeleteSubTask,
}: TaskDetailsModalProps) {
    const [notes, setNotes] = useState(task.notes || '');
    const [dueDate, setDueDate] = useState(
        task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    );

    const handleSave = () => {
        onUpdate({
            notes: notes.trim() || undefined,
            dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        });
    };

    const taskTags = tags.filter(tag => task.tags?.includes(tag.id));

    const isOverdue = task.dueDate && task.dueDate < Date.now() && !task.completed;
    const isDueToday = task.dueDate &&
        new Date(task.dueDate).toDateString() === new Date().toDateString();

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                        <h2 className="text-2xl font-bold text-foreground">
                            {task.title}
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            {task.priority && <PriorityBadge priority={task.priority} />}
                            {taskTags.map(tag => (
                                <TagBadge key={tag.id} tag={tag} />
                            ))}
                            {task.subDomain && (
                                <span className="text-xs px-2 py-1 rounded-full bg-accent text-accent-foreground">
                                    {DOMAINS[getDomainFromSubDomain(task.subDomain)].subDomains[task.subDomain]}
                                </span>
                            )}
                            {task.pomodoroCount > 0 && (
                                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                    🍅 {task.pomodoroCount} pomodoros
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
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

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Due Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Due Date
                        </label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                        {isOverdue && (
                            <p className="text-xs text-black dark:text-white">
                                ⚠️ This task is overdue!
                            </p>
                        )}
                        {isDueToday && !isOverdue && (
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                📅 Due today
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this task..."
                            className="w-full px-4 py-3 bg-muted text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[120px]"
                        />
                    </div>

                    {/* Sub-tasks */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Sub-tasks
                        </label>
                        <div className="p-4 bg-muted rounded-xl">
                            <SubTaskList
                                subTasks={task.subTasks || []}
                                onAdd={onAddSubTask}
                                onToggle={onToggleSubTask}
                                onDelete={onDeleteSubTask}
                            />
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
                        <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                        {task.completedAt && (
                            <p>Completed: {new Date(task.completedAt).toLocaleString()}</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3 justify-end">
                    <Button onClick={onClose} variant="secondary">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            handleSave();
                            onClose();
                        }}
                    >
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}