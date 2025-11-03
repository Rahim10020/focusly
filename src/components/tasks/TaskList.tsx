'use client';

import { useState } from 'react';
import { Task, Tag } from '@/types';
import TaskItem from './TaskItem';

interface TaskListProps {
    tasks: Task[];
    activeTaskId: string | null;
    tags: Tag[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelectTask: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onAddSubTask: (taskId: string, title: string) => void;
    onToggleSubTask: (taskId: string, subTaskId: string) => void;
    onDeleteSubTask: (taskId: string, subTaskId: string) => void;
    onReorder: (startIndex: number, endIndex: number) => void;
}

export default function TaskList({
    tasks,
    activeTaskId,
    tags,
    onToggle,
    onDelete,
    onSelectTask,
    onUpdate,
    onAddSubTask,
    onToggleSubTask,
    onDeleteSubTask,
    onReorder,
}: TaskListProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const activeTasks = tasks
        .filter(task => !task.completed)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const completedTasks = tasks
        .filter(task => task.completed)
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            onReorder(draggedIndex, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleDragEnd();
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No tasks yet. Add one to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {activeTasks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Active Tasks ({activeTasks.length})
                    </h3>
                    <div className="space-y-2">
                        {activeTasks.map((task, index) => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onDrop={handleDrop}
                                className={`transition-all ${dragOverIndex === index && draggedIndex !== index
                                    ? 'border-t-2 border-primary pt-2'
                                    : ''
                                    }`}
                            >
                                <TaskItem
                                    task={task}
                                    isActive={activeTaskId === task.id}
                                    tags={tags}
                                    onToggle={onToggle}
                                    onDelete={onDelete}
                                    onSelect={onSelectTask}
                                    onUpdate={onUpdate}
                                    onAddSubTask={onAddSubTask}
                                    onToggleSubTask={onToggleSubTask}
                                    onDeleteSubTask={onDeleteSubTask}
                                    isDragging={draggedIndex === index}
                                    dragHandleProps={{
                                        draggable: true,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {completedTasks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Completed ({completedTasks.length})
                    </h3>
                    <div className="space-y-2">
                        {completedTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                isActive={false}
                                tags={tags}
                                onToggle={onToggle}
                                onDelete={onDelete}
                                onSelect={onSelectTask}
                                onUpdate={onUpdate}
                                onAddSubTask={onAddSubTask}
                                onToggleSubTask={onToggleSubTask}
                                onDeleteSubTask={onDeleteSubTask}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}