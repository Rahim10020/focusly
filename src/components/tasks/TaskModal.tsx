'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Priority, SubDomain, DOMAINS, Domain, Tag } from '@/types';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: TaskFormData) => void;
    initialData?: TaskFormData;
    tags: Tag[];
}

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
    subTasks?: { title: string; completed: boolean }[];
}

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
    const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | undefined>(undefined);
    const [subTasks, setSubTasks] = useState<{ title: string; completed: boolean }[]>([]);
    const [newSubTask, setNewSubTask] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);

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
        : "w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-y-auto";

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
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {/* Top-left arrow pointing down-right */}
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l6 6M6 6h6v6" />
                                    {/* Top-right arrow pointing down-left */}
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6l-6 6M18 6h-6v6" />
                                    {/* Bottom-left arrow pointing up-right */}
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18l6-6M6 18h6v-6" />
                                    {/* Bottom-right arrow pointing up-left */}
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18l-6-6M18 18h-6v-6" />
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
                <div className={`p-6 ${isFullScreen ? 'grid grid-cols-[1fr_400px] gap-8' : 'space-y-8'}`}>
                    {/* Main Content */}
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
                                                className="bg-background border-border pr-10"
                                            />
                                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
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
                                                className="bg-background border-border pr-10"
                                            />
                                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
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
                                                className="bg-background border-border pr-10"
                                            />
                                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">End Time</label>
                                        <div className="relative">
                                            <Input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="bg-background border-border pr-10"
                                            />
                                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
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

                    {/* Right Sidebar - Categories & Subtasks (only in fullscreen) */}
                    {isFullScreen && (
                        <div className="space-y-6 border-l border-border pl-8">
                            {/* Categories Accordion */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                    className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-all cursor-pointer"
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
                                    className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-all cursor-pointer"
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
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Categories & Subtasks - Normal mode (below main content) */}
                    {!isFullScreen && (
                        <>
                            {/* Categories Accordion */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                    className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-all cursor-pointer"
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
                                    className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-xl transition-all cursor-pointer"
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
                                    </div>
                                )}
                            </div>
                        </>
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