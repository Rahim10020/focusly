'use client';

import { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Task, DOMAINS, getDomainFromSubDomain, Domain, SubDomain } from '@/types';

interface DomainStatsProps {
    tasks: Task[];
}

export default function DomainStats({ tasks }: DomainStatsProps) {
    const domainStats = useMemo(() => {
        const stats: Record<Domain, {
            total: number;
            completed: number;
            subDomains: Record<SubDomain, { total: number; completed: number }>;
        }> = {} as any;

        // Initialize stats
        Object.keys(DOMAINS).forEach(domain => {
            stats[domain as Domain] = {
                total: 0,
                completed: 0,
                subDomains: {} as Record<SubDomain, { total: number; completed: number }>,
            };
        });

        // Count tasks by domain and subdomain
        tasks.forEach(task => {
            if (task.subDomain) {
                const domain = getDomainFromSubDomain(task.subDomain);
                stats[domain].total++;
                if (task.completed) {
                    stats[domain].completed++;
                }

                if (!stats[domain].subDomains[task.subDomain]) {
                    stats[domain].subDomains[task.subDomain] = { total: 0, completed: 0 };
                }
                stats[domain].subDomains[task.subDomain].total++;
                if (task.completed) {
                    stats[domain].subDomains[task.subDomain].completed++;
                }
            }
        });

        return stats;
    }, [tasks]);

    const totalTasksWithDomain = Object.values(domainStats).reduce((sum, domain) => sum + domain.total, 0);

    if (totalTasksWithDomain === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Domain Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No tasks with domains yet. Start categorizing your tasks to see progress here!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(DOMAINS).map(([domainKey, domainInfo]) => {
                const stats = domainStats[domainKey as Domain];
                if (stats.total === 0) return null;

                const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

                return (
                    <Card key={domainKey}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{domainInfo.name}</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    {stats.completed}/{stats.total} completed
                                </span>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">{domainInfo.description}</p>
                        </CardHeader>
                        <CardContent>
                            {/* Domain Progress Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Overall Progress</span>
                                    <span>{Math.round(completionRate)}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${completionRate}%` }}
                                    />
                                </div>
                            </div>

                            {/* Subdomains */}
                            <div className="space-y-3">
                                {Object.entries(domainInfo.subDomains).map(([subDomainKey, subDomainName]) => {
                                    const subStats = stats.subDomains[subDomainKey as SubDomain];
                                    if (!subStats) return null;

                                    const subCompletionRate = subStats.total > 0 ? (subStats.completed / subStats.total) * 100 : 0;

                                    return (
                                        <div key={subDomainKey} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{subDomainName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {subStats.completed}/{subStats.total}
                                                </span>
                                            </div>
                                            <div className="w-full bg-muted/50 rounded-full h-1.5">
                                                <div
                                                    className="bg-accent h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${subCompletionRate}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}