/**
 * @fileoverview Domain statistics component that displays task completion
 * progress organized by life domains and their sub-domains.
 */

'use client';

import { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Task, DOMAINS, getDomainFromSubDomain, Domain, SubDomain } from '@/types';

/**
 * Props for the DomainStats component.
 * @interface DomainStatsProps
 */
interface DomainStatsProps {
    /** Array of tasks to calculate domain statistics from */
    tasks: Task[];
}

/**
 * Displays per-domain statistics with progress bars for each life domain
 * and its sub-domains. Shows completion rates and task counts organized
 * in expandable cards. All domains are always displayed even with 0% completion.
 *
 * @param {DomainStatsProps} props - Component props
 * @param {Task[]} props.tasks - Array of tasks to calculate statistics from
 * @returns {JSX.Element} Cards displaying domain and sub-domain progress
 *
 * @example
 * ```tsx
 * import DomainStats from '@/components/stats/DomainStats';
 *
 * function StatsPage({ tasks }) {
 *   return (
 *     <div className="space-y-4">
 *       <h2>Progress by Domain</h2>
 *       <DomainStats tasks={tasks} />
 *     </div>
 *   );
 * }
 * ```
 */
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

    // Always show all domains, even with 0% completion

    return (
        <div className="space-y-6">
            {Object.entries(DOMAINS).map(([domainKey, domainInfo]) => {
                const stats = domainStats[domainKey as Domain];
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
                                    const subStats = stats.subDomains[subDomainKey as SubDomain] || { total: 0, completed: 0 };
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