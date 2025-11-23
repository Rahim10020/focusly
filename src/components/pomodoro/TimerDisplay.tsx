/**
 * @fileoverview Timer display component that shows the remaining time and current session type.
 * Formats and presents the countdown timer in a readable format.
 */

'use client';

import { formatTime } from '@/lib/utils/time';

/**
 * Props for the TimerDisplay component.
 * @interface TimerDisplayProps
 * @property {number} timeLeft - Remaining time in seconds
 * @property {'work' | 'break'} sessionType - Current session type (work or break)
 */
interface TimerDisplayProps {
    timeLeft: number;
    sessionType: 'work' | 'break';
}

/**
 * Displays the current timer countdown and session type indicator.
 * Shows formatted time (MM:SS) and a label indicating whether it's focus or break time.
 *
 * @param {TimerDisplayProps} props - Component props
 * @returns {JSX.Element} The rendered timer display
 *
 * @example
 * <TimerDisplay timeLeft={1500} sessionType="work" />
 *
 * @example
 * <TimerDisplay timeLeft={300} sessionType="break" />
 */
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