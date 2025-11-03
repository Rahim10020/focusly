'use client';

import { PomodoroSession } from '@/types';

interface ProductivityChartProps {
    sessions: PomodoroSession[];
}

export default function ProductivityChart({ sessions }: ProductivityChartProps) {
    // Get last 7 days data
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

    const days = getLast7Days();

    // Calculate focus time per day
    const dataByDay = days.map(day => {
        const nextDay = day.date + 24 * 60 * 60 * 1000;
        const daySessions = sessions.filter(
            session =>
                session.completed &&
                session.type === 'work' &&
                session.startedAt >= day.date &&
                session.startedAt < nextDay
        );

        const totalMinutes = daySessions.reduce((sum, session) => sum + Math.floor(session.duration / 60), 0);

        return {
            ...day,
            minutes: totalMinutes,
            sessions: daySessions.length,
        };
    });

    const maxMinutes = Math.max(...dataByDay.map(d => d.minutes), 1);

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between gap-2 h-48">
                {dataByDay.map((day, index) => {
                    const height = (day.minutes / maxMinutes) * 100;

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex flex-col items-center justify-end flex-1">
                                <div className="group relative w-full">
                                    <div
                                        className="w-full bg-primary rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer"
                                        style={{ height: `${height}%`, minHeight: day.minutes > 0 ? '8px' : '0px' }}
                                    />

                                    {/* Tooltip */}
                                    {day.minutes > 0 && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                                                <p className="text-xs font-medium text-foreground">{day.fullDate}</p>
                                                <p className="text-xs text-muted-foreground">{day.minutes}m • {day.sessions} sessions</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-xs font-medium text-foreground">{day.label}</p>
                                <p className="text-xs text-muted-foreground">{day.minutes}m</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span>Focus time</span>
                </div>
            </div>
        </div>
    );
}