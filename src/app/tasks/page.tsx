'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTasks } from '@/lib/hooks/useTasks';
import { Task } from '@/types';

export default function TasksPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { tasks, toggleTask, deleteTask } = useTasks();
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Clear any previous errors when tasks load successfully
        if (tasks && tasks.length >= 0) {
            setError(null);
        }
    }, [tasks]);

    const handleToggleTask = async (id: string) => {
        try {
            setError(null);
            await toggleTask(id);
        } catch (err) {
            setError('Failed to update task. Please try again.');
            console.error('Error toggling task:', err);
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            setError(null);
            await deleteTask(id);
        } catch (err) {
            setError('Failed to delete task. Please try again.');
            console.error('Error deleting task:', err);
        }
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

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'medium':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'low':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            default:
                return 'bg-muted text-muted-foreground border-border';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">My Tasks</h1>
                    <p className="text-muted-foreground">
                        Manage and track all your tasks in one place
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 text-lg">⚠️</span>
                            <p className="text-red-500 text-sm">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-500 hover:text-red-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Total Tasks</p>
                                <p className="text-3xl font-bold">{tasks.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Active Tasks</p>
                                <p className="text-3xl font-bold text-primary">{activeTasks.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                                <p className="text-3xl font-bold text-success">{completedTasks.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={filter === 'all' ? 'primary' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        All ({tasks.length})
                    </Button>
                    <Button
                        variant={filter === 'active' ? 'primary' : 'outline'}
                        onClick={() => setFilter('active')}
                    >
                        Active ({activeTasks.length})
                    </Button>
                    <Button
                        variant={filter === 'completed' ? 'primary' : 'outline'}
                        onClick={() => setFilter('completed')}
                    >
                        Completed ({completedTasks.length})
                    </Button>
                </div>

                {/* Tasks List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredTasks.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="text-lg mb-2">No tasks found</p>
                                <p className="text-sm">
                                    {filter === 'active' && 'All tasks are completed!'}
                                    {filter === 'completed' && 'No completed tasks yet'}
                                    {filter === 'all' && 'Start by creating your first task'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-all bg-card"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => handleToggleTask(task.id)}
                                            className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3
                                                        className={`font-medium mb-1 ${
                                                            task.completed
                                                                ? 'line-through text-muted-foreground'
                                                                : 'text-foreground'
                                                        }`}
                                                    >
                                                        {task.title}
                                                    </h3>

                                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                                        {task.priority && (
                                                            <span
                                                                className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(
                                                                    task.priority
                                                                )}`}
                                                            >
                                                                {task.priority}
                                                            </span>
                                                        )}

                                                        {task.pomodoroCount > 0 && (
                                                            <span className="text-muted-foreground">
                                                                🍅 {task.pomodoroCount} pomodoro{task.pomodoroCount !== 1 ? 's' : ''}
                                                            </span>
                                                        )}

                                                        {task.dueDate && (
                                                            <span className="text-muted-foreground">
                                                                📅 {new Date(task.dueDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {task.notes && (
                                                        <p className="text-sm text-muted-foreground mt-2">
                                                            {task.notes}
                                                        </p>
                                                    )}

                                                    {task.subTasks && task.subTasks.length > 0 && (
                                                        <div className="mt-2 text-sm text-muted-foreground">
                                                            {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length} subtasks completed
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-red-500 hover:bg-red-500/10"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
