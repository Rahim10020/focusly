/**
 * @fileoverview Notification sounds utility for playing audio notifications.
 * Provides functions to play different notification sounds based on type.
 * @module lib/utils/notificationSounds
 */

/**
 * Available notification sound types
 */
export type NotificationSoundType = 'achievement' | 'task' | 'friend' | 'default';

/**
 * Sound file paths for different notification types
 */
const NOTIFICATION_SOUNDS: Record<NotificationSoundType, string> = {
    achievement: '/sounds/achievement.mp3',
    task: '/sounds/task.mp3',
    friend: '/sounds/friend.mp3',
    default: '/sounds/notification.mp3',
};

/**
 * Plays a notification sound based on the specified type.
 * Creates an Audio element and plays it with error handling.
 * Volume is set to 0.5 by default to avoid being too loud.
 *
 * @param {NotificationSoundType} type - The type of notification sound to play
 * @returns {Promise<void>} Promise that resolves when sound starts playing
 *
 * @example
 * // Play achievement sound
 * playNotificationSound('achievement');
 *
 * @example
 * // Play default notification sound
 * playNotificationSound('default');
 */
export async function playNotificationSound(type: NotificationSoundType = 'default'): Promise<void> {
    try {
        const soundPath = NOTIFICATION_SOUNDS[type];
        const audio = new Audio(soundPath);
        audio.volume = 0.5; // Set to 50% volume

        await audio.play();
    } catch (error) {
        console.error('Error playing notification sound:', error);
        // Fallback to silent if sound fails
    }
}

/**
 * Checks if the browser supports playing audio notifications
 * @returns {boolean} True if audio is supported
 */
export function isAudioSupported(): boolean {
    return typeof Audio !== 'undefined';
}

/**
 * Preloads all notification sounds to reduce latency when playing
 * @returns {Promise<void>} Promise that resolves when all sounds are preloaded
 */
export async function preloadNotificationSounds(): Promise<void> {
    if (!isAudioSupported()) return;

    const preloadPromises = Object.values(NOTIFICATION_SOUNDS).map(soundPath => {
        return new Promise<void>((resolve) => {
            const audio = new Audio(soundPath);
            audio.addEventListener('canplaythrough', () => resolve(), { once: true });
            audio.addEventListener('error', () => resolve(), { once: true }); // Resolve even on error
            audio.load();
        });
    });

    await Promise.all(preloadPromises);
}
