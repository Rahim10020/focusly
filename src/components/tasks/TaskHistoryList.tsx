'use client';

import { useState } from 'react';
import { Task, Tag } from '@/types';
import PriorityBadge from '@/components/ui/PriorityBadge';
import TagBadge from '@/components/ui/TagBadge';

interface TaskHistoryListProps {
    completedTasks: Task[];
    failedTasks: Task[];
    tags: Tag[];
}

export default function TaskHistoryList({
    completedTasks,
    failedTasks,
    tags
}: TaskHistoryListProps) {
    const [activeTab, setActiveTab] = useState<'completed' | 'failed'>('completed');

    const renderTask = (task: Task, isFailed: boolean) => {
        return (
            <div
                key={task.id}
                className={`p-4 rounded-xl border-2 transition-all ${isFailed
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                    : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    }`}
            >
                <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${isFailed ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-foreground flex-1">
                                {task.title}
                            </h3>
                            {task.priority && <PriorityBadge priority={task.priority} />}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span>
                                {isFailed ? 'Failed' : 'Completed'} on {new Date(task.completedAt || task.createdAt).toLocaleDateString()}
                            </span>
                            {task.pomodoroCount > 0 && (
                                <span>• {task.pomodoroCount} pomodoro{task.pomodoroCount !== 1 ? 's' : ''}</span>
                            )}
                        </div>

                        {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {tags.filter(tag => task.tags?.includes(tag.id)).map(tag => (
                                    <TagBadge key={tag.id} tag={tag} />
                                ))}
                            </div>
                        )}

                        {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const completedFiltered = completedTasks.slice().reverse(); // Most recent first
    const failedFiltered = failedTasks.slice().reverse();

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === 'completed'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Completed ({completedFiltered.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('failed')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === 'failed'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Failed ({failedFiltered.length})
                    </div>
                </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'completed' && (
                    <div className="space-y-3">
                        {completedFiltered.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {completedFiltered.map(task =>
                                    renderTask(task, false)
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No completed tasks yet. Start completing tasks to see your progress!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'failed' && (
                    <div className="space-y-3">
                        {failedFiltered.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {failedFiltered.map(task =>
                                    renderTask(task, true)
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No failed tasks. Keep up the good work!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}