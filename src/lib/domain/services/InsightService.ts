import { startOfWeek, endOfWeek } from "date-fns";

export interface Insight {
  type: "positive" | "warning" | "info" | "achievement";
  title: string;
  message: string;
  icon: string;
  suggestion?: string;
}

interface Stats {
  totalFocusTime: number;
  totalTasks: number;
  completedTasks: number;
  totalSessions: number;
  streak: number;
  longestStreak?: number;
}

interface Session {
  started_at: string;
  duration: number;
}

interface Task {
  id: string;
  status: string;
  sub_domain?: string;
  completed_at?: string;
}

const getWeekFocusTime = (sessions: Session[], weeksAgo: number): number => {
  const now = new Date();
  const targetWeekStart = new Date(now);
  targetWeekStart.setDate(now.getDate() - weeksAgo * 7);

  const weekStart = startOfWeek(targetWeekStart);
  const weekEnd = endOfWeek(targetWeekStart);

  return sessions
    .filter((s) => {
      const sessionDate = new Date(s.started_at);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    })
    .reduce((sum, s) => sum + s.duration, 0);
};

const analyzeProductivityByHour = (sessions: Session[]) => {
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    focusTime: 0,
    sessions: 0,
  }));

  sessions.forEach((session) => {
    const hour = new Date(session.started_at).getHours();
    hourlyData[hour].focusTime += session.duration;
    hourlyData[hour].sessions += 1;
  });

  return hourlyData;
};

const analyzeDomainDistribution = (tasks: Task[]) => {
  const domains = tasks.reduce(
    (acc, task) => {
      const domain = task.sub_domain || "Sans domaine";
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = tasks.length;
  return Object.entries(domains).map(([name, count]) => ({
    name,
    count,
    percentage: (count / total) * 100,
  }));
};

export const generateDynamicInsights = (
  stats: Stats,
  sessions: Session[],
  tasks: Task[],
): Insight[] => {
  const insights: Insight[] = [];

  // Insight 1: Tendance de productivité
  const thisWeekFocus = getWeekFocusTime(sessions, 0);
  const lastWeekFocus = getWeekFocusTime(sessions, 1);

  if (lastWeekFocus > 0) {
    const percentChange =
      ((thisWeekFocus - lastWeekFocus) / lastWeekFocus) * 100;

    if (percentChange > 10) {
      insights.push({
        type: "positive",
        title: "Excellent progress!",
        message: `Your focus time increased by ${percentChange.toFixed(1)}% this week`,
        icon: "📈",
      });
    } else if (percentChange < -10) {
      insights.push({
        type: "warning",
        title: "Warning",
        message: `Your focus time decreased by ${Math.abs(percentChange).toFixed(1)}% this week`,
        icon: "⚠️",
        suggestion: "Try scheduling more regular sessions",
      });
    }
  }

  // Insight 2: Meilleur moment de productivité
  if (sessions.length > 0) {
    const hourlyProductivity = analyzeProductivityByHour(sessions);
    const bestHour = hourlyProductivity.reduce((max, curr) =>
      curr.focusTime > max.focusTime ? curr : max,
    );

    if (bestHour.focusTime > 0) {
      insights.push({
        type: "info",
        title: "Your productivity peak",
        message: `You're most productive around ${bestHour.hour}:00`,
        icon: "⏰",
        suggestion: "Schedule your important tasks at this time",
      });
    }
  }

  // Insight 3: Streak analysis
  if (stats.streak >= 7) {
    insights.push({
      type: "achievement",
      title: "Impressive streak!",
      message: `${stats.streak} consecutive days! Keep going!`,
      icon: "🔥",
    });
  } else if (
    stats.streak === 0 &&
    stats.longestStreak &&
    stats.longestStreak > 0
  ) {
    insights.push({
      type: "warning",
      title: "Streak lost",
      message: `Your longest streak was ${stats.longestStreak} days`,
      icon: "💔",
      suggestion: "Start a new streak today!",
    });
  }

  // Insight 4: Domaine négligé
  if (tasks.length > 0) {
    const domainStats = analyzeDomainDistribution(tasks);
    const neglectedDomain = domainStats.find(
      (d) => d.percentage < 10 && d.count > 0,
    );

    if (neglectedDomain && domainStats.length > 1) {
      insights.push({
        type: "info",
        title: "Neglected domain",
        message: `Only ${neglectedDomain.percentage.toFixed(1)}% of your tasks are in ${neglectedDomain.name}`,
        icon: "⚖️",
        suggestion: "Consider balancing your life domains",
      });
    }
  }

  // Insight 5: Taux de complétion
  if (stats.totalTasks > 0) {
    const completionRate = (stats.completedTasks / stats.totalTasks) * 100;

    if (completionRate > 80) {
      insights.push({
        type: "positive",
        title: "Excellent completion rate",
        message: `You complete ${completionRate.toFixed(1)}% of your tasks`,
        icon: "🎯",
      });
    } else if (completionRate < 50) {
      insights.push({
        type: "warning",
        title: "Low completion rate",
        message: `Only ${completionRate.toFixed(1)}% of your tasks are completed`,
        icon: "📉",
        suggestion: "Set more realistic goals or reduce the number of tasks",
      });
    }
  }

  return insights;
};
