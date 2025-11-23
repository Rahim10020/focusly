/**
 * @fileoverview TasksView component that serves as the main container for task display.
 * Provides view switching between list and board views, sorting options,
 * and handles loading/error states.
 */

'use client';

import { useState, useEffect } from 'react';
import { Task, Tag, TaskStatus } from '@/types';
import TaskList from './TaskList';
import TaskBoardView from './TaskBoardView';

/** Available sort types for task ordering */
type SortType = 'default' | 'alphabetical' | 'createdAt' | 'priority';

/**
 * Props for the TasksView component.
 */
interface TasksViewProps {
    tasks: Task[];
    activeTaskId: string | null;
    tags: Tag[];
    loading?: boolean;
    error?: string | null;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelectTask: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onAddSubTask: (taskId: string, title: string) => void;
    onToggleSubTask: (taskId: string, subTaskId: string) => void;
    onDeleteSubTask: (taskId: string, subTaskId: string) => void;
    onReorder: (startIndex: number, endIndex: number) => void;
    onEditTask: (task: Task) => void;
    /** Whether to show sorting options UI */
    showSortOptions?: boolean;
}

/** Available view types for task display */
type ViewType = 'list' | 'board';

/**
 * TasksView component is the main container for displaying tasks.
 * Provides view switching between list and Kanban board views, sorting options,
 * and handles loading and error states. Persists sort preference in localStorage.
 *
 * @param {TasksViewProps} props - Component props
 * @param {Task[]} props.tasks - Array of all tasks to display
 * @param {string | null} props.activeTaskId - ID of the currently active task
 * @param {Tag[]} props.tags - Available tags for display
 * @param {boolean} [props.loading] - Whether tasks are being loaded
 * @param {string | null} [props.error] - Error message if loading failed
 * @param {function} props.onToggle - Callback when task completion is toggled
 * @param {function} props.onDelete - Callback when task is deleted
 * @param {function} props.onSelectTask - Callback when task is selected as active
 * @param {function} props.onUpdate - Callback when task is updated
 * @param {function} props.onAddSubTask - Callback when subtask is added
 * @param {function} props.onToggleSubTask - Callback when subtask is toggled
 * @param {function} props.onDeleteSubTask - Callback when subtask is deleted
 * @param {function} props.onReorder - Callback when tasks are reordered
 * @param {function} props.onEditTask - Callback when task edit is requested
 * @param {boolean} [props.showSortOptions=true] - Whether to show sorting UI
 *
 * @example
 * <TasksView
 *   tasks={tasks}
 *   activeTaskId={currentTaskId}
 *   tags={availableTags}
 *   loading={isLoading}
 *   error={errorMessage}
 *   onToggle={handleToggle}
 *   onDelete={handleDelete}
 *   onSelectTask={handleSelect}
 *   onUpdate={handleUpdate}
 *   onAddSubTask={handleAddSubTask}
 *   onToggleSubTask={handleToggleSubTask}
 *   onDeleteSubTask={handleDeleteSubTask}
 *   onReorder={handleReorder}
 *   onEditTask={handleEditTask}
 * />
 */
export default function TasksView(props: TasksViewProps) {
    const [view, setView] = useState<ViewType>('list');
    const [sortType, setSortType] = useState<SortType>('default');
    const showSortOptions = props.showSortOptions ?? true;

    // Load sort preference from localStorage
    useEffect(() => {
        const savedSort = localStorage.getItem('taskSortType') as SortType;
        if (savedSort && ['default', 'alphabetical', 'createdAt', 'priority'].includes(savedSort)) {
            setSortType(savedSort);
        }
    }, []);

    // Save sort preference to localStorage
    useEffect(() => {
        localStorage.setItem('taskSortType', sortType);
    }, [sortType]);

    // Sorting function
    const sortTasks = (taskList: Task[]): Task[] => {
        return [...taskList].sort((a, b) => {
            switch (sortType) {
                case 'alphabetical':
                    return a.title.localeCompare(b.title);

                case 'createdAt':
                    return a.createdAt - b.createdAt;

                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    const aPriority = priorityOrder[a.priority || 'low'];
                    const bPriority = priorityOrder[b.priority || 'low'];
                    return bPriority - aPriority; // High priority first

                case 'default':
                default:
                    // Sort by dueDate first (null dates go to end), then by priority
                    const aDate = a.dueDate || Infinity;
                    const bDate = b.dueDate || Infinity;

                    if (aDate !== bDate) {
                        return aDate - bDate;
                    }

                    // Same date or both null, sort by priority
                    const priorityOrderDefault = { high: 3, medium: 2, low: 1 };
                    const aPriorityDefault = priorityOrderDefault[a.priority || 'low'];
                    const bPriorityDefault = priorityOrderDefault[b.priority || 'low'];
                    return bPriorityDefault - aPriorityDefault; // High priority first
            }
        });
    };

    const handleStatusChange = (taskId: string, status: TaskStatus) => {
        props.onUpdate(taskId, {
            status,
            completed: status === 'done',
            completedAt: status === 'done' ? Date.now() : undefined,
        });
    };

    const sortOptions = [
        { value: 'default' as SortType, label: 'Due Date & Priority', icon: '📅' },
        { value: 'alphabetical' as SortType, label: 'Alphabetical', icon: '🔤' },
        { value: 'createdAt' as SortType, label: 'Date Added', icon: '🕒' },
        { value: 'priority' as SortType, label: 'Priority', icon: '⚡' },
    ];

    return (
        <div className="space-y-4">
            {/* Sorting Options */}
            {showSortOptions && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
                        <div className="flex gap-1 bg-muted p-1 rounded-lg">
                            {sortOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setSortType(option.value)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                        sortType === option.value
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <span>{option.icon}</span>
                                    <span>{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {props.tasks.filter(t => !t.completed && (t.status !== 'done')).length} active tasks
                    </div>
                    {/* View Toggle */}
                    <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                        <button
                            onClick={() => setView('list')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${view === 'list'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <span>List</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setView('board')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${view === 'board'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                                <span>Board</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {props.loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading tasks...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {props.error && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-center">
                    <p className="text-error font-medium mb-2">Failed to load tasks</p>
                    <p className="text-sm text-muted-foreground">{props.error}</p>
                </div>
            )}

            {/* View Content */}
            {!props.loading && !props.error && (
                <>
                    {view === 'list' ? (
                        <TaskList {...props} sortType={sortType} sortTasks={sortTasks} />
                    ) : (
                        <TaskBoardView
                            {...props}
                            sortType={sortType}
                            sortTasks={sortTasks}
                            onStatusChange={handleStatusChange}
                        />
                    )}
                </>
            )}
        </div>
    );
}
