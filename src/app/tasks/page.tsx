/**
 * @fileoverview Tasks management page for the Focusly application.
 * Provides a full-featured task list with quick add, sorting, filtering,
 * and all task management operations.
 * @module app/tasks/page
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import TasksView from '@/components/tasks/TasksView';
import QuickAddTask from '@/components/tasks/QuickAddTask';
import Button from '@/components/ui/Button';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTags } from '@/lib/hooks/useTags';
import { useStats } from '@/lib/hooks/useStats';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { Task } from '@/types';
import AchievementNotification from '@/components/achievements/AchievementNotification';

/**
 * Tasks page component that displays and manages all user tasks.
 * Provides functionality for adding, editing, deleting, reordering,
 * and completing tasks with support for subtasks and tags.
 *
 * @returns {JSX.Element | null} The rendered tasks page or null during redirect
 */
export default function TasksPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const taskInputRef = useRef<HTMLInputElement>(null);

    const {
        tasks,
        activeTaskId,
        loading,
        error,
        addTask,
        updateTask,
        toggleTask,
        deleteTask,
        setActiveTask,
        addSubTask,
        toggleSubTask,
        deleteSubTask,
        reorderTasks,
    } = useTasks();

    const { tags } = useTags();
    const { updateTaskStats, getTodayFocusTime, stats } = useStats();
    const {
        newlyUnlocked,
        clearNewlyUnlocked,
        checkAchievements,
        checkTimeBasedAchievements,
    } = useAchievements();

    // Mise à jour des stats de tâches
    useEffect(() => {
        const completedTasks = tasks.filter(task => task.completed).length;
        updateTaskStats(tasks.length, completedTasks);
    }, [tasks, updateTaskStats]);

    // Vérification des achievements avec useRef pour éviter les appels répétés
    const prevStatsRef = useRef({
        totalSessions: 0,
        completedTasks: 0,
        streak: 0,
        todayFocusMinutes: 0,
    });

    useEffect(() => {
        const todayFocusMinutes = Math.floor(getTodayFocusTime() / 60);
        const currentStats = {
            totalSessions: stats.totalSessions,
            completedTasks: stats.completedTasks,
            streak: stats.streak,
            todayFocusMinutes,
        };

        // Ne vérifie que si les stats ont réellement changé
        const hasChanged =
            prevStatsRef.current.totalSessions !== currentStats.totalSessions ||
            prevStatsRef.current.completedTasks !== currentStats.completedTasks ||
            prevStatsRef.current.streak !== currentStats.streak ||
            prevStatsRef.current.todayFocusMinutes !== currentStats.todayFocusMinutes;

        if (hasChanged) {
            checkAchievements(currentStats);
            prevStatsRef.current = currentStats;
        }
    }, [stats.totalSessions, stats.completedTasks, stats.streak, getTodayFocusTime, checkAchievements]);

    // Task handlers
    const handleQuickAddTask = (title: string) => {
        addTask({ title });
    };

    const handleCreateTask = () => {
        router.push('/create-task');
    };

    const handleEditTask = (task: Task) => {
        router.push(`/task/${task.id}`);
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/auth/signin');
        }
    }, [status, router]);

    if (status === 'unauthenticated') {
        return null;
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">My Tasks</h1>
                    <p className="text-muted-foreground">
                        Manage and track all your tasks in one place
                    </p>
                </div>

                {/* Tasks Section - Full Width */}
                <Card variant="elevated">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Tasks</CardTitle>
                            <Button onClick={handleCreateTask} size="sm" className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Task
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <QuickAddTask onAdd={handleQuickAddTask} />

                            <TasksView
                                tasks={tasks}
                                activeTaskId={activeTaskId}
                                tags={tags}
                                loading={loading}
                                error={error}
                                onToggle={toggleTask}
                                onDelete={deleteTask}
                                onSelectTask={setActiveTask}
                                onUpdate={updateTask}
                                onAddSubTask={addSubTask}
                                onToggleSubTask={toggleSubTask}
                                onDeleteSubTask={deleteSubTask}
                                onReorder={reorderTasks}
                                onEditTask={handleEditTask}
                            />
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Achievement Notifications */}
            {newlyUnlocked.map((achievement, index) => (
                <AchievementNotification
                    key={`${achievement.id}-${index}`}
                    achievement={achievement}
                    onClose={() => {
                        if (index === newlyUnlocked.length - 1) {
                            clearNewlyUnlocked();
                        }
                    }}
                />
            ))}
        </div>
    );
}
