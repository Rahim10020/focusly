/**
 * @fileoverview Reusable statistics card component for displaying
 * individual metrics with optional icons and subtitles.
 */

'use client';

/**
 * Props for the StatsCard component.
 * @interface StatsCardProps
 */
interface StatsCardProps {
    /** The title/label for the statistic */
    title: string;
    /** The main value to display (can be string or number) */
    value: string | number;
    /** Optional subtitle or additional context */
    subtitle?: string;
    /** Optional icon to display in the card header */
    icon?: React.ReactNode;
}

/**
 * A reusable card component for displaying a single statistic.
 * Features a title, prominent value display, optional subtitle,
 * and optional icon in a styled card container.
 *
 * @param {StatsCardProps} props - Component props
 * @param {string} props.title - The label for the statistic
 * @param {string | number} props.value - The main value to display
 * @param {string} [props.subtitle] - Optional additional context
 * @param {React.ReactNode} [props.icon] - Optional icon element
 * @returns {JSX.Element} A styled card displaying the statistic
 *
 * @example
 * ```tsx
 * import StatsCard from '@/components/stats/StatsCard';
 *
 * function Dashboard() {
 *   return (
 *     <StatsCard
 *       title="Total Sessions"
 *       value={42}
 *       subtitle="This month"
 *       icon={<ClockIcon />}
 *     />
 *   );
 * }
 * ```
 */
export default function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-6 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
    );
}