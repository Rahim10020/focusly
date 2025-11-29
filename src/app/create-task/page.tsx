/**
 * @fileoverview Create Task page for the Focusly application.
 * Provides a full-featured task creation modal with support for
 * priorities, tags, scheduling, domains, and subtasks.
 * @module app/create-task/page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import TaskModal, { TaskFormData } from '@/components/tasks/TaskModalRefactored';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTags } from '@/lib/hooks/useTags';

/**
 * Create Task page component that displays a task creation modal.
 * Supports full task configuration including title, priority, tags,
 * due date, scheduling, notes, and domain classification.
 *
 * @returns {JSX.Element | null} The rendered create task page or null during redirect
 */
export default function CreateTaskPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { addTask } = useTasks();
    const { tags } = useTags();
    const [isModalOpen, setIsModalOpen] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    const handleSave = async (taskData: TaskFormData) => {
        try {
            await addTask({
                title: taskData.title,
                priority: taskData.priority,
                tags: taskData.tags,
                dueDate: taskData.dueDate,
                notes: taskData.notes,
                subDomain: taskData.subDomain,
                scheduling: {
                    startDate: taskData.startDate,
                    startTime: taskData.startTime,
                    endTime: taskData.endTime,
                    estimatedDuration: taskData.estimatedDuration
                }
            });

            // Handle subtasks if any
            if (taskData.subTasks && taskData.subTasks.length > 0) {
                // Note: This would need to be handled after the task is created
                // For now, we'll skip subtasks in the initial creation
                // They can be added later via the task details modal
            }

            router.push('/tasks');
        } catch (error) {
            console.error('Failed to create task:', error);
            // You might want to show an error toast here
        }
    };

    const handleClose = () => {
        router.push('/tasks');
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
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <TaskModal
                isOpen={isModalOpen}
                onClose={handleClose}
                onSave={handleSave}
                tags={tags}
            />
        </div>
    );
}
