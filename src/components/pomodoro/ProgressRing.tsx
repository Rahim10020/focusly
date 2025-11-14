'use client';

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    isActive?: boolean;
}

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
    const gradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`;

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