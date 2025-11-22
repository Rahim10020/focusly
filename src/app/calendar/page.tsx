/**
 * @fileoverview Calendar page for the Focusly application.
 * Displays tasks in a monthly calendar view with task details modal
 * for viewing and editing tasks.
 * @module app/calendar/page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import CalendarView from '@/components/calendar/CalendarView';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTags } from '@/lib/hooks/useTags';
import { Task } from '@/types';
import TaskDetailsModal from '@/components/tasks/TaskDetailsModal';

/**
 * Calendar page component that displays tasks in a monthly calendar layout.
 * Allows users to view task schedules and click on tasks to view/edit details.
 *
 * @returns {JSX.Element | null} The rendered calendar page or null during redirect
 */
export default function CalendarPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { tasks, updateTask, addSubTask, toggleSubTask, deleteSubTask } = useTasks();
    const { tags } = useTags();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Calendar</h1>
                    <p className="text-muted-foreground text-lg">
                        Visualize your tasks and schedule across the month
                    </p>
                </div>

                <CalendarView
                    tasks={tasks}
                    onTaskClick={(task) => setSelectedTask(task)}
                />
            </main>

            {selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    tags={tags}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={(updates) => updateTask(selectedTask.id, updates)}
                    onAddSubTask={(title) => addSubTask(selectedTask.id, title)}
                    onToggleSubTask={(subTaskId) => toggleSubTask(selectedTask.id, subTaskId)}
                    onDeleteSubTask={(subTaskId) => deleteSubTask(selectedTask.id, subTaskId)}
                />
            )}
        </div>
    );
}
