/**
 * @fileoverview Advanced productivity analytics component with multiple chart types
 * including area charts, bar charts, and line charts for comprehensive productivity insights.
 */

'use client';

import { useEffect, useState } from 'react';
import { PomodoroSession } from '@/types';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';

/**
 * Props for the AdvancedProductivityChart component.
 * @interface AdvancedProductivityChartProps
 */
interface AdvancedProductivityChartProps {
    /** Array of pomodoro sessions to analyze and visualize */
    sessions: PomodoroSession[];
    /** Number of days to display (7 or 30). Defaults to 7 */
    days?: number;
}

/**
 * Displays advanced productivity analytics with multiple visualizations.
 * Includes a summary statistics section, area chart for daily focus time,
 * bar chart for completed sessions, and line chart for focus score trends.
 * Supports both light and dark themes with automatic detection.
 *
 * @param {AdvancedProductivityChartProps} props - Component props
 * @param {PomodoroSession[]} props.sessions - Array of pomodoro sessions to analyze
 * @param {number} [props.days=7] - Number of days to display (7 or 30)
 * @returns {JSX.Element} Multiple chart visualizations with productivity analytics
 *
 * @example
 * ```tsx
 * import AdvancedProductivityChart from '@/components/stats/AdvancedProductivityChart';
 *
 * function AnalyticsPage({ sessions }) {
 *   return (
 *     <div className="space-y-6">
 *       <h2>7-Day Analytics</h2>
 *       <AdvancedProductivityChart sessions={sessions} days={7} />
 *
 *       <h2>30-Day Analytics</h2>
 *       <AdvancedProductivityChart sessions={sessions} days={30} />
 *     </div>
 *   );
 * }
 * ```
 */
export default function AdvancedProductivityChart({
    sessions,
    days = 7
}: AdvancedProductivityChartProps) {
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
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            days.push({
                date: date.getTime(),
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            });
        }
        return days;
    };

    const getLast30Days = () => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            days.push({
                date: date.getTime(),
                label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            });
        }
        return days;
    };

    const daysData = days === 30 ? getLast30Days() : getLast7Days();

    const chartData = daysData.map((day) => {
        const nextDay = day.date + 24 * 60 * 60 * 1000;
        const daySessions = sessions.filter(
            (session) =>
                session.completed &&
                session.startedAt >= day.date &&
                session.startedAt < nextDay
        );

        const workSessions = daySessions.filter((s) => s.type === 'work');
        const totalMinutes = workSessions.reduce(
            (sum, session) => sum + session.duration / 60,
            0
        );
        const totalSessions = workSessions.length;
        const focusScore = totalMinutes > 0 ? Math.min(100, (totalMinutes / 120) * 100) : 0;

        return {
            date: day.label,
            fullDate: day.fullDate,
            minutes: Math.round(totalMinutes),
            sessions: totalSessions,
            focusScore: Math.round(focusScore),
            hours: parseFloat((totalMinutes / 60).toFixed(1)),
        };
    });

    const maxMinutes = Math.max(...chartData.map((d) => d.minutes), 1);
    const avgMinutes = Math.round(
        chartData.reduce((sum, d) => sum + d.minutes, 0) / chartData.length
    );

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium mb-2">{payload[0].payload.fullDate}</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span className="text-xs">Focus Time: {payload[0].payload.minutes} min</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-xs">Sessions: {payload[0].payload.sessions}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-xs">Focus Score: {payload[0].payload.focusScore}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Avg Daily</div>
                    <div className="text-lg font-bold">{avgMinutes} min</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Peak Day</div>
                    <div className="text-lg font-bold">{maxMinutes} min</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Total</div>
                    <div className="text-lg font-bold">
                        {chartData.reduce((sum, d) => sum + d.minutes, 0)} min
                    </div>
                </div>
            </div>

            {/* Area Chart - Focus Time */}
            <div className="bg-card p-4 rounded-xl border border-border">
                <h3 className="text-sm font-medium mb-4">Daily Focus Time</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="minutes"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#colorMinutes)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Bar Chart - Sessions */}
            <div className="bg-card p-4 rounded-xl border border-border">
                <h3 className="text-sm font-medium mb-4">Completed Sessions</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="sessions"
                            fill={theme === 'dark' ? '#F87171' : '#EF4444'}
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Line Chart - Focus Score */}
            <div className="bg-card p-4 rounded-xl border border-border">
                <h3 className="text-sm font-medium mb-4">Focus Score Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                        <YAxis
                            className="text-xs"
                            domain={[0, 100]}
                            tick={{ fill: theme === 'dark' ? '#94A3B8' : '#6B7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="focusScore"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
