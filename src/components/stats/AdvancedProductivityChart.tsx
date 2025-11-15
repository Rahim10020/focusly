'use client';

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

interface AdvancedProductivityChartProps {
    sessions: PomodoroSession[];
    days?: number;
}

export default function AdvancedProductivityChart({
    sessions,
    days = 7
}: AdvancedProductivityChartProps) {
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
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="sessions"
                            fill="hsl(var(--primary))"
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
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            domain={[0, 100]}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
