/**
 * @fileoverview TaskList component for displaying and managing tasks organized by time periods.
 * Provides tabbed navigation for today, tomorrow, other, and completed tasks with drag-and-drop reordering.
 */

'use client';

import { useState, useEffect, memo } from 'react';
import { Task, Tag } from '@/types';
import { isToday, isTomorrow } from '@/lib/utils/time';
import Button from '@/components/ui/Button';
import TaskItem from './TaskItem';

/**
 * Props for the TaskList component.
 */
interface TaskListProps {
    tasks: Task[];
    activeTaskId: string | null;
    tags: Tag[];
    sortType: SortType;
    sortTasks: (taskList: Task[]) => Task[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelectTask: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onAddSubTask: (taskId: string, title: string) => void;
    onToggleSubTask: (taskId: string, subTaskId: string) => void;
    onDeleteSubTask: (taskId: string, subTaskId: string) => void;
    onReorder: (startIndex: number, endIndex: number) => void;
}

/** Available tab types for task categorization */
type TabType = 'today' | 'tomorrow' | 'others' | 'completed';

/** Available sort types for task ordering */
type SortType = 'default' | 'alphabetical' | 'createdAt' | 'priority';

/**
 * TaskList component displays tasks organized into tabs by time period.
 * Supports drag-and-drop reordering, task completion, deletion, and subtask management.
 *
 * @param {TaskListProps} props - Component props
 * @param {Task[]} props.tasks - Array of all tasks to display
 * @param {string | null} props.activeTaskId - ID of the currently active task for timer
 * @param {Tag[]} props.tags - Available tags for task categorization
 * @param {SortType} props.sortType - Current sort method for tasks
 * @param {function} props.sortTasks - Function to sort task arrays
 * @param {function} props.onToggle - Callback when task completion is toggled
 * @param {function} props.onDelete - Callback when task is deleted
 * @param {function} props.onSelectTask - Callback when task is selected as active
 * @param {function} props.onUpdate - Callback when task is updated
 * @param {function} props.onAddSubTask - Callback when subtask is added
 * @param {function} props.onToggleSubTask - Callback when subtask completion is toggled
 * @param {function} props.onDeleteSubTask - Callback when subtask is deleted
 * @param {function} props.onReorder - Callback when tasks are reordered via drag-and-drop
 *
 * @example
 * <TaskList
 *   tasks={tasks}
 *   activeTaskId={currentTaskId}
 *   tags={availableTags}
 *   sortType="default"
 *   sortTasks={sortFunction}
 *   onToggle={handleToggle}
 *   onDelete={handleDelete}
 *   onSelectTask={handleSelect}
 *   onUpdate={handleUpdate}
 *   onAddSubTask={handleAddSubTask}
 *   onToggleSubTask={handleToggleSubTask}
 *   onDeleteSubTask={handleDeleteSubTask}
 *   onReorder={handleReorder}
 * />
 */
function TaskList({
    tasks,
    activeTaskId,
    tags,
    sortType,
    sortTasks,
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

    const todayTasks = sortTasks(
        activeTasks.filter(task => task.dueDate && isToday(task.dueDate))
    );

    const tomorrowTasks = sortTasks(
        activeTasks.filter(task => task.dueDate && isTomorrow(task.dueDate))
    );

    const otherTasks = sortTasks(
        activeTasks.filter(task => !task.dueDate || (!isToday(task.dueDate) && !isTomorrow(task.dueDate)))
    );

    const completedTasks = sortTasks(
        tasks.filter(task => task.completed)
    );

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

    const sortOptions = [
        { value: 'default' as SortType, label: 'Due Date & Priority', icon: '📅' },
        { value: 'alphabetical' as SortType, label: 'Alphabetical', icon: '🔤' },
        { value: 'createdAt' as SortType, label: 'Date Added', icon: '🕒' },
        { value: 'priority' as SortType, label: 'Priority', icon: '⚡' },
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

// Export memoized version to prevent unnecessary re-renders
export default memo(TaskList);