/**
 * @fileoverview Analytics Dashboard page for the Focusly application.
 * Displays comprehensive productivity analytics, charts, and export functionality
 * for tasks, sessions, and domain progress data.
 * @module app/dashboard/page
 */

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useAuth";
import dynamic from "next/dynamic";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useTasks } from "@/hooks/useTasks";
import { useStats } from "@/hooks/useStats";
import {
  exportTasksToPDF,
  exportTasksToCSV,
  exportAnalyticsToCSV,
} from "@/lib/utils/exportUtils";
import { exportTasksToICS } from "@/lib/utils/calendarIntegration";
import { generateDynamicInsights } from "@/lib/domain/services/InsightService";
import { exportCustomAnalyticsToPDF } from "@/lib/domain/services/PDFExportService";
import DynamicInsights from "@/app/(app)/stats/_components/DynamicInsights";
import ProductivityHeatmap from "@/app/(app)/stats/_components/ProductivityHeatmap";

// Lazy load modals and heavy components
const ExportPDFModal = dynamic(
  () => import("@/app/(app)/dashboard/_components/ExportPDFModal"),
  { ssr: false },
);

import type { ExportOptions } from "@/app/(app)/dashboard/_components/ExportPDFModal";
import { MyLoader } from "@/components/shared/MyLoader";
import { ROUTES } from "@/constants";
import { getTaskCompletionStats } from "@/lib/domain/services/StatsCalculationService";
import {
  CalendarIcon,
  CheckboxCheckIcon,
  CircleIcon,
  ClockIcon,
  DownloadIcon,
  FileDocumentIcon,
  ListUnorderedIcon,
} from "@/components/shared/icons";

// Lazy load heavy chart components
const AdvancedProductivityChart = dynamic(
  () => import("@/app/(app)/stats/_components/AdvancedProductivityChart"),
  {
    ssr: false,
    loading: () => <MyLoader label="Loading" />,
  },
);

const DomainEvolutionChart = dynamic(
  () => import("@/app/(app)/stats/_components/DomainEvolutionChart"),
  {
    ssr: false,
    loading: () => <MyLoader label="Loading" />,
  },
);

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { tasks } = useTasks();
  const { sessions, stats } = useStats();
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const [showExportModal, setShowExportModal] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(ROUTES.SIGN_IN);
    }
  }, [status, router]);

  // Generate dynamic insights
  const dynamicInsights = useMemo(() => {
    if (!stats || !sessions || !tasks) return [];
    // Transform sessions to match the expected Session interface
    const transformedSessions = sessions.map((session) => ({
      started_at: new Date(session.startedAt).toISOString(),
      duration: session.duration,
    }));
    // Transform tasks to match the expected Task interface
    const transformedTasks = tasks.map((task) => ({
      id: task.id,
      status: task.status || "todo",
      sub_domain: task.subDomain,
      completed_at: task.completedAt
        ? new Date(task.completedAt).toISOString()
        : undefined,
    }));
    return generateDynamicInsights(
      stats,
      transformedSessions,
      transformedTasks,
    );
  }, [stats, sessions, tasks]);

  // Handle custom PDF export
  const handleCustomPDFExport = async (options: ExportOptions) => {
    if (!stats || !tasks || !sessions) return;

    // Transform sessions to match the expected Session interface
    const transformedSessions = sessions.map((session) => ({
      started_at: new Date(session.startedAt).toISOString(),
      duration: session.duration,
    }));

    // Transform tasks to match the expected Task interface
    const transformedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status || "todo",
      completed_at: task.completedAt
        ? new Date(task.completedAt).toISOString()
        : undefined,
      created_at: new Date(task.createdAt).toISOString(),
    }));

    await exportCustomAnalyticsToPDF(
      stats,
      transformedTasks,
      transformedSessions,
      session?.user?.name || "User",
      options,
      dynamicInsights,
      chartRef.current,
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Loading" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const { completedTasks, totalTasks, completionRate } =
    getTaskCompletionStats(tasks);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your productivity and progress
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Tasks
                </p>
                <p className="text-3xl font-bold">{totalTasks}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ListUnorderedIcon className="text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold">{completedTasks}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckboxCheckIcon className="text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold">{completionRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ClockIcon className="text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Current Streak
                </p>
                <p className="text-3xl font-bold">{stats?.streak || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                {/* A remplacer apres avoir trouve une bonne icone */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground"
                >
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-6">
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={timeRange === 7 ? "primary" : "ghost"}
            onClick={() => setTimeRange(7)}
            className="text-sm"
          >
            Last 7 Days
          </Button>
          <Button
            variant={timeRange === 30 ? "primary" : "ghost"}
            onClick={() => setTimeRange(30)}
            className="text-sm"
          >
            Last 30 Days
          </Button>
        </div>
      </div>

      {/* Dynamic Insights */}
      <div className="mb-8">
        <DynamicInsights insights={dynamicInsights} />
      </div>

      {/* Productivity Charts */}
      <div className="mb-8" ref={chartRef}>
        <h2 className="text-2xl font-bold mb-4">Productivity Trends</h2>
        <AdvancedProductivityChart sessions={sessions} days={timeRange} />
      </div>

      {/* Productivity Heatmap */}
      <div className="mb-20">
        <ProductivityHeatmap
          sessions={sessions.map((session) => ({
            started_at: new Date(session.startedAt).toISOString(),
            duration: session.duration,
          }))}
        />
      </div>

      {/* Domain Evolution */}
      <div className="mb-10 mt-12">
        <h2 className="text-2xl tracking-wide font-bold mb-8">
          Life Domains Progress
        </h2>
        <DomainEvolutionChart tasks={tasks} />
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-2 mb-4 mt-20">
        <Button
          variant="outline"
          onClick={() => exportTasksToCSV(tasks)}
          size="sm"
        >
          <DownloadIcon size={16} />
          Export Tasks (CSV)
        </Button>
        <Button
          variant="outline"
          onClick={() => exportTasksToPDF(tasks, session?.user?.name || "User")}
          size="sm"
        >
          <FileDocumentIcon size={16} />
          Export Tasks (PDF)
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            exportAnalyticsToCSV(
              stats || {
                totalFocusTime: 0,
                totalTasks,
                completedTasks,
                totalSessions: 0,
                streak: 0,
              },
              tasks,
              sessions,
            )
          }
          size="sm"
        >
          <CircleIcon size={16} />
          Analytics (CSV)
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowExportModal(true)}
          size="sm"
        >
          <CircleIcon size={16} />
          Analytics (PDF Custom)
        </Button>
        <Button
          variant="outline"
          onClick={() => exportTasksToICS(tasks)}
          size="sm"
        >
          <CalendarIcon size={16} />
          Export Calendar (iCal)
        </Button>
      </div>

      {/* Export PDF Modal */}
      <ExportPDFModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleCustomPDFExport}
      />
    </div>
  );
}
