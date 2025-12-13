/**
 * @fileoverview SVG circular progress indicator component for visualizing timer progress.
 * Features gradient colors, glow effects, and milestone animations.
 */

'use client';

import { useId } from 'react';

/**
 * Props for the ProgressRing component.
 * @interface ProgressRingProps
 * @property {number} progress - Current progress percentage (0-100)
 * @property {number} [size=200] - Diameter of the ring in pixels
 * @property {number} [strokeWidth=8] - Width of the ring stroke in pixels
 * @property {boolean} [isActive=false] - Whether the timer is actively running (enables glow effects)
 */
interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    isActive?: boolean;
}

/**
 * Renders a circular SVG progress indicator with gradient colors and visual effects.
 * Includes a background track, progress arc with gradient, glow effects when active,
 * and pulse animations at milestone percentages (25%, 50%, 75%).
 *
 * @param {ProgressRingProps} props - Component props
 * @returns {JSX.Element} The rendered progress ring SVG
 *
 * @example
 * // Basic usage
 * <ProgressRing progress={75} />
 *
 * @example
 * // Full customization with active state
 * <ProgressRing
 *   progress={50}
 *   size={260}
 *   strokeWidth={12}
 *   isActive={true}
 * />
 */
export default function ProgressRing({
    progress,
    size = 200,
    strokeWidth = 8,
    isActive = false
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    // Gradient ID unique pour éviter les conflits
    const uniqueId = useId();
    const gradientId = `progress-gradient-${uniqueId}`;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90 filter drop-shadow-lg"
            >
                {/* Définition du gradient */}
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="50%" stopColor="var(--brand-secondary)" />
                        <stop offset="100%" stopColor="var(--brand-accent)" />
                    </linearGradient>

                    {/* Filtre pour le glow effect */}
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="var(--muted)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    opacity="0.3"
                />

                {/* Progress circle avec gradient */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`transition-all duration-500 ease-out ${isActive ? 'animate-pulse-soft' : ''}`}
                    filter={isActive ? 'url(#glow)' : undefined}
                    style={{
                        transformOrigin: 'center',
                    }}
                />

                {/* Glow circle additionnelle quand actif */}
                {isActive && (
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth / 2}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="opacity-40 animate-pulse-soft"
                        style={{
                            filter: 'blur(8px)',
                        }}
                    />
                )}
            </svg>

            {/* Pulse ring animation pour les jalons (25%, 50%, 75%) */}
            {isActive && (progress === 25 || progress === 50 || progress === 75) && (
                <div
                    className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping"
                    style={{
                        width: size,
                        height: size,
                        animationDuration: '1.5s',
                        animationIterationCount: '3'
                    }}
                />
            )}
        </div>
    );
}