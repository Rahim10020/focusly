/**
 * @fileoverview Task meta information component (created/completed/pomodoro info)
 */

interface TaskMetaInfoProps {
  createdAt: number;
  completedAt?: number;
  pomodoroCount: number;
}

export function TaskMetaInfo({ createdAt, completedAt, pomodoroCount }: TaskMetaInfoProps) {
  return (
    <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
      <p>Created: {new Date(createdAt).toLocaleString()}</p>
      {completedAt && <p>Completed: {new Date(completedAt).toLocaleString()}</p>}
      {pomodoroCount > 0 && <p>🍅 {pomodoroCount} pomodoro{pomodoroCount > 1 ? 's' : ''} completed</p>}
    </div>
  );
}
