import { useCallback, useRef, useState, useEffect } from 'react';

// Fonction pour générer un son de notification simple
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

export function useSound() {
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('focusly_sound_enabled');
        if (saved !== null) {
            setSoundEnabled(JSON.parse(saved));
        }
    }, []);

    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => {
            const newValue = !prev;
            localStorage.setItem('focusly_sound_enabled', JSON.stringify(newValue));
            return newValue;
        });
    }, []);

    const playWorkComplete = useCallback(() => {
        if (!soundEnabled) return;

        try {
            // Mélodie de fin de session (3 notes ascendantes)
            createBeepSound(523.25, 150); // Do
            setTimeout(() => createBeepSound(659.25, 150), 200); // Mi
            setTimeout(() => createBeepSound(783.99, 300), 400); // Sol
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }, [soundEnabled]);

    const playBreakComplete = useCallback(() => {
        if (!soundEnabled) return;

        try {
            // Mélodie de fin de pause (2 notes)
            createBeepSound(659.25, 150); // Mi
            setTimeout(() => createBeepSound(523.25, 300), 200); // Do
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }, [soundEnabled]);

    const playTick = useCallback(() => {
        if (!soundEnabled) return;

        try {
            createBeepSound(1000, 50);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }, [soundEnabled]);

    return {
        soundEnabled,
        toggleSound,
        playWorkComplete,
        playBreakComplete,
        playTick,
    };
}