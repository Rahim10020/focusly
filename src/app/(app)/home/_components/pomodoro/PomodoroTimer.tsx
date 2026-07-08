"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePomodoro } from "@/hooks/usePomodoro";
import { useSettings } from "@/hooks/useSettings";
import { useSound } from "@/hooks/useSound";
import { useNotificationsContext } from "@/components/providers/NotificationsProvider";
import { DateTimeService } from "@/lib/domain/services/DateTimeService";
import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls";
import ProgressRing from "./ProgressRing";
import SessionIndicator from "./SessionIndicator";
import TaskSelectionModal from "./TaskSelectionModal";
import type { PomodoroSession } from "@/types";
import { Task } from "@/types";

/**
 * Props for the PomodoroTimer component.
 */
interface PomodoroTimerProps {
  activeTaskId: string | null;
  tasks: Task[];
  onSelectTask: (taskId: string | null) => void;
  onSessionComplete: (session: PomodoroSession) => void;
  onPomodoroComplete: (taskId: string) => void;
  onTimerRefReady: (ref: {
    start: () => void;
    pause: () => void;
    reset: () => void;
    skip: () => void;
    status: "idle" | "running" | "paused";
  }) => void;
}

/**
 * Main Pomodoro timer component that orchestrates the complete timer experience.
 * Combines timer display, controls, progress visualization, and task selection.
 * Handles sound effects, browser notifications, and session tracking.
 */
export default function PomodoroTimer({
  activeTaskId,
  tasks,
  onSelectTask,
  onSessionComplete,
  onPomodoroComplete,
  onTimerRefReady,
}: PomodoroTimerProps) {
  const [isTaskSelectionOpen, setIsTaskSelectionOpen] = useState(false);
  const pendingStartTaskIdRef = useRef<string | null>(null);

  const { settings } = useSettings();
  const { playWorkStart, playWorkPause, playWorkComplete, playBreakComplete } =
    useSound();
  const { showNotification, permission, requestPermission } =
    useNotificationsContext();

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks],
  );
  const hasValidActiveTask = useMemo(
    () => activeTasks.some((task) => task.id === activeTaskId),
    [activeTasks, activeTaskId],
  );
  const pomodoroSettings = useMemo(
    () => ({
      ...settings,
      autoStartPomodoros: settings.autoStartPomodoros && hasValidActiveTask,
    }),
    [settings, hasValidActiveTask],
  );

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
    settings: pomodoroSettings,
    activeTaskId,
    onSessionComplete,
    onWorkComplete: () => {
      playWorkComplete();
      showNotification("Work session completed! 🎉", {
        body: "Time for a break. Great job!",
      });

      // Incrémenter le pomodoro de la tâche active
      if (activeTaskId) {
        onPomodoroComplete(activeTaskId);
      }
    },
    onBreakComplete: () => {
      playBreakComplete();
      showNotification("Break time over! ⏰", {
        body: "Ready to focus again?",
      });
    },
  });

  const startWithFeedback = useCallback(() => {
    // Ask for notifications permission when starting for the first time.
    if (permission === "default") {
      requestPermission();
    }
    playWorkStart();
    start();
  }, [permission, playWorkStart, requestPermission, start]);

  const handleStart = useCallback(() => {
    if (status === "idle" && sessionType === "work" && !hasValidActiveTask) {
      setIsTaskSelectionOpen(true);
      return;
    }

    startWithFeedback();
  }, [hasValidActiveTask, sessionType, startWithFeedback, status]);

  const handleTaskSelectionClose = useCallback(() => {
    pendingStartTaskIdRef.current = null;
    setIsTaskSelectionOpen(false);
  }, []);

  const handleTaskSelected = useCallback(
    (taskId: string) => {
      pendingStartTaskIdRef.current = taskId;
      onSelectTask(taskId);
      setIsTaskSelectionOpen(false);
    },
    [onSelectTask],
  );

  useEffect(() => {
    const pendingTaskId = pendingStartTaskIdRef.current;

    if (!pendingTaskId) {
      return;
    }

    if (activeTaskId !== pendingTaskId) {
      return;
    }

    if (status !== "idle" || sessionType !== "work" || !hasValidActiveTask) {
      return;
    }

    pendingStartTaskIdRef.current = null;
    startWithFeedback();
  }, [
    activeTaskId,
    hasValidActiveTask,
    sessionType,
    startWithFeedback,
    status,
  ]);

  // Expose timer controls to parent via ref
  useEffect(() => {
    onTimerRefReady({
      start: handleStart,
      pause,
      reset,
      skip,
      status,
    });
  }, [handleStart, pause, reset, skip, status, onTimerRefReady]);

  const getTotalTime = () => {
    if (sessionType === "work") return settings.workDuration;
    const isLongBreak = completedCycles % settings.cyclesBeforeLongBreak === 0;
    return isLongBreak
      ? settings.longBreakDuration
      : settings.shortBreakDuration;
  };

  const progress = DateTimeService.getProgress(timeLeft, getTotalTime());

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="relative flex items-center justify-center">
        <ProgressRing
          progress={progress}
          size={260}
          strokeWidth={12}
          isActive={status === "running"}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <TimerDisplay timeLeft={timeLeft} sessionType={sessionType} />
        </div>
      </div>

      <SessionIndicator
        completedCycles={completedCycles}
        cyclesBeforeLongBreak={settings.cyclesBeforeLongBreak}
      />

      {activeTask && status !== "idle" && (
        <div className="text-center px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
          <span className="text-sm text-primary font-medium">
            🍅 {activeTask.title}
          </span>
        </div>
      )}

      <TimerControls
        status={status}
        onStart={handleStart}
        onPause={() => {
          playWorkPause();
          pause();
        }}
        onReset={reset}
        onSkip={skip}
      />

      {isTaskSelectionOpen && (
        <TaskSelectionModal
          isOpen={isTaskSelectionOpen}
          tasks={tasks}
          activeTaskId={hasValidActiveTask ? activeTaskId : null}
          onClose={handleTaskSelectionClose}
          onSelectTask={handleTaskSelected}
        />
      )}
    </div>
  );
}
