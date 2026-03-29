/**
 * @fileoverview Session indicator component that displays progress toward a long break.
 * Shows visual dots representing completed work cycles in the current set.
 */

'use client';

/**
 * Props for the SessionIndicator component.
 * @interface SessionIndicatorProps
 * @property {number} completedCycles - Total number of completed work cycles
 * @property {number} cyclesBeforeLongBreak - Number of cycles required before a long break
 */
interface SessionIndicatorProps {
    completedCycles: number;
    cyclesBeforeLongBreak: number;
}

/**
 * Displays a row of dots indicating progress toward a long break.
 * Filled dots represent completed cycles in the current set, empty dots show remaining.
 * Resets visually after each long break is taken.
 *
 * @param {SessionIndicatorProps} props - Component props
 * @returns {JSX.Element} The rendered session indicator dots
 *
 * @example
 * // Shows 2 filled dots out of 4 (2 cycles completed, 2 remaining until long break)
 * <SessionIndicator completedCycles={2} cyclesBeforeLongBreak={4} />
 *
 * @example
 * // After 5 cycles with 4-cycle sets, shows 1 filled dot (5 % 4 = 1)
 * <SessionIndicator completedCycles={5} cyclesBeforeLongBreak={4} />
 */
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