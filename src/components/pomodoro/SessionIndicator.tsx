'use client';

import { POMODORO_CYCLES_FOR_LONG_BREAK } from '@/lib/constants';

interface SessionIndicatorProps {
    completedCycles: number;
}

export default function SessionIndicator({ completedCycles }: SessionIndicatorProps) {
    const cycles = Array.from({ length: POMODORO_CYCLES_FOR_LONG_BREAK }, (_, i) => i);

    return (
        <div className="flex items-center justify-center gap-2">
            {cycles.map((cycle) => (
                <div
                    key={cycle}
                    className={`w-2 h-2 rounded-full transition-colors ${cycle < (completedCycles % POMODORO_CYCLES_FOR_LONG_BREAK)
                        ? 'bg-primary'
                        : 'bg-muted'
                        }`}
                />
            ))}
        </div>
    );
}