export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function getProgress(timeLeft: number, totalTime: number): number {
    return ((totalTime - timeLeft) / totalTime) * 100;
}