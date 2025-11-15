'use client';

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
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
}

export default function TaskModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    tags,
}: TaskModalProps) {
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
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'category'>('details');

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
        }
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
        });

        onClose();
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const filteredDomains = Object.entries(DOMAINS).filter(([domainKey, domainInfo]) => {
        const domainMatch = domainInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            domainInfo.description.toLowerCase().includes(searchQuery.toLowerCase());
        const subDomainMatch = Object.values(domainInfo.subDomains).some(subName =>
            subName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return domainMatch || subDomainMatch;
    });

    const priorityColors = {
        high: 'bg-error text-white border-error',
        medium: 'bg-warning text-white border-warning',
        low: 'bg-info text-white border-info',
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Task' : 'Create New Task'}
            description="Add details to organize your task"
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
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
            }
        >
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-border">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-2 font-medium transition-all border-b-2 ${
                            activeTab === 'details'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('category')}
                        className={`px-4 py-2 font-medium transition-all border-b-2 ${
                            activeTab === 'category'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Category
                    </button>
                </div>

                {activeTab === 'details' ? (
                    <div className="space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Task Title *
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                autoFocus
                                className="w-full px-4 py-3 text-lg bg-card text-foreground border-2 border-border focus:border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-all"
                            />
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                Priority
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(priority === p ? undefined : p)}
                                        className={`p-4 rounded-xl border-2 transition-all font-medium text-sm ${
                                            priority === p
                                                ? priorityColors[p] + ' scale-105'
                                                : 'bg-card hover:bg-accent border-border hover:border-primary/30'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                {p === 'high' && <path d="M10 2L2 8l8 6 8-6-8-6z" />}
                                                {p === 'medium' && <path d="M10 2v16M2 8l8 6 8-6" />}
                                                {p === 'low' && <path d="M10 18L2 12l8-6 8 6-8 6z" />}
                                            </svg>
                                            <span className="capitalize">{p}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => toggleTag(tag.id)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                                selectedTags.includes(tag.id)
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

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Due Date
                            </label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {/* Scheduling Section */}
                        <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">Task Scheduling (Optional)</h3>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Start Date
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Time Range */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Start Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        End Time
                                    </label>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Estimated Duration */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Estimated Duration (minutes)
                                </label>
                                <Input
                                    type="number"
                                    value={estimatedDuration}
                                    onChange={(e) => setEstimatedDuration(e.target.value)}
                                    min="0"
                                    placeholder="e.g., 60"
                                />
                                {estimatedDuration && parseInt(estimatedDuration) > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        ≈ {Math.ceil(parseInt(estimatedDuration) / 25)} Pomodoro sessions
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any additional details..."
                                className="w-full px-4 py-3 bg-card text-foreground border-2 border-border focus:border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none transition-all"
                                rows={4}
                            />
                        </div>

                        {/* Selected Category Display */}
                        {selectedSubDomain && (
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                <div className="text-sm font-semibold text-foreground mb-1">
                                    Selected Category
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {DOMAINS[Object.keys(DOMAINS).find(domain =>
                                        DOMAINS[domain as Domain].subDomains[selectedSubDomain]
                                    ) as Domain]?.name} → {DOMAINS[Object.keys(DOMAINS).find(domain =>
                                        DOMAINS[domain as Domain].subDomains[selectedSubDomain]
                                    ) as Domain]?.subDomains[selectedSubDomain]}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Category Search */}
                        <Input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {/* Domains & Subdomains */}
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
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
                                    <div className="grid grid-cols-2 gap-2 ml-10">
                                        {Object.entries(domainInfo.subDomains).map(([subDomainKey, subDomainName]) => (
                                            <button
                                                key={subDomainKey}
                                                type="button"
                                                onClick={() => setSelectedSubDomain(
                                                    selectedSubDomain === subDomainKey ? undefined : subDomainKey as SubDomain
                                                )}
                                                className={`p-3 text-left text-sm rounded-lg transition-all ${
                                                    selectedSubDomain === subDomainKey
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
        </Modal>
    );
}
