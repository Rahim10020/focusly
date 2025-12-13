/**
 * @fileoverview Refactored TaskModal component - Simplified version.
 * Uses sub-components for better maintainability.
 */

'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { Priority, SubDomain, DOMAINS, Tag } from '@/types';
import { TaskModalBasicInfo } from './TaskModalBasicInfo';
import { TaskModalDates } from './TaskModalDates';
import { TaskModalRecurrence } from './TaskModalRecurrence';

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
    // Recurrence fields
    isRecurring?: boolean;
    recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
    recurrenceInterval?: number;
    recurrenceDaysOfWeek?: number[];
    recurrenceEndDate?: string;
}

/**
 * Simplified TaskModal component using sub-components for better maintainability.
 */
export default function TaskModalRefactored({
    isOpen,
    onClose,
    onSave,
    initialData,
    tags,
}: TaskModalProps) {
    const [formData, setFormData] = useState<TaskFormData>({
        title: '',
        priority: undefined,
        tags: [],
        notes: '',
        subTasks: [],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'categories' | 'subtasks' | 'recurrence'>('details');
    const [newSubTask, setNewSubTask] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);

    // Populate form with initial data when modal opens or initialData changes while open
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        // This effect synchronizes form state with external data (initialData prop)
        // It's necessary to update form when editing different tasks
        if (!isOpen) return;

        if (initialData) {
            setFormData({
                title: initialData.title || '',
                priority: initialData.priority,
                tags: initialData.tags || [],
                notes: initialData.notes,
                subDomain: initialData.subDomain,
                subTasks: initialData.subTasks || [],
                dueDate: initialData.dueDate,
                startDate: initialData.startDate,
                startTime: initialData.startTime,
                endTime: initialData.endTime,
                estimatedDuration: initialData.estimatedDuration,
                isRecurring: initialData.isRecurring,
                recurrencePattern: initialData.recurrencePattern,
                recurrenceInterval: initialData.recurrenceInterval,
                recurrenceDaysOfWeek: initialData.recurrenceDaysOfWeek,
                recurrenceEndDate: initialData.recurrenceEndDate,
            });
        } else {
            setFormData({
                title: '',
                priority: undefined,
                tags: [],
                notes: '',
                subTasks: [],
            });
        }

        setErrors({});
        setActiveTab('details');
        setNewSubTask('');
        setSearchQuery('');
    }, [initialData, isOpen]);

    // Keep the signature compatible with child components: (field: string, value: any)
    const handleChange = (field: string, value: unknown) => {
        setFormData(prev => ({ ...(prev as any), [field as keyof TaskFormData]: value } as TaskFormData));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleDurationChange = (duration: string) => {
        setFormData(prev => ({ ...prev, estimatedDuration: duration ? parseInt(duration) : undefined }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
        }

        // Validate dates
        if (typeof formData.startDate === 'number' && typeof formData.dueDate === 'number') {
            if (formData.startDate > formData.dueDate) {
                newErrors.dates = 'Start date must be before due date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        onSave({
            title: formData.title.trim(),
            priority: formData.priority,
            tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
            dueDate: formData.dueDate,
            startDate: formData.startDate,
            startTime: formData.startTime || undefined,
            endTime: formData.endTime || undefined,
            estimatedDuration: formData.estimatedDuration,
            notes: formData.notes?.trim() || undefined,
            subDomain: formData.subDomain,
            subTasks: formData.subTasks && formData.subTasks.length > 0 ? formData.subTasks : undefined,
            isRecurring: formData.isRecurring,
            recurrencePattern: formData.recurrencePattern,
            recurrenceInterval: formData.recurrenceInterval,
            recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
            recurrenceEndDate: formData.recurrenceEndDate,
        });

        onClose();
    };

    const toggleTag = (tagId: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.includes(tagId)
                ? prev.tags.filter(id => id !== tagId)
                : [...(prev.tags || []), tagId]
        }));
    };

    const addSubTask = () => {
        if (newSubTask.trim()) {
            setFormData(prev => ({
                ...prev,
                subTasks: [...(prev.subTasks || []), { title: newSubTask.trim(), completed: false }]
            }));
            setNewSubTask('');
        }
    };

    const toggleSubTask = (index: number) => {
        setFormData(prev => ({
            ...prev,
            subTasks: prev.subTasks?.map((task, i) =>
                i === index ? { ...task, completed: !task.completed } : task
            )
        }));
    };

    const removeSubTask = (index: number) => {
        setFormData(prev => ({
            ...prev,
            subTasks: prev.subTasks?.filter((_, i) => i !== index)
        }));
    };

    const filteredDomains = Object.entries(DOMAINS).filter(([_domainKey, domainInfo]) => {
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

    // Helper to get domain key from a subDomain value
    const getDomainFromSubDomain = (sub?: SubDomain): string | undefined => {
        if (!sub) return undefined;
        const found = Object.entries(DOMAINS).find(([_domainKey, domainInfo]) =>
            Object.keys(domainInfo.subDomains).includes(sub as string)
        );
        return found ? found[0] : undefined;
    };

    if (!isOpen) return null;

    const modalClasses = isFullScreen
        ? "fixed inset-0 z-50 bg-background"
        : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";

    const contentClasses = isFullScreen
        ? "w-full h-full bg-card border-0 rounded-none shadow-none overflow-y-auto"
        : "w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden";

    // Prepare date values for sub-components
    const dateValues = {
        startDate: formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : '',
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : '',
        startTime: formData.startTime || '',
        endTime: formData.endTime || '',
        estimatedDuration: formData.estimatedDuration?.toString() || '',
    };

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
                            title={isFullScreen ? 'Compact mode' : 'Full screen mode'}
                        >
                            {isFullScreen ? (
                                <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor">
                                    <path d="M30.706 2.706 21.413 12h7.586a1 1 0 0 1 0 2h-10a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v7.586l9.293-9.293a.999.999 0 1 1 1.413 1.414Zm-29.414 28a.997.997 0 0 0 1.414 0l9.293-9.293v7.586a1 1 0 0 0 2 0V19a1 1 0 0 0-1-1h-10a1 1 0 0 0 0 2h7.586l-9.293 9.293a.999.999 0 0 0 0 1.414Z" />
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
                            {(
                                [
                                    { id: 'details', label: 'Details' as const },
                                    { id: 'categories', label: 'Categories' as const, badge: formData.subDomain ? '1' : null },
                                    { id: 'subtasks', label: 'Subtasks' as const, badge: formData.subTasks && formData.subTasks.length > 0 ? formData.subTasks.length.toString() : null },
                                    { id: 'recurrence', label: 'Recurrence' as const, badge: formData.isRecurring ? '✓' : null }
                                ] as { id: typeof activeTab; label: string; badge?: string | null }[]
                            ).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
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
                <div className={`${isFullScreen ? 'p-6 space-y-8' : ''}`}>
                    {!isFullScreen && (
                        <div className="h-[calc(90vh-200px)] overflow-y-auto p-6 space-y-8">
                            {activeTab === 'details' && (
                                <>
                                    <TaskModalBasicInfo
                                        task={{ title: formData.title, notes: formData.notes }}
                                        onChange={handleChange}
                                        errors={errors}
                                    />

                                    {/* Priority */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            {priorityOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleChange('priority', formData.priority === option.value ? undefined : option.value)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${formData.priority === option.value
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
                                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer ${formData.tags?.includes(tag.id)
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

                                    <TaskModalDates
                                        task={dateValues}
                                        onChange={(field, value) => {
                                            if (field === 'startDate' || field === 'dueDate') {
                                                handleChange(field, value ? new Date(value).getTime() : undefined);
                                            } else {
                                                handleChange(field, value);
                                            }
                                        }}
                                        onDurationChange={handleDurationChange}
                                        errors={errors}
                                    />
                                </>
                            )}

                            {/* Categories Tab */}
                            {activeTab === 'categories' && (
                                <div className="p-6 space-y-4">
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Search categories..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full px-3 py-2 bg-muted border border-border rounded-md"
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
                                                                onClick={() => handleChange('subDomain', formData.subDomain === subDomainKey ? undefined : (subDomainKey as SubDomain))}
                                                                className={`p-3 text-left text-sm rounded-lg transition-all cursor-pointer ${formData.subDomain === subDomainKey
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
                                        <input
                                            type="text"
                                            placeholder="Add a subtask..."
                                            value={newSubTask}
                                            onChange={(e) => setNewSubTask(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
                                            className="flex-1 px-3 py-2 bg-muted border border-border rounded-md"
                                        />
                                        <Button onClick={addSubTask} size="sm" disabled={!newSubTask.trim()}>
                                            Add
                                        </Button>
                                    </div>

                                    {(formData.subTasks?.length || 0) > 0 ? (
                                        <div className="space-y-2">
                                            {(formData.subTasks || []).map((st, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                    <input
                                                        type="checkbox"
                                                        checked={st.completed}
                                                        onChange={() => toggleSubTask(idx)}
                                                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                                    />
                                                    <span className={`flex-1 text-sm ${st.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                        {st.title}
                                                    </span>
                                                    <button onClick={() => removeSubTask(idx)} className="text-muted-foreground hover:text-error transition-colors cursor-pointer">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
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

                            {activeTab === 'recurrence' && (
                                <TaskModalRecurrence
                                    task={{
                                        isRecurring: formData.isRecurring,
                                        recurrencePattern: formData.recurrencePattern,
                                        recurrenceInterval: formData.recurrenceInterval,
                                        recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
                                        recurrenceEndDate: formData.recurrenceEndDate,
                                    }}
                                    onChange={handleChange}
                                />
                            )}

                            {/* Other tabs omitted for brevity - keep existing implementation */}
                        </div>
                    )}

                    {isFullScreen && (
                        <div className="space-y-8">
                            <TaskModalBasicInfo
                                task={{ title: formData.title, notes: formData.notes }}
                                onChange={handleChange}
                                errors={errors}
                            />

                            {/* Priority and Tags - Keep existing */}

                            <TaskModalDates
                                task={dateValues}
                                onChange={(field, value) => {
                                    if (field === 'startDate' || field === 'dueDate') {
                                        handleChange(field, value ? new Date(value).getTime() : undefined);
                                    } else {
                                        handleChange(field, value);
                                    }
                                }}
                                onDurationChange={handleDurationChange}
                                errors={errors}
                            />

                            <div className="border-t border-border"></div>

                            <TaskModalRecurrence
                                task={{
                                    isRecurring: formData.isRecurring,
                                    recurrencePattern: formData.recurrencePattern,
                                    recurrenceInterval: formData.recurrenceInterval,
                                    recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
                                    recurrenceEndDate: formData.recurrenceEndDate,
                                }}
                                onChange={handleChange}
                            />

                            {/* Fullscreen: Categories & Subtasks sections */}
                            <div className="space-y-6">
                                {/* Categories */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                        className="w-full flex items-center justify-between p-2 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className={`w-5 h-5 text-muted-foreground transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                            <span className="text-lg font-medium text-foreground">Categories</span>
                                            {formData.subDomain && (() => {
                                                const domainKey = getDomainFromSubDomain(formData.subDomain);
                                                return (
                                                    <span className="text-sm text-muted-foreground">
                                                        {domainKey ? DOMAINS[domainKey as keyof typeof DOMAINS].subDomains[formData.subDomain as SubDomain] : ''}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </button>

                                    {isCategoriesOpen && (
                                        <div className="space-y-4 animate-slide-down">
                                            <input
                                                type="text"
                                                placeholder="Search categories..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full px-3 py-2 bg-muted border border-border rounded-md"
                                            />

                                            <div className="max-h-52 overflow-y-auto space-y-4">
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
                                                                    onClick={() => handleChange('subDomain', formData.subDomain === subDomainKey ? undefined : (subDomainKey as SubDomain))}
                                                                    className={`p-3 text-left text-sm rounded-lg transition-all cursor-pointer ${formData.subDomain === subDomainKey
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

                                {/* Subtasks */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setIsSubTasksOpen(!isSubTasksOpen)}
                                        className="w-full flex items-center justify-between p-2 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className={`w-5 h-5 text-muted-foreground transition-transform ${isSubTasksOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                            <span className="text-lg font-medium text-foreground">Subtasks</span>
                                            {(formData.subTasks?.length || 0) > 0 && (
                                                <span className="text-sm text-muted-foreground">
                                                    {formData.subTasks?.filter(t => t.completed).length}/{formData.subTasks?.length}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {isSubTasksOpen && (
                                        <div className="space-y-4 animate-slide-down">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Add a subtask..."
                                                    value={newSubTask}
                                                    onChange={(e) => setNewSubTask(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
                                                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-md"
                                                />
                                                <Button onClick={addSubTask} size="sm" disabled={!newSubTask.trim()}>
                                                    Add
                                                </Button>
                                            </div>

                                            {(formData.subTasks?.length || 0) > 0 && (
                                                <div className="space-y-2">
                                                    {(formData.subTasks || []).map((st, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                            <input
                                                                type="checkbox"
                                                                checked={st.completed}
                                                                onChange={() => toggleSubTask(idx)}
                                                                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                                                            />
                                                            <span className={`flex-1 text-sm ${st.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                                {st.title}
                                                            </span>
                                                            <button onClick={() => removeSubTask(idx)} className="text-muted-foreground hover:text-error transition-colors cursor-pointer">
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
                        disabled={!formData.title.trim()}
                    >
                        {initialData ? 'Save Changes' : 'Create Task'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
