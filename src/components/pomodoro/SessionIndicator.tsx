'use client';

interface SessionIndicatorProps {
    completedCycles: number;
    cyclesBeforeLongBreak: number;
}

export default function SessionIndicator({
    completedCycles,
    cyclesBeforeLongBreak
}: SessionIndicatorProps) {
    const cycles = Array.from({ length: cyclesBeforeLongBreak }, (_, i) => i);

    return (
        <div className="flex items-center justify-center gap-2">
            {cycles.map((cycle) => (
                <div
                    key={cycle}
                    className={`w-2 h-2 rounded-full transition-colors ${cycle < (completedCycles % cyclesBeforeLongBreak)
                        ? 'bg-primary'
                        : 'bg-muted'
                        }`}
                />
            ))}
        </div>
    );
}