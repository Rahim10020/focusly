/**
 * @fileoverview Audio management hook for timer sounds.
 * Handles loading and playing audio feedback for timer events
 * including work start, pause, completion, and break sounds.
 */

import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * Creates a simple beep sound using Web Audio API.
 * Used for break completion and tick sounds.
 *
 * @param {number} frequency - Sound frequency in Hz (default: 800)
 * @param {number} duration - Sound duration in milliseconds (default: 200)
 */
const createBeepSound = (frequency: number = 800, duration: number = 200) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
};

/**
 * Hook for managing timer audio feedback.
 * Provides sound effects for timer events with enable/disable toggle.
 * Preloads WAV files and uses Web Audio API for generated sounds.
 *
 * @returns {Object} Sound state and playback functions
 * @returns {boolean} returns.soundEnabled - Whether sounds are enabled
 * @returns {Function} returns.toggleSound - Toggle sounds on/off
 * @returns {Function} returns.playWorkStart - Play work session start sound
 * @returns {Function} returns.playWorkPause - Play work pause sound
 * @returns {Function} returns.playWorkComplete - Play work completion sound
 * @returns {Function} returns.playBreakComplete - Play break completion sound
 * @returns {Function} returns.playTick - Play tick sound
 *
 * @example
 * const { soundEnabled, toggleSound, playWorkComplete } = useSound();
 *
 * // Toggle sound on/off
 * <button onClick={toggleSound}>
 *   {soundEnabled ? 'Mute' : 'Unmute'}
 * </button>
 *
 * // Play sound when work session completes
 * const handleWorkComplete = () => {
 *   playWorkComplete();
 *   showNotification('Work session complete!');
 * };
 */
export function useSound() {
    const [soundEnabled, setSoundEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('focusly_sound_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Précharger les fichiers audio WAV
    const workStartAudioRef = useRef<HTMLAudioElement | null>(null);
    const workPauseAudioRef = useRef<HTMLAudioElement | null>(null);
    const workEndAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Précharger les sons
        workStartAudioRef.current = new Audio('/sounds/work-start.wav');
        workPauseAudioRef.current = new Audio('/sounds/work-pause.wav');
        workEndAudioRef.current = new Audio('/sounds/work-end.wav');
    }, []);

    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => {
            const newValue = !prev;
            localStorage.setItem('focusly_sound_enabled', JSON.stringify(newValue));
            return newValue;
        });
    }, []);

    const playWorkStart = useCallback(() => {
        if (!soundEnabled || !workStartAudioRef.current) return;
        try {
            workStartAudioRef.current.currentTime = 0;
            workStartAudioRef.current.play();
        } catch (error) {
            console.error('Error playing work start sound:', error);
        }
    }, [soundEnabled]);

    const playWorkPause = useCallback(() => {
        if (!soundEnabled || !workPauseAudioRef.current) return;
        try {
            workPauseAudioRef.current.currentTime = 0;
            workPauseAudioRef.current.play();
        } catch (error) {
            console.error('Error playing work pause sound:', error);
        }
    }, [soundEnabled]);

    const playWorkComplete = useCallback(() => {
        if (!soundEnabled || !workEndAudioRef.current) return;
        try {
            workEndAudioRef.current.currentTime = 0;
            workEndAudioRef.current.play();
        } catch (error) {
            console.error('Error playing work end sound:', error);
        }
    }, [soundEnabled]);

    const playBreakComplete = useCallback(() => {
        if (!soundEnabled) return;

        try {
            // Mélodie de fin de pause (2 notes)
            createBeepSound(659.25, 150); // Mi
            setTimeout(() => createBeepSound(523.25, 300), 200); // Do
        } catch (error) {
            console.error('Error playing break sound:', error);
        }
    }, [soundEnabled]);

    const playTick = useCallback(() => {
        if (!soundEnabled) return;

        try {
            createBeepSound(1000, 50);
        } catch (error) {
            console.error('Error playing tick sound:', error);
        }
    }, [soundEnabled]);

    return {
        soundEnabled,
        toggleSound,
        playWorkStart,
        playWorkPause,
        playWorkComplete,
        playBreakComplete,
        playTick,
    };
}