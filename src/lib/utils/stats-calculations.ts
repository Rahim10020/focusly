import { DOMAINS, getDomainFromSubDomain, Task } from "@/types";

export interface TaskCompletionStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  activeTasks: number;
}

export interface DomainDistributionItem {
  domain: string;
  count: number;
  completed: number;
}

export function getTaskCompletionStats(tasks: Task[]): TaskCompletionStats {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    completionRate,
    activeTasks: totalTasks - completedTasks,
  };
}

export function getDomainDistribution(tasks: Task[]): DomainDistributionItem[] {
  return Object.keys(DOMAINS).map((domainKey) => {
    const domainTasks = tasks.filter((task) => {
      if (!task.subDomain) return false;

      try {
        return getDomainFromSubDomain(task.subDomain) === domainKey;
      } catch {
        return false;
      }
    });

    return {
      domain: DOMAINS[domainKey as keyof typeof DOMAINS].name,
      count: domainTasks.length,
      completed: domainTasks.filter((task) => task.completed).length,
    };
  });
}

export function formatHoursMinutesFromSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function getFocusHours(totalFocusTime: number | undefined): number {
  return Math.round((totalFocusTime || 0) / 3600);
}
