'use client';

import { formatTime } from '@/lib/utils/time';

interface TimerDisplayProps {
    timeLeft: number;
    sessionType: 'work' | 'break';
}

export default function TimerDisplay({ timeLeft, sessionType }: TimerDisplayProps) {
    return (
        <div className="text-center space-y-4">
            <div className="inline-block px-4 py-2 rounded-full bg-muted">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {sessionType === 'work' ? 'Focus Time' : 'Break Time'}
                </span>
            </div>

            <div className="text-7xl font-bold text-foreground font-mono">
                {formatTime(timeLeft)}
            </div>
        </div>
    );
}