'use client';

import { useState, useEffect } from 'react';
import { Task, Tag, DOMAINS, getDomainFromSubDomain, Priority, SubDomain } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PriorityBadge from '@/components/ui/PriorityBadge';
import TagBadge from '@/components/ui/TagBadge';
import SubTaskList from './SubTaskList';

interface TaskDetailsModalProps {
    task: Task;
    tags: Tag[];
    onClose: () => void;
    onUpdate: (updates: Partial<Task>) => void;
    onAddSubTask: (title: string) => void;
    onToggleSubTask: (subTaskId: string) => void;
    onDeleteSubTask: (subTaskId: string) => void;
}

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

    const taskTags = tags.filter(tag => selectedTags.includes(tag.id));
    const isOverdue = task.dueDate && task.dueDate < Date.now() && !task.completed;
    const isDueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();

    const handleSave = () => {
        onUpdate({
            title: title.trim(),
            priority,
            tags: selectedTags.length > 0 ? selectedTags : undefined,
            dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
            notes: notes.trim() || undefined,
            subDomain: selectedSubDomain,
            startDate: startDate ? new Date(startDate).getTime() : undefined,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
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
        : "w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-y-auto";

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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Task Title */}
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-foreground"
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
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Schedule & Duration</h3>

                        {/* Date Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Start Date</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Due Date</label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                                {isOverdue && (
                                    <p className="text-xs text-error">
                                        ⚠️ This task is overdue!
                                    </p>
                                )}
                                {isDueToday && !isOverdue && (
                                    <p className="text-xs text-muted-foreground">
                                        📅 Due today
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Time Row */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Start Time</label>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">End Time</label>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-foreground">Duration (min)</label>
                                <Input
                                    type="number"
                                    value={estimatedDuration}
                                    onChange={(e) => setEstimatedDuration(e.target.value)}
                                    min="0"
                                    step="5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Category
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className="w-full text-left bg-muted text-foreground rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between cursor-pointer"
                            >
                                <span>
                                    {selectedSubDomain
                                        ? DOMAINS[getDomainFromSubDomain(selectedSubDomain)].subDomains[selectedSubDomain]
                                        : 'Select a category'}
                                </span>
                                <svg
                                    className={`w-4 h-4 text-muted-foreground transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isCategoriesOpen && (
                                <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                                    <div className="p-2">
                                        <input
                                            type="text"
                                            placeholder="Search categories..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-muted text-foreground rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    {filteredDomains.map(([domainKey, domainInfo]) => (
                                        <div key={domainKey} className="border-t border-border">
                                            <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                {domainInfo.name}
                                            </div>
                                            {Object.entries(domainInfo.subDomains).map(([subKey, subName]) => (
                                                <div
                                                    key={subKey}
                                                    onClick={() => {
                                                        setSelectedSubDomain(subKey as SubDomain);
                                                        setIsCategoriesOpen(false);
                                                    }}
                                                    className={`px-6 py-2 text-sm cursor-pointer hover:bg-accent ${selectedSubDomain === subKey ? 'bg-accent' : ''}`}
                                                >
                                                    {subName}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this task..."
                            className="w-full px-4 py-3 bg-muted text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[120px]"
                        />
                    </div>

                    {/* Sub-tasks */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-foreground">
                                Sub-tasks
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsSubTasksOpen(!isSubTasksOpen)}
                                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                            >
                                {isSubTasksOpen ? 'Hide' : 'Show'}
                                <svg
                                    className={`w-4 h-4 transition-transform ${isSubTasksOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {isSubTasksOpen && (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={newSubTask}
                                        onChange={(e) => setNewSubTask(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
                                        placeholder="Add a sub-task..."
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={addSubTask}
                                        size="sm"
                                    >
                                        Add
                                    </Button>
                                </div>

                                {(task.subTasks?.length || 0) > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {task.subTasks?.map((subTask, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    checked={subTask.completed}
                                                    onChange={() => onToggleSubTask(subTask.id)}
                                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                                />
                                                <span className={`flex-1 text-sm ${subTask.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                    {subTask.title}
                                                </span>
                                                <button
                                                    onClick={() => onDeleteSubTask(subTask.id)}
                                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
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

                {/* Footer */}
                <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3 justify-between">
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
                        <Button
                            onClick={onClose}
                            variant="outline"
                        >
                            Cancel
                        </Button>
                        <Button
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