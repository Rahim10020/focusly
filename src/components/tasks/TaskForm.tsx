'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Tag, Priority, SubDomain, DOMAINS, getDomainFromSubDomain } from '@/types';
import TagBadge from '@/components/ui/TagBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';

interface TaskFormProps {
    onAddTask: (
        title: string,
        priority?: Priority,
        tags?: string[],
        dueDate?: number,
        notes?: string,
        subDomain?: SubDomain,
        startDate?: number,
        startTime?: string,
        endTime?: string,
        estimatedDuration?: number
    ) => void;
    availableTags: Tag[];
}

export default function TaskForm({ onAddTask, availableTags }: TaskFormProps) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | undefined>(undefined);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAddTask(
                title.trim(),
                priority,
                selectedTags.length > 0 ? selectedTags : undefined,
                dueDate ? new Date(dueDate).getTime() : undefined,
                notes.trim() || undefined,
                selectedSubDomain,
                startDate ? new Date(startDate).getTime() : undefined,
                startTime || undefined,
                endTime || undefined,
                estimatedDuration ? parseInt(estimatedDuration) : undefined
            );
            setTitle('');
            setPriority(undefined);
            setSelectedTags([]);
            setDueDate('');
            setStartDate('');
            setStartTime('');
            setEndTime('');
            setEstimatedDuration('');
            setNotes('');
            setShowOptions(false);
            setSelectedSubDomain(undefined);
        }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1"
                />
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowOptions(!showOptions)}
                    className="px-3 sm:px-3"
                    title="More options"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m-5-7H1m6 0h6m6 0h6"></path>
                    </svg>
                </Button>
                <Button type="submit" disabled={!title.trim()} className="w-full sm:w-auto">
                    Add
                </Button>
            </div>

            {showOptions && (
                <div className="space-y-4 p-4 bg-muted rounded-xl">
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Category
                        </label>
                        <div className="space-y-3">
                            {Object.entries(DOMAINS).map(([domainKey, domainInfo]) => (
                                <div key={domainKey} className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">
                                        {domainInfo.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {domainInfo.description}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {Object.entries(domainInfo.subDomains).map(([subDomainKey, subDomainName]) => (
                                            <button
                                                key={subDomainKey}
                                                type="button"
                                                onClick={() => setSelectedSubDomain(selectedSubDomain === subDomainKey ? undefined : subDomainKey as SubDomain)}
                                                className={`p-2 text-left text-sm rounded-lg transition-all ${selectedSubDomain === subDomainKey
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-card hover:bg-accent text-card-foreground'
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

                    {/* Priority Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Priority
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setPriority(priority === 'high' ? undefined : 'high')}
                                className={`flex-1 p-2 cursor-pointer shadow-lg rounded-lg transition-all ${priority === 'high'
                                    ? 'bg-gray-100 dark:bg-gray-800'
                                    : 'hover:bg-accent'
                                    }`}
                            >
                                <PriorityBadge priority="high" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority(priority === 'medium' ? undefined : 'medium')}
                                className={`flex-1 p-2 cursor-pointer shadow-lg rounded-lg transition-all ${priority === 'medium'
                                    ? 'bg-gray-200 dark:bg-gray-700'
                                    : 'hover:bg-accent'
                                    }`}
                            >
                                <PriorityBadge priority="medium" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority(priority === 'low' ? undefined : 'low')}
                                className={`flex-1 p-2 cursor-pointer shadow-lg rounded-lg transition-all ${priority === 'low'
                                    ? 'bg-gray-50 dark:bg-gray-900'
                                    : 'hover:bg-accent'
                                    }`}
                            >
                                <PriorityBadge priority="low" />
                            </button>
                        </div>
                    </div>

                    {/* Tags Selection */}
                    {availableTags.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`transition-all ${selectedTags.includes(tag.id) ? 'scale-105' : 'opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <TagBadge tag={tag} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Scheduling Section */}
                    <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
                        <div className="text-sm font-medium text-foreground flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Schedule & Duration
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Start Date */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Start Date
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Due Date */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Due Date
                                </label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    min={startDate || new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Start Time */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Start Time
                                </label>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>

                            {/* End Time */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    End Time
                                </label>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>

                            {/* Estimated Duration */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Duration (min)
                                </label>
                                <Input
                                    type="number"
                                    value={estimatedDuration}
                                    onChange={(e) => setEstimatedDuration(e.target.value)}
                                    placeholder="25"
                                    min="1"
                                    step="5"
                                />
                            </div>
                        </div>

                        {/* Helpful hint */}
                        {estimatedDuration && (
                            <div className="text-xs text-muted-foreground bg-muted p-2 rounded-lg flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                <span>
                                    ≈ {Math.ceil(parseInt(estimatedDuration) / 25)} Pomodoro session{Math.ceil(parseInt(estimatedDuration) / 25) > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this task..."
                            className="w-full px-4 py-2.5 bg-card text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground resize-none"
                            rows={3}
                        />
                    </div>
                </div>
            )}
        </form>
    );
}