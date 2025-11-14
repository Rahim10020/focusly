'use client';

import { useState } from 'react';
import { Task, Tag } from '@/types';
import { isToday, isTomorrow } from '@/lib/utils/time';
import Button from '@/components/ui/Button';
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

type TabType = 'today' | 'tomorrow' | 'others' | 'completed';

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
    const [activeTab, setActiveTab] = useState<TabType>('today');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const activeTasks = tasks.filter(task => !task.completed);

    const todayTasks = activeTasks
        .filter(task => task.dueDate && isToday(task.dueDate))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const tomorrowTasks = activeTasks
        .filter(task => task.dueDate && isTomorrow(task.dueDate))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const otherTasks = activeTasks
        .filter(task => !task.dueDate || (!isToday(task.dueDate) && !isTomorrow(task.dueDate)))
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

    const getCurrentTasks = () => {
        switch (activeTab) {
            case 'today':
                return todayTasks;
            case 'tomorrow':
                return tomorrowTasks;
            case 'others':
                return otherTasks;
            case 'completed':
                return completedTasks;
            default:
                return [];
        }
    };

    const currentTasks = getCurrentTasks();

    const tabs = [
        { id: 'today' as TabType, label: 'Today', count: todayTasks.length },
        { id: 'tomorrow' as TabType, label: 'Tomorrow', count: tomorrowTasks.length },
        { id: 'others' as TabType, label: 'Others', count: otherTasks.length },
        { id: 'completed' as TabType, label: 'Completed', count: completedTasks.length },
    ];

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-2">
                {tabs.map((tab) => (
                    <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab(tab.id)}
                        className="text-xs"
                    >
                        {tab.label} ({tab.count})
                    </Button>
                ))}
            </div>

            {/* Task List */}
            {currentTasks.length > 0 ? (
                <div className="space-y-2">
                    {currentTasks.map((task, index) => (
                        <div
                            key={task.id}
                            draggable={activeTab !== 'completed'}
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDrop}
                            className={`transition-all ${dragOverIndex === index && draggedIndex !== index && activeTab !== 'completed'
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
                                    draggable: activeTab !== 'completed',
                                }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No tasks in this category.</p>
                </div>
            )}
        </div>
    );
}