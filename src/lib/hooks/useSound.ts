import { useCallback, useRef, useState, useEffect } from 'react';

// Fonction pour générer un son de notification simple (pour les pauses)
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

    // Précharger les fichiers audio WAV
    const workStartAudioRef = useRef<HTMLAudioElement | null>(null);
    const workPauseAudioRef = useRef<HTMLAudioElement | null>(null);
    const workEndAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('focusly_sound_enabled');
        if (saved !== null) {
            setSoundEnabled(JSON.parse(saved));
        }

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