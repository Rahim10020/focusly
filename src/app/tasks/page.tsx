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
import { Task } from '@/types';

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

    if (!session) {
        router.push('/auth/signin');
        return null;
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
        </div>
    );
}
