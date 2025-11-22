/**
 * @fileoverview Achievement notification popup component.
 * Displays a celebratory notification when a user unlocks an achievement.
 */

'use client';

import { useEffect, useState } from 'react';
import { Achievement } from '@/types';

/**
 * Props for the AchievementNotification component.
 * @interface AchievementNotificationProps
 * @property {Achievement} achievement - The achievement that was unlocked
 * @property {() => void} onClose - Callback function when notification is closed
 */
interface AchievementNotificationProps {
    achievement: Achievement;
    onClose: () => void;
}

/**
 * Achievement notification component that displays a popup when a user unlocks an achievement.
 * Features animated entry/exit transitions and auto-closes after 5 seconds.
 *
 * @param {AchievementNotificationProps} props - Component props
 * @param {Achievement} props.achievement - The unlocked achievement to display
 * @param {() => void} props.onClose - Callback when the notification closes
 * @returns {JSX.Element} The achievement notification popup
 *
 * @example
 * function App() {
 *   const [achievement, setAchievement] = useState(null);
 *
 *   return (
 *     <>
 *       {achievement && (
 *         <AchievementNotification
 *           achievement={achievement}
 *           onClose={() => setAchievement(null)}
 *         />
 *       )}
 *     </>
 *   );
 * }
 */
export default function AchievementNotification({
    achievement,
    onClose
}: AchievementNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in
        setTimeout(() => setIsVisible(true), 100);

        // Auto close after 5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={`fixed top-20 right-6 z-50 transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
        >
            <div className="bg-card border-2 border-primary rounded-2xl shadow-2xl p-6 max-w-sm">
                <div className="flex items-start gap-4">
                    <div className="text-5xl">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                                Achievement Unlocked!
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">
                            {achievement.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {achievement.description}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 300);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}