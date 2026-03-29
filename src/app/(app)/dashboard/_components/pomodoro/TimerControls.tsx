/**
 * @fileoverview Timer control buttons component providing play, pause, reset, and skip functionality.
 * Adapts button display based on current timer status.
 */

'use client';

import { TimerStatus } from '@/types';
import Button from '@/components/ui/Button';

/**
 * Props for the TimerControls component.
 * @interface TimerControlsProps
 * @property {TimerStatus} status - Current timer status ('idle' | 'running' | 'paused')
 * @property {function} onStart - Callback to start or resume the timer
 * @property {function} onPause - Callback to pause the timer
 * @property {function} onReset - Callback to reset the timer to initial state
 * @property {function} onSkip - Callback to skip the current session
 */
interface TimerControlsProps {
    status: TimerStatus;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
    onSkip: () => void;
}

/**
 * Renders timer control buttons that adapt based on the current timer status.
 * Shows Start/Resume/Pause as the primary action, with Reset and Skip available when timer is active.
 *
 * @param {TimerControlsProps} props - Component props
 * @returns {JSX.Element} The rendered timer control buttons
 *
 * @example
 * <TimerControls
 *   status="idle"
 *   onStart={() => startTimer()}
 *   onPause={() => pauseTimer()}
 *   onReset={() => resetTimer()}
 *   onSkip={() => skipSession()}
 * />
 */
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