'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { useTasks } from '@/lib/hooks/useTasks';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FailTaskModal } from './FailTaskModal';

interface TaskHistoryListProps {
    tasks: Task[];
    type?: 'completed' | 'failed' | 'all';
}

export function TaskHistoryList({ tasks, type = 'all' }: TaskHistoryListProps) {
    const { updateTask, deleteTask } = useTasks();
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showFailModal, setShowFailModal] = useState(false);

    const StatusBadge = ({ task }: { task: Task }) => {
        if (task.completed) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    ✓ Complétée
                </span>
            );
        }
        if (task.failedAt) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                    ✗ Échouée
                </span>
            );
        }
        if (task.dueDate && task.dueDate < Date.now()) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                    ⏰ En retard
                </span>
            );
        }
        return null;
    };

    const QuickActions = ({ task }: { task: Task }) => (
        <div className="flex gap-1 flex-wrap">
            {task.failedAt && (
                <>
                    <button
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                        onClick={() => updateTask(task.id, {
                            failedAt: undefined,
                            completed: false
                        })}
                    >
                        🔄 Réactiver
                    </button>

                    <button
                        className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800"
                        onClick={() => {
                            setSelectedTask(task);
                            setShowFailModal(true);
                        }}
                    >
                        📅 Reporter
                    </button>
                </>
            )}

            <button
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => router.push(`/tasks?edit=${task.id}`)}
            >
                ✏️ Éditer
            </button>

            {task.completed && (
                <button
                    className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800"
                    onClick={() => updateTask(task.id, {
                        completed: false,
                        completedAt: undefined
                    })}
                >
                    ↩️ Rouvrir
                </button>
            )}

            <button
                className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                onClick={() => {
                    if (confirm('Supprimer cette tâche définitivement ?')) {
                        setDeletingId(task.id);
                        deleteTask(task.id).finally(() => setDeletingId(null));
                    }
                }}
                disabled={deletingId === task.id}
            >
                🗑️ Supprimer
            </button>
        </div>
    );

    return (
        <>
            <div className="space-y-4">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                    >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1">
                                <h4 className="font-semibold mb-2">{task.title}</h4>
                                <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600 dark:text-gray-400">
                                    <StatusBadge task={task} />
                                    <span>
                                        {format(
                                            new Date(task.completedAt || task.failedAt || task.createdAt),
                                            'PPP',
                                            { locale: fr }
                                        )}
                                    </span>
                                    {task.tags && task.tags.length > 0 && (
                                        <div className="flex gap-1">
                                            {task.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {task.pomodoroCount > 0 && (
                                        <span className="text-xs">
                                            🍅 {task.pomodoroCount} pomodoro{task.pomodoroCount > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                {task.notes && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        {task.notes}
                                    </p>
                                )}
                            </div>
                            <QuickActions task={task} />
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Aucune tâche dans l&apos;historique
                    </p>
                )}
            </div>

            {selectedTask && (
                <FailTaskModal
                    task={selectedTask}
                    isOpen={showFailModal}
                    onClose={() => {
                        setShowFailModal(false);
                        setSelectedTask(null);
                    }}
                    onConfirm={(updates) => updateTask(selectedTask.id, updates)}
                />
            )}
        </>
    );
}
