/**
 * @fileoverview TaskModal component for creating and editing tasks.
 * Provides a comprehensive form with fields for title, priority, tags, dates, times,
 * duration, notes, categories, and subtasks. Supports fullscreen mode.
 */

'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Priority, SubDomain, DOMAINS, Domain, Tag } from '@/types';

/**
 * Props for the TaskModal component.
 */
interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: TaskFormData) => void;
    initialData?: TaskFormData;
    /** Available tags for task categorization */
    tags: Tag[];
}

/**
 * Form data structure for creating or editing a task.
 */
export interface TaskFormData {
    title: string;
    priority?: Priority;
    tags?: string[];
    dueDate?: number;
    startDate?: number;
    startTime?: string;
    endTime?: string;
    estimatedDuration?: number;
    notes?: string;
    subDomain?: SubDomain;
    /** Array of subtasks with title and completion status */
    subTasks?: { title: string; completed: boolean }[];
}

/**
 * TaskModal component provides a form for creating new tasks or editing existing ones.
 * Features include priority selection, tag assignment, date/time scheduling,
 * duration calculation, notes, category selection, and subtask management.
 * Supports both compact and fullscreen modes.
 *
 * @param {TaskModalProps} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Callback when modal is closed
 * @param {function} props.onSave - Callback when form is submitted with task data
 * @param {TaskFormData} [props.initialData] - Initial form data for editing
 * @param {Tag[]} props.tags - Available tags for selection
 *
 * @example
 * // Creating a new task
 * <TaskModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSave={(data) => createTask(data)}
 *   tags={availableTags}
 * />
 *
 * @example
 * // Editing an existing task
 * <TaskModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSave={(data) => updateTask(taskId, data)}
 *   initialData={existingTaskData}
 *   tags={availableTags}
 * />
 */
export default function TaskModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    tags,
}: TaskModalProps) {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | undefined>(undefined);
    const [subTasks, setSubTasks] = useState<{ title: string; completed: boolean }[]>([]);
    const [newSubTask, setNewSubTask] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);

    // Add tab state for compact mode
    const [activeTab, setActiveTab] = useState<'details' | 'categories' | 'subtasks'>('details');

    // Calculate duration when start time or end time changes
    useEffect(() => {
        const calculateDuration = () => {
            if (!startTime || !endTime) return;

            try {
                // Ensure time strings have the correct format (HH:MM)
                const start = startTime.includes(':') ? startTime : `${startTime}:00`;
                const end = endTime.includes(':') ? endTime : `${endTime}:00`;

                const [startHours, startMinutes = 0] = start.split(':').map(Number);
                const [endHours, endMinutes = 0] = end.split(':').map(Number);

                // Validate time values
                if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
                    console.error('Invalid time format');
                    return;
                }

                // Create date objects for comparison
                const startDate = new Date();
                startDate.setHours(startHours, startMinutes, 0, 0);

                let endDate = new Date();
                endDate.setHours(endHours, endMinutes, 0, 0);

                // Handle case where end time is on the next day
                if (endDate <= startDate) {
                    endDate.setDate(endDate.getDate() + 1);
                }

                const diffInMs = endDate.getTime() - startDate.getTime();
                const diffInMinutes = Math.round(diffInMs / (1000 * 60));

                // Only update if we have a valid positive duration
                if (diffInMinutes > 0) {
                    setEstimatedDuration(diffInMinutes.toString());
                } else if (diffInMinutes < 0) {
                    // If end time is before start time, clear the duration
                    setEstimatedDuration('');
                }
            } catch (error) {
                console.error('Error calculating duration:', error);
            }
        };

        calculateDuration();
    }, [startTime, endTime]);

    // Populate form with initial data
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setPriority(initialData.priority);
            setSelectedTags(initialData.tags || []);
            setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
            setStartDate(initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '');
            setStartTime(initialData.startTime || '');
            setEndTime(initialData.endTime || '');
            setEstimatedDuration(initialData.estimatedDuration?.toString() || '');
            setNotes(initialData.notes || '');
            setSelectedSubDomain(initialData.subDomain);
            setSubTasks(initialData.subTasks || []);
        } else {
            // Reset form
            setTitle('');
            setPriority(undefined);
            setSelectedTags([]);
            setDueDate('');
            setStartDate('');
            setStartTime('');
            setEndTime('');
            setEstimatedDuration('');
            setNotes('');
            setSelectedSubDomain(undefined);
            setSubTasks([]);
        }
        setIsFullScreen(false);
        setIsCategoriesOpen(false);
        setIsSubTasksOpen(false);
        setSearchQuery('');
        setNewSubTask('');
    }, [initialData, isOpen]);

    const handleSubmit = () => {
        if (!title.trim()) return;

        onSave({
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
            subTasks: subTasks.length > 0 ? subTasks : undefined,
        });

        onClose();
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const addSubTask = () => {
        if (newSubTask.trim()) {
            setSubTasks(prev => [...prev, { title: newSubTask.trim(), completed: false }]);
            setNewSubTask('');
        }
    };

    const toggleSubTask = (index: number) => {
        setSubTasks(prev => prev.map((task, i) =>
            i === index ? { ...task, completed: !task.completed } : task
        ));
    };

    const removeSubTask = (index: number) => {
        setSubTasks(prev => prev.filter((_, i) => i !== index));
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

    if (!isOpen) return null;

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
                        {initialData ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
                            title={isFullScreen ? 'Switch to compact mode' : 'Switch to full screen mode'}
                        >
                            {isFullScreen ? (
                                // Use the provided SVG for reducing the modal
                                <svg className="w-5 h-5" data-testid="CollapseIcon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                                    <path d="M30.706 2.706 21.413 12h7.586a1 1 0 0 1 0 2h-10a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v7.586l9.293-9.293a.999.999 0 1 1 1.413 1.414Zm-29.414 28a.997.997 0 0 0 1.414 0l9.293-9.293v7.586a1 1 0 0 0 2 0V19a1 1 0 0 0-1-1h-10a1 1 0 0 0 0 2h7.586l-9.293 9.293a.999.999 0 0 0 0 1.414Z"></path>
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
                                { id: 'details', label: 'Détails' },
                                { id: 'categories', label: 'Catégories', badge: selectedSubDomain ? '1' : null },
                                { id: 'subtasks', label: 'Sous-tâches', badge: subTasks.length > 0 ? subTasks.length.toString() : null }
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
                                                autoFocus
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
                                                        <div className="relative">
                                                            <Input
                                                                type="date"
                                                                value={startDate}
                                                                onChange={(e) => setStartDate(e.target.value)}
                                                                min={new Date().toISOString().split('T')[0]}
                                                                className="bg-background border-border"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
                                                        <div className="relative">
                                                            <Input
                                                                type="date"
                                                                value={dueDate}
                                                                onChange={(e) => setDueDate(e.target.value)}
                                                                min={new Date().toISOString().split('T')[0]}
                                                                className="bg-background border-border"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Times and Duration */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Time</label>
                                                        <div className="relative">
                                                            <Input
                                                                type="time"
                                                                value={startTime}
                                                                onChange={(e) => setStartTime(e.target.value)}
                                                                className="bg-background border-border"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">End Time</label>
                                                        <div className="relative">
                                                            <Input
                                                                type="time"
                                                                value={endTime}
                                                                onChange={(e) => setEndTime(e.target.value)}
                                                                className="bg-background border-border"
                                                            />
                                                        </div>
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
                                        <div className="flex gap-2">
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

                                        {subTasks.length > 0 && (
                                            <div className="space-y-2">
                                                {subTasks.map((subTask, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                        <input
                                                            type="checkbox"
                                                            checked={subTask.completed}
                                                            onChange={() => toggleSubTask(index)}
                                                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                                        />
                                                        <span className={`flex-1 text-sm ${subTask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                            {subTask.title}
                                                        </span>
                                                        <button
                                                            onClick={() => removeSubTask(index)}
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

                                        {subTasks.length === 0 && (
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
                                        autoFocus
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

                                {/* Schedule & Duration - Redesigned */}
                                <div className="space-y-6">
                                    <h3 className="text-base font-semibold text-foreground">Schedule & Duration</h3>

                                    <div className="bg-muted/30 rounded-xl p-5 space-y-5">
                                        {/* Dates */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</label>
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        className="bg-background border-border"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</label>
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={dueDate}
                                                        onChange={(e) => setDueDate(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        className="bg-background border-border"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Times and Duration */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Time</label>
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={startTime}
                                                        onChange={(e) => setStartTime(e.target.value)}
                                                        className="bg-background border-border"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">End Time</label>
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={endTime}
                                                        onChange={(e) => setEndTime(e.target.value)}
                                                        className="bg-background border-border"
                                                    />
                                                </div>
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
                                                {DOMAINS[Object.keys(DOMAINS).find(domain =>
                                                    DOMAINS[domain as Domain].subDomains[selectedSubDomain]
                                                ) as Domain]?.subDomains[selectedSubDomain]}
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
                                        {subTasks.length > 0 && (
                                            <span className="text-sm text-muted-foreground">
                                                {subTasks.filter(t => t.completed).length}/{subTasks.length}
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

                                        {subTasks.length > 0 && (
                                            <div className="space-y-2">
                                                {subTasks.map((subTask, index) => (
                                                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                        <input
                                                            type="checkbox"
                                                            checked={subTask.completed}
                                                            onChange={() => toggleSubTask(index)}
                                                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                                        />
                                                        <span className={`flex-1 text-sm ${subTask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                            {subTask.title}
                                                        </span>
                                                        <button
                                                            onClick={() => removeSubTask(index)}
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
                <div className="sticky bottom-0 bg-card border-t border-border p-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                    >
                        {initialData ? 'Save Changes' : 'Create Task'}
                    </Button>
                </div>
            </div>
        </div>
    );
}