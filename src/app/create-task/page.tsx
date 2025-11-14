'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Domain, SubDomain, DOMAINS, Priority, Tag } from '@/types';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTags } from '@/lib/hooks/useTags';

export default function CreateTaskPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { addTask } = useTasks();
    const { tags } = useTags();

    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            addTask(
                title.trim(),
                priority,
                selectedTags.length > 0 ? selectedTags : undefined,
                dueDate ? new Date(dueDate).getTime() : undefined,
                notes.trim() || undefined,
                selectedSubDomain
            );
            router.push('/');
        }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    // Filter domains and subdomains based on search
    const filteredDomains = Object.entries(DOMAINS).filter(([domainKey, domainInfo]) => {
        const domainMatch = domainInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            domainInfo.description.toLowerCase().includes(searchQuery.toLowerCase());
        const subDomainMatch = Object.values(domainInfo.subDomains).some(subName =>
            subName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return domainMatch || subDomainMatch;
    });

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        router.push('/auth/signin');
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Create New Task</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Right Side - Task Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Task Title</label>
                                        <Input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="What needs to be done?"
                                            required
                                        />
                                    </div>

                                    {/* Selected Category */}
                                    {selectedSubDomain && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Selected Category</label>
                                            <div className="p-3 bg-muted rounded-lg">
                                                <div className="text-sm font-medium">
                                                    {DOMAINS[Object.keys(DOMAINS).find(domain =>
                                                        DOMAINS[domain as Domain].subDomains[selectedSubDomain]
                                                    ) as Domain]?.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {DOMAINS[Object.keys(DOMAINS).find(domain =>
                                                        DOMAINS[domain as Domain].subDomains[selectedSubDomain]
                                                    ) as Domain]?.subDomains[selectedSubDomain]}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Priority */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Priority</label>
                                        <div className="flex gap-2">
                                            {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setPriority(priority === p ? undefined : p)}
                                                    className={`flex-1 p-3 rounded-lg border transition-all ${priority === p
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-card hover:bg-accent border-border'
                                                        }`}
                                                >
                                                    <div className="text-sm font-medium capitalize">{p}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {tags.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Tags</label>
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map(tag => (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => toggleTag(tag.id)}
                                                        className={`px-3 py-1 rounded-full text-sm transition-all ${selectedTags.includes(tag.id)
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted hover:bg-accent text-muted-foreground'
                                                            }`}
                                                    >
                                                        {tag.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Due Date */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Due Date (Optional)</label>
                                        <Input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Notes (Optional)</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Add any additional details..."
                                            className="w-full px-4 py-2 bg-card text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground resize-none"
                                            rows={4}
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={!title.trim()} className="px-8">
                                            Create Task
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Left Sidebar - Domains & Subdomains */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Categories</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Input
                                        type="text"
                                        placeholder="Search categories..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                    />

                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {filteredDomains.map(([domainKey, domainInfo]) => (
                                            <div key={domainKey} className="space-y-2">
                                                <div className="text-sm font-medium text-foreground">
                                                    {domainInfo.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {domainInfo.description}
                                                </div>
                                                <div className="space-y-1">
                                                    {Object.entries(domainInfo.subDomains).map(([subDomainKey, subDomainName]) => (
                                                        <button
                                                            key={subDomainKey}
                                                            type="button"
                                                            onClick={() => setSelectedSubDomain(selectedSubDomain === subDomainKey ? undefined : subDomainKey as SubDomain)}
                                                            className={`w-full p-2 text-left text-sm rounded-lg transition-all ${selectedSubDomain === subDomainKey
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
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}