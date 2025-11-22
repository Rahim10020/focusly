/**
 * @fileoverview Domain evolution chart component that visualizes progress
 * across different life domains using radar charts and bar charts.
 */

'use client';

import { useEffect, useState } from 'react';
import { Task, DOMAINS, Domain, getDomainFromSubDomain } from '@/types';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell,
} from 'recharts';

/**
 * Props for the DomainEvolutionChart component.
 * @interface DomainEvolutionChartProps
 */
interface DomainEvolutionChartProps {
    /** Array of tasks to analyze by domain */
    tasks: Task[];
}

/**
 * Displays domain-specific progress using multiple chart visualizations.
 * Includes a radar chart for life balance overview, bar charts for task
 * completion by domain, and summary cards with detailed statistics.
 * Supports both light and dark themes with automatic detection.
 *
 * @param {DomainEvolutionChartProps} props - Component props
 * @param {Task[]} props.tasks - Array of tasks to analyze across domains
 * @returns {JSX.Element} Multi-chart visualization of domain progress
 *
 * @example
 * ```tsx
 * import DomainEvolutionChart from '@/components/stats/DomainEvolutionChart';
 *
 * function DomainAnalytics({ tasks }) {
 *   return (
 *     <div className="p-6">
 *       <h2>Life Balance Overview</h2>
 *       <DomainEvolutionChart tasks={tasks} />
 *     </div>
 *   );
 * }
 * ```
 */
export default function DomainEvolutionChart({ tasks }: DomainEvolutionChartProps) {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'dark' : 'light');
        };

        updateTheme();

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);
    // Calculate domain statistics
    const domainStats = Object.keys(DOMAINS).map((domainKey) => {
        const domain = domainKey as Domain;
        const domainInfo = DOMAINS[domain];

        const domainTasks = tasks.filter((task) => {
            if (!task.subDomain) return false;
            try {
                return getDomainFromSubDomain(task.subDomain) === domain;
            } catch {
                return false;
            }
        });

        const completedTasks = domainTasks.filter((t) => t.completed).length;
        const totalTasks = domainTasks.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const totalPomodoros = domainTasks.reduce((sum, t) => sum + t.pomodoroCount, 0);

        return {
            domain: domainInfo.name.replace(' (Physical & Mental)', '').replace(' & ', '\n& '),
            fullDomain: domainInfo.name,
            completionRate: Math.round(completionRate),
            completed: completedTasks,
            total: totalTasks,
            pomodoros: totalPomodoros,
            score: Math.round((completionRate + (totalPomodoros * 2)) / 2),
        };
    });

    // Domain colors
    const domainColors = {
        'Health': '#10b981',
        'Career\n& Skills': '#3b82f6',
        'Finance\n& Business': '#f59e0b',
        'Relationships\n& Social Life': '#ec4899',
        'Personal Development\n& Lifestyle': '#8b5cf6',
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium mb-2">{data.fullDomain}</p>
                    <div className="space-y-1 text-xs">
                        <div>Completion Rate: {data.completionRate}%</div>
                        <div>Tasks: {data.completed}/{data.total}</div>
                        <div>Pomodoros: {data.pomodoros}</div>
                        <div>Overall Score: {data.score}</div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Radar Chart - Overall Balance */}
            <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-lg font-semibold mb-4">Life Balance Radar</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Visual representation of your progress across all life domains
                </p>
                <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={domainStats}>
                        <PolarGrid className="stroke-muted" />
                        <PolarAngleAxis
                            dataKey="domain"
                            tick={{ fill: theme === 'dark' ? '#F1F5F9' : '#1F2937', fontSize: 20 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                        <Radar
                            name="Score"
                            dataKey="score"
                            stroke={theme === 'dark' ? '#F87171' : '#EF4444'}
                            fill={theme === 'dark' ? '#F87171' : '#EF4444'}
                            fillOpacity={0.3}
                            strokeWidth={2}
                        />
                        <Radar
                            name="Completion"
                            dataKey="completionRate"
                            stroke="hsl(142, 76%, 36%)"
                            fill="hsl(142, 76%, 36%)"
                            fillOpacity={0.1}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />
                        <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span>Overall Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        <span>Completion Rate</span>
                    </div>
                </div>
            </div>

            {/* Bar Chart - Tasks by Domain */}
            <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-lg font-semibold mb-4">Tasks Completion by Domain</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={domainStats}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="domain"
                            className="text-xs"
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                            angle={-15}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="total" fill={theme === 'dark' ? '#334155' : '#F3F4F6'} name="Total" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completed" fill={theme === 'dark' ? '#F87171' : '#EF4444'} name="Completed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Completion Rate Breakdown */}
            <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-lg font-semibold mb-4">Completion Rate Breakdown</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={domainStats} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }} />
                        <YAxis
                            type="category"
                            dataKey="domain"
                            width={120}
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280', fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="completionRate" radius={[0, 8, 8, 0]}>
                            {domainStats.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.completionRate >= 75
                                            ? 'hsl(142, 76%, 36%)'
                                            : entry.completionRate >= 50
                                                ? (theme === 'dark' ? '#F87171' : '#EF4444')
                                                : entry.completionRate >= 25
                                                    ? 'hsl(45, 93%, 47%)'
                                                    : 'hsl(0, 72%, 51%)'
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        <span>≥75%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span>50-74%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>25-49%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>&lt;25%</span>
                    </div>
                </div>
            </div>

            {/* Domain Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domainStats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-card p-4 rounded-xl border border-border hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h4 className="text-sm font-medium">{stat.fullDomain}</h4>
                            <div className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {stat.completionRate}%
                            </div>
                        </div>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Tasks Completed</span>
                                <span className="font-medium text-foreground">
                                    {stat.completed}/{stat.total}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pomodoros</span>
                                <span className="font-medium text-foreground">{stat.pomodoros}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Overall Score</span>
                                <span className="font-medium text-foreground">{stat.score}</span>
                            </div>
                        </div>
                        <div className="mt-3 w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${stat.completionRate}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
