'use client';

import { useEffect, useState } from 'react';
import { useStats } from '@/lib/hooks/useStats';
import { useTasks } from '@/lib/hooks/useTasks';
import { formatTime } from '@/lib/utils/time';
import StatsCard from './StatsCard';

export default function StatsOverview() {
    const { stats, getTodayFocusTime } = useStats();
    const { tasks } = useTasks();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Today's Focus"
                    value="0m"
                    subtitle="00:00:00"
                    icon={
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
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    }
                />
                <StatsCard
                    title="Total Focus Time"
                    value="0m"
                    subtitle="0 sessions"
                    icon={
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
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                    }
                />
                <StatsCard
                    title="Tasks Completed"
                    value={0}
                    subtitle="of 0 total"
                    icon={
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
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    }
                />
                <StatsCard
                    title="Completion Rate"
                    value="0%"
                    subtitle="Start adding tasks"
                    icon={
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
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    }
                />
            </div>
        );
    }

    const todayFocusSeconds = getTodayFocusTime();
    const todayFocusMinutes = Math.floor(todayFocusSeconds / 60);
    const completionRate = stats.totalTasks > 0
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
                title="Today's Focus"
                value={`${todayFocusMinutes}m`}
                subtitle={formatTime(todayFocusSeconds)}
                icon={
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
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                }
            />

            <StatsCard
                title="Total Focus Time"
                value={`${stats.totalFocusTime}m`}
                subtitle={`${stats.totalSessions} sessions`}
                icon={
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
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                }
            />

            <StatsCard
                title="Tasks Completed"
                value={stats.completedTasks}
                subtitle={`of ${stats.totalTasks} total`}
                icon={
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
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                }
            />

            <StatsCard
                title="Completion Rate"
                value={`${completionRate}%`}
                subtitle={stats.totalTasks > 0 ? 'Keep it up!' : 'Start adding tasks'}
                icon={
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
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                }
            />
        </div>
    );
}