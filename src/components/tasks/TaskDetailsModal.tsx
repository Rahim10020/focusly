/**
 * @fileoverview TaskDetailsModal component for viewing and editing task details.
 * Displays comprehensive task information including metadata, schedule, notes,
 * and subtasks with inline editing capabilities.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Task, Tag, DOMAINS, getDomainFromSubDomain, Priority, SubDomain } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TagBadge from '@/components/ui/TagBadge';

/**
 * Props for the TaskDetailsModal component.
 */
interface TaskDetailsModalProps {
    task: Task;
    tags: Tag[];
    onClose: () => void;
    onUpdate: (updates: Partial<Task>) => void;
    onAddSubTask: (title: string) => void;
    onToggleSubTask: (subTaskId: string) => void;
    /** Callback when a subtask is deleted */
    onDeleteSubTask: (subTaskId: string) => void;
}

/**
 * TaskDetailsModal component displays and allows editing of task details.
 * Provides inline editing for title, priority, tags, dates, times, duration,
 * category, notes, and subtasks. Shows task metadata like creation date and pomodoro count.
 * Supports fullscreen mode for better visibility.
 */
export default function TaskDetailsModal({
    task,
    tags,
    onClose,
    onUpdate,
    onAddSubTask,
    onToggleSubTask,
    onDeleteSubTask,
}: TaskDetailsModalProps) {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [title, setTitle] = useState(task.title || '');
    const [notes, setNotes] = useState(task.notes || '');
    const [priority, setPriority] = useState<Priority | undefined>(task.priority);
    const [selectedTags, setSelectedTags] = useState<string[]>(task.tags || []);
    const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    const [startDate, setStartDate] = useState(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
    const [startTime, setStartTime] = useState(task.startTime || '');
    const [endTime, setEndTime] = useState(task.endTime || '');
    const [estimatedDuration, setEstimatedDuration] = useState(task.estimatedDuration?.toString() || '');
    const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | undefined>(task.subDomain);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newSubTask, setNewSubTask] = useState('');

    // Add tab state for compact mode
    const [activeTab, setActiveTab] = useState<'details' | 'categories' | 'subtasks'>('details');

    // Calculate duration when start time or end time changes
    useEffect(() => {
        const calculateDuration = () => {
            if (!startTime || !endTime) return;

            try {
                const start = startTime.includes(':') ? startTime : `${startTime}:00`;
                const end = endTime.includes(':') ? endTime : `${endTime}:00`;

                const [startHours, startMinutes = 0] = start.split(':').map(Number);
                const [endHours, endMinutes = 0] = end.split(':').map(Number);

                if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
                    console.error('Invalid time format');
                    return;
                }

                const startDate = new Date();
                startDate.setHours(startHours, startMinutes, 0, 0);

                const endDate = new Date();
                endDate.setHours(endHours, endMinutes, 0, 0);

                if (endDate <= startDate) {
                    endDate.setDate(endDate.getDate() + 1);
                }

                const diffInMs = endDate.getTime() - startDate.getTime();
                const diffInMinutes = Math.round(diffInMs / (1000 * 60));

                if (diffInMinutes > 0) {
                    setEstimatedDuration(diffInMinutes.toString());
                } else if (diffInMinutes < 0) {
                    setEstimatedDuration('');
                }
            } catch (error) {
                console.error('Error calculating duration:', error);
            }
        };

        calculateDuration();
    }, [startTime, endTime]);

    const taskTags = tags.filter(tag => selectedTags.includes(tag.id));
    const now = useMemo(() => Date.now(), []);
    const isOverdue = task.dueDate && task.dueDate < now && !task.completed;
    const isDueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date(now).toDateString();

    const handleSave = () => {
        onUpdate({
            title: title.trim(),
            priority,
            tags: selectedTags.length > 0 ? selectedTags : undefined,
            dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
            startDate: startDate ? new Date(startDate).getTime() : undefined,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
            notes: notes.trim() || undefined,
            subDomain: selectedSubDomain,
            subTasks: task.subTasks || []
        });
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const addSubTask = () => {
        if (newSubTask.trim()) {
            onAddSubTask(newSubTask.trim());
            setNewSubTask('');
        }
    };

    const filteredDomains = Object.entries(DOMAINS).filter(([domainKey, domainInfo]) => {
        const domainMatch = domainInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            domainInfo.description.toLowerCase().includes(searchQuery.toLowerCase());
        const subDomainMatch = Object.values(domainInfo.subDomains).some(subName =>
            subName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return domainMatch || subDomainMatch;
    });

    const priorityOptions = [
        { value: 'high' as Priority, label: 'High', color: 'bg-error text-white' },
        { value: 'medium' as Priority, label: 'Medium', color: 'bg-warning text-white' },
        { value: 'low' as Priority, label: 'Low', color: 'bg-info text-white' },
    ];

    const modalClasses = isFullScreen
        ? "fixed inset-0 z-50 bg-background"
        : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";

    const contentClasses = isFullScreen
        ? "w-full h-full bg-card border-0 rounded-none shadow-none overflow-y-auto"
        : "w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden";

    return (
        <div className={modalClasses}>
            <div className={contentClasses}>
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
                    <h2 className="text-xl font-semibold text-foreground">
                        Task Details
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
                            title={isFullScreen ? 'Switch to compact mode' : 'Switch to full screen mode'}
                        >
                            {isFullScreen ? (
                                <svg className="w-5 h-5" data-testid="CollapseIcon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                                    <path d="M30.706 2.706 21.413 12h7.586a1 1 0 0 1 0 2h-10a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v7.586l9.293-9.293a.999.999 0 1 1 1.413 1.414Zm-29.414 28a.997.997 0 0 0 1.414 0l9.293-9.293v7.586a1 1 0 0 0 2 0V19a1 1 0 0 0-1-1h-10a1 1 0 0 0 0 2h7.586l-9.293 9.293a.999.999 0 0 0 0 1.414Z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tab Navigation (Compact Mode Only) */}
                {!isFullScreen && (
                    <div className="sticky top-[89px] bg-card border-b border-border px-6 z-10">
                        <div className="flex">
                            {[
                                { id: 'details', label: 'Details' },
                                { id: 'categories', label: 'Categories', badge: selectedSubDomain ? '1' : null },
                                { id: 'subtasks', label: 'Subtasks', badge: task.subTasks?.length || 0 > 0 ? (task.subTasks?.length || 0).toString() : null }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id
                                        ? 'text-primary border-primary bg-primary/5'
                                        : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className={`${isFullScreen ? 'grid grid-cols-[1fr_1fr] gap-8' : ''}`}>
                    {/* Main Content */}
                    <div className={`${isFullScreen ? 'p-6 space-y-8' : ''}`}>
                        {/* Tab Panels for Compact Mode */}
                        {!isFullScreen && (
                            <div className="h-[calc(90vh-200px)] overflow-y-auto">
                                {/* Details Tab */}
                                {activeTab === 'details' && (
                                    <div className="p-6 space-y-8">
                                        {/* Task Title */}
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="What needs to be done?"
                                                className="w-full text-2xl font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 border-0 p-0"
                                            />
                                        </div>

                                        {/* Priority */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                {priorityOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setPriority(priority === option.value ? undefined : option.value)}
                                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${priority === option.value
                                                            ? `${option.color} scale-105 shadow-md`
                                                            : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                                                            }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        {tags.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {tags.map(tag => (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => toggleTag(tag.id)}
                                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer ${selectedTags.includes(tag.id)
                                                                ? 'bg-primary text-primary-foreground scale-105'
                                                                : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                                                                }`}
                                                        >
                                                            {tag.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Schedule & Duration */}
                                        <div className="space-y-6">
                                            <h3 className="text-base font-semibold text-foreground">Schedule & Duration</h3>

                                            <div className="bg-muted/30 rounded-xl p-5 space-y-5">
                                                {/* Dates */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</label>
                                                        <Input
                                                            type="date"
                                                            value={startDate}
                                                            onChange={(e) => setStartDate(e.target.value)}
                                                            className="bg-background border-border"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
                                                        <Input
                                                            type="date"
                                                            value={dueDate}
                                                            onChange={(e) => setDueDate(e.target.value)}
                                                            className="bg-background border-border"
                                                        />
                                                        {isOverdue && (
                                                            <p className="text-xs text-error mt-1">⚠️ This task is overdue!</p>
                                                        )}
                                                        {isDueToday && !isOverdue && (
                                                            <p className="text-xs text-muted-foreground mt-1">📅 Due today</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Times and Duration */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Time</label>
                                                        <Input
                                                            type="time"
                                                            value={startTime}
                                                            onChange={(e) => setStartTime(e.target.value)}
                                                            className="bg-background border-border"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">End Time</label>
                                                        <Input
                                                            type="time"
                                                            value={endTime}
                                                            onChange={(e) => setEndTime(e.target.value)}
                                                            className="bg-background border-border"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration (min)</label>
                                                        <Input
                                                            type="number"
                                                            value={estimatedDuration}
                                                            onChange={(e) => setEstimatedDuration(e.target.value)}
                                                            min="0"
                                                            placeholder="60"
                                                            className="bg-background border-border"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-foreground">Notes</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Add any additional details..."
                                                className="w-full px-4 py-3 bg-muted text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[120px] transition-all"
                                                rows={4}
                                            />
                                        </div>

                                        {/* Meta Info */}
                                        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
                                            <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                                            {task.completedAt && (
                                                <p>Completed: {new Date(task.completedAt).toLocaleString()}</p>
                                            )}
                                            {task.pomodoroCount > 0 && (
                                                <p>🍅 {task.pomodoroCount} pomodoros completed</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Categories Tab */}
                                {activeTab === 'categories' && (
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-4">
                                            <Input
                                                type="text"
                                                placeholder="Search categories..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />

                                            <div className="space-y-4">
                                                {filteredDomains.map(([domainKey, domainInfo]) => (
                                                    <div key={domainKey} className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-semibold text-foreground">
                                                                    {domainInfo.name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {domainInfo.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2 ml-10">
                                                            {Object.entries(domainInfo.subDomains).map(([subDomainKey, subDomainName]) => (
                                                                <button
                                                                    key={subDomainKey}
                                                                    type="button"
                                                                    onClick={() => setSelectedSubDomain(
                                                                        selectedSubDomain === subDomainKey ? undefined : subDomainKey as SubDomain
                                                                    )}
                                                                    className={`p-3 text-left text-sm rounded-lg transition-all cursor-pointer ${selectedSubDomain === subDomainKey
                                                                        ? 'bg-primary text-primary-foreground font-medium'
                                                                        : 'bg-card hover:bg-accent text-foreground border border-border'
                                                                        }`}
                                                                >
                                                                    {subDomainName}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Subtasks Tab */}
                                {activeTab === 'subtasks' && (
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="text"
                                                placeholder="Add a subtask..."
                                                value={newSubTask}
                                                onChange={(e) => setNewSubTask(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
                                            />
                                            <Button
                                                onClick={addSubTask}
                                                disabled={!newSubTask.trim()}
                                                size="sm"
                                            >
                                                Add
                                            </Button>
                                        </div>

                                        {(task.subTasks?.length || 0) > 0 && (
                                            <div className="space-y-2">
                                                {task.subTasks?.map((subTask, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                        <input
                                                            type="checkbox"
                                                            checked={subTask.completed}
                                                            onChange={() => onToggleSubTask(subTask.id)}
                                                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                                        />
                                                        <span className={`flex-1 text-sm ${subTask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                            {subTask.title}
                                                        </span>
                                                        <button
                                                            onClick={() => onDeleteSubTask(subTask.id)}
                                                            className="text-muted-foreground hover:text-error transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {(task.subTasks?.length || 0) === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                <p>No subtasks added yet</p>
                                                <p className="text-sm">Break down your task into smaller steps</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Fullscreen Content */}
                        {isFullScreen && (
                            <div className="space-y-8">
                                {/* Task Title */}
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="What needs to be done?"
                                        className="w-full text-2xl font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 border-0 p-0"
                                    />
                                </div>

                                {/* Priority */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        {priorityOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setPriority(priority === option.value ? undefined : option.value)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${priority === option.value
                                                    ? `${option.color} scale-105 shadow-md`
                                                    : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags */}
                                {tags.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map(tag => (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => toggleTag(tag.id)}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer ${selectedTags.includes(tag.id)
                                                        ? 'bg-primary text-primary-foreground scale-105'
                                                        : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    {tag.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Divider */}
                                <div className="border-t border-border"></div>

                                {/* Schedule & Duration */}
                                <div className="space-y-6">
                                    <h3 className="text-base font-semibold text-foreground">Schedule & Duration</h3>

                                    <div className="bg-muted/30 rounded-xl p-5 space-y-5">
                                        {/* Dates */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</label>
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="bg-background border-border"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
                                                <Input
                                                    type="date"
                                                    value={dueDate}
                                                    onChange={(e) => setDueDate(e.target.value)}
                                                    className="bg-background border-border"
                                                />
                                                {isOverdue && (
                                                    <p className="text-xs text-error mt-1">⚠️ This task is overdue!</p>
                                                )}
                                                {isDueToday && !isOverdue && (
                                                    <p className="text-xs text-muted-foreground mt-1">📅 Due today</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Times and Duration */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Time</label>
                                                <Input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    className="bg-background border-border"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">End Time</label>
                                                <Input
                                                    type="time"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    className="bg-background border-border"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration (min)</label>
                                                <Input
                                                    type="number"
                                                    value={estimatedDuration}
                                                    onChange={(e) => setEstimatedDuration(e.target.value)}
                                                    min="0"
                                                    placeholder="60"
                                                    className="bg-background border-border"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-border"></div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add any additional details..."
                                        className="w-full px-4 py-3 bg-muted text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[120px] transition-all"
                                        rows={4}
                                    />
                                </div>

                                {/* Meta Info */}
                                <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
                                    <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                                    {task.completedAt && (
                                        <p>Completed: {new Date(task.completedAt).toLocaleString()}</p>
                                    )}
                                    {task.pomodoroCount > 0 && (
                                        <p>🍅 {task.pomodoroCount} pomodoros completed</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - Categories & Subtasks (only in fullscreen) */}
                    {isFullScreen && (
                        <div className="space-y-6 border-l border-border pl-8">
                            {/* Categories Accordion */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                    className="w-full flex items-center justify-between p-2 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className={`w-5 h-5 text-muted-foreground transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        <span className="text-lg font-medium text-foreground">Categories</span>
                                        {selectedSubDomain && (
                                            <span className="text-sm text-muted-foreground">
                                                {DOMAINS[getDomainFromSubDomain(selectedSubDomain)]?.subDomains[selectedSubDomain]}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {isCategoriesOpen && (
                                    <div className="space-y-4 animate-slide-down">
                                        <Input
                                            type="text"
                                            placeholder="Search categories..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />

                                        <div className="max-h-64 overflow-y-auto space-y-4">
                                            {filteredDomains.map(([domainKey, domainInfo]) => (
                                                <div key={domainKey} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-foreground">
                                                                {domainInfo.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {domainInfo.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 ml-10">
                                                        {Object.entries(domainInfo.subDomains).map(([subDomainKey, subDomainName]) => (
                                                            <button
                                                                key={subDomainKey}
                                                                type="button"
                                                                onClick={() => setSelectedSubDomain(
                                                                    selectedSubDomain === subDomainKey ? undefined : subDomainKey as SubDomain
                                                                )}
                                                                className={`p-3 text-left text-sm rounded-lg transition-all cursor-pointer ${selectedSubDomain === subDomainKey
                                                                    ? 'bg-primary text-primary-foreground font-medium'
                                                                    : 'bg-card hover:bg-accent text-foreground border border-border'
                                                                    }`}
                                                            >
                                                                {subDomainName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Subtasks Accordion */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => setIsSubTasksOpen(!isSubTasksOpen)}
                                    className="w-full flex items-center justify-between p-2 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className={`w-5 h-5 text-muted-foreground transition-transform ${isSubTasksOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        <span className="text-lg font-medium text-foreground">Subtasks</span>
                                        {(task.subTasks?.length || 0) > 0 && (
                                            <span className="text-sm text-muted-foreground">
                                                {task.subTasks?.filter(t => t.completed).length}/{task.subTasks?.length}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {isSubTasksOpen && (
                                    <div className="space-y-4 animate-slide-down">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="text"
                                                placeholder="Add a subtask..."
                                                value={newSubTask}
                                                onChange={(e) => setNewSubTask(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
                                            />
                                            <Button
                                                onClick={addSubTask}
                                                disabled={!newSubTask.trim()}
                                                size="sm"
                                            >
                                                Add
                                            </Button>
                                        </div>

                                        {(task.subTasks?.length || 0) > 0 && (
                                            <div className="space-y-2">
                                                {task.subTasks?.map((subTask, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                        <input
                                                            type="checkbox"
                                                            checked={subTask.completed}
                                                            onChange={() => onToggleSubTask(subTask.id)}
                                                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                                        />
                                                        <span className={`flex-1 text-sm ${subTask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                            {subTask.title}
                                                        </span>
                                                        <button
                                                            onClick={() => onDeleteSubTask(subTask.id)}
                                                            className="text-muted-foreground hover:text-error transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-card border-t border-border p-6 flex justify-between gap-3">
                    <Button
                        onClick={() => {
                            onUpdate({ completed: !task.completed });
                            onClose();
                        }}
                        variant="secondary"
                    >
                        {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                handleSave();
                                onClose();
                            }}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}