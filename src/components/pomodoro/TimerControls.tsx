'use client';

import { TimerStatus } from '@/types';
import Button from '@/components/ui/Button';

interface TimerControlsProps {
    status: TimerStatus;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
    onSkip: () => void;
}

export default function TimerControls({
    status,
    onStart,
    onPause,
    onReset,
    onSkip,
}: TimerControlsProps) {
    return (
        <div className="flex items-center justify-center gap-3">
            {status === 'running' ? (
                <Button onClick={onPause} size="lg" className="min-w-[120px]">
                    Pause
                </Button>
            ) : (
                <Button onClick={onStart} size="lg" className="min-w-[120px]">
                    {status === 'paused' ? 'Resume' : 'Start'}
                </Button>
            )}

            {status !== 'idle' && (
                <>
                    <Button onClick={onReset} variant="secondary" size="lg">
                        Reset
                    </Button>
                    <Button onClick={onSkip} variant="ghost" size="lg">
                        Skip
                    </Button>
                </>
            )}
        </div>
    );
}