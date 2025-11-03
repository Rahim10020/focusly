'use client';

import { usePomodoro } from '@/lib/hooks/usePomodoro';
import { useStats } from '@/lib/hooks/useStats';
import { getProgress } from '@/lib/utils/time';
import { POMODORO_DURATION, SHORT_BREAK, LONG_BREAK, POMODORO_CYCLES_FOR_LONG_BREAK } from '@/lib/constants';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import ProgressRing from './ProgressRing';
import SessionIndicator from './SessionIndicator';

export default function PomodoroTimer() {
    const { addSession } = useStats();

    const {
        timeLeft,
        status,
        sessionType,
        completedCycles,
        start,
        pause,
        reset,
        skip,
    } = usePomodoro({
        onSessionComplete: (session) => {
            addSession(session);
        },
    });

    const getTotalTime = () => {
        if (sessionType === 'work') return POMODORO_DURATION;
        const isLongBreak = completedCycles % POMODORO_CYCLES_FOR_LONG_BREAK === 0;
        return isLongBreak ? LONG_BREAK : SHORT_BREAK;
    };

    const progress = getProgress(timeLeft, getTotalTime());

    return (
        <div className="flex flex-col items-center space-y-8">
            <div className="relative flex items-center justify-center">
                <ProgressRing progress={progress} size={240} strokeWidth={10} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <TimerDisplay timeLeft={timeLeft} sessionType={sessionType} />
                </div>
            </div>

            <SessionIndicator completedCycles={completedCycles} />

            <TimerControls
                status={status}
                onStart={start}
                onPause={pause}
                onReset={reset}
                onSkip={skip}
            />
        </div>
    );
}