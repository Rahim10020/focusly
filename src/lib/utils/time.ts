export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function getProgress(timeLeft: number, totalTime: number): number {
    return ((totalTime - timeLeft) / totalTime) * 100;
}

export function isToday(timestamp: number): boolean {
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

export function isTomorrow(timestamp: number): boolean {
    const date = new Date(timestamp);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
}

export function isPast(timestamp: number): boolean {
    return timestamp < Date.now();
}