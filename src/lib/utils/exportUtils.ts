/**
 * @fileoverview Export utilities for generating PDF and CSV reports.
 * Provides functions to export tasks and analytics data in various formats.
 * Supports streaming for large PDF exports to handle memory efficiently.
 * @module lib/utils/exportUtils
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Task,
  Stats,
  PomodoroSession,
  DOMAINS,
  getDomainFromSubDomain,
  SubDomain,
} from "@/types";
import { format } from "date-fns";
import {
  getTaskCompletionStats,
  formatHoursMinutesFromSeconds,
} from "../domain/services/StatsCalculationService";

// Import refactored helper modules
import {
  createPDFDocument,
  addTasksTable,
  addDomainStatsTable,
  addSessionsTable,
  addStatsText,
  addSectionTitle,
  downloadPDF,
  generatePDFBlob,
  getTableEndY,
} from "./pdf-helpers";
import { downloadCSV, analyticsToCSVRows } from "./csv-helpers";

// ============================================================================
// Domain Helper
// ============================================================================

/**
 * Gets domain name from subDomain.
 *
 * @param {string} subDomain - SubDomain identifier
 * @returns {string} Domain name
 */
const getDomainName = (subDomain: string): string => {
  try {
    return (
      DOMAINS[
        getDomainFromSubDomain(subDomain as SubDomain) as keyof typeof DOMAINS
      ]?.name
        .split("(")[0]
        .trim() ?? "Unknown"
    );
  } catch {
    return "Unknown";
  }
};

// ============================================================================
// Task Data Transformation
// ============================================================================

/**
 * Transforms task to table row for PDF export.
 *
 * @param {Task} task - Task to transform
 * @returns {string[]} Table row data
 */
const taskToTableRow = (task: Task): string[] => {
  return [
    task.title,
    task.priority || "None",
    task.subDomain ? getDomainName(task.subDomain) : "N/A",
    task.completed ? "Yes" : "No",
    task.startDate ? format(new Date(task.startDate), "MMM d, yyyy") : "N/A",
    task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "N/A",
    task.pomodoroCount.toString(),
  ];
};

/**
 * Transforms task to compact table row for large PDF export.
 *
 * @param {Task} task - Task to transform
 * @returns {string[]} Table row data
 */
const taskToCompactTableRow = (task: Task): string[] => {
  return [
    task.title.length > 40 ? task.title.substring(0, 37) + "..." : task.title,
    task.priority || "None",
    task.subDomain ? getDomainName(task.subDomain) : "N/A",
    task.completed ? "Yes" : "No",
    task.startDate ? format(new Date(task.startDate), "MMM d") : "N/A",
    task.dueDate ? format(new Date(task.dueDate), "MMM d") : "N/A",
    task.pomodoroCount.toString(),
  ];
};

/**
 * Transforms task to CSV row.
 *
 * @param {Task} task - Task to transform
 * @returns {string[]} CSV row data
 */
const taskToCSVRow = (task: Task): string[] => {
  return [
    task.title,
    task.priority || "",
    task.subDomain ? getDomainName(task.subDomain) : "",
    task.completed ? "Yes" : "No",
    task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "",
    task.startTime || "",
    task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
    task.endTime || "",
    task.estimatedDuration?.toString() || "",
    task.pomodoroCount.toString(),
    task.notes || "",
  ];
};

// ============================================================================
// Task Export Functions
// ============================================================================

/**
 * Exports tasks to a formatted PDF document with summary statistics.
 * Includes task details, completion rates, and domain categorization.
 *
 * @param {Task[]} tasks - Array of tasks to export
 * @param {string} [userName='User'] - Name to display on the report
 * @returns {void} Downloads the PDF file
 *
 * @example
 * exportTasksToPDF(tasks, 'John Doe'); // Downloads focusly-tasks-2024-01-15.pdf
 */
export const exportTasksToPDF = (
  tasks: Task[],
  userName: string = "User",
): void => {
  const doc = createPDFDocument("Focusly - Task Report", userName);

  const { completedTasks, totalTasks, completionRate } =
    getTaskCompletionStats(tasks);

  doc.setFontSize(10);
  doc.text(
    `Total Tasks: ${totalTasks} | Completed: ${completedTasks} | Completion Rate: ${completionRate.toFixed(1)}%`,
    14,
    44,
  );

  // Tasks Table
  const tableData = tasks.map(taskToTableRow);
  addTasksTable(doc, tableData, 50);

  // Save the PDF
  downloadPDF(doc, "focusly-tasks");
};

/**
 * Exports tasks to a CSV file for spreadsheet applications.
 * Includes all task fields: title, priority, dates, times, and notes.
 *
 * @param {Task[]} tasks - Array of tasks to export
 * @returns {void} Downloads the CSV file
 *
 * @example
 * exportTasksToCSV(tasks); // Downloads focusly-tasks-2024-01-15.csv
 */
export const exportTasksToCSV = (tasks: Task[]): void => {
  const headers = [
    "Title",
    "Priority",
    "Domain",
    "Completed",
    "Start Date",
    "Start Time",
    "Due Date",
    "End Time",
    "Estimated Duration (min)",
    "Pomodoros",
    "Notes",
  ];
  const rows = [headers, ...tasks.map(taskToCSVRow)];
  downloadCSV(rows, "focusly-tasks");
};

/**
 * Generates a PDF blob for server-side processing or upload.
 * Returns the PDF as a Blob instead of triggering a download.
 * Useful for API routes or server-side export functionality.
 *
 * @param {Task[]} tasks - Array of tasks to export
 * @param {string} [userName='User'] - Name to display on the report
 * @returns {Blob} PDF file as Blob
 *
 * @example
 * const pdfBlob = await generateTasksPDFBlob(tasks, 'John Doe');
 * // Upload blob to storage or send via API
 */
export const generateTasksPDFBlob = (
  tasks: Task[],
  userName: string = "User",
): Blob => {
  const doc = createPDFDocument("Focusly - Task Report", userName);

  const { completedTasks, totalTasks, completionRate } =
    getTaskCompletionStats(tasks);

  doc.setFontSize(10);
  doc.text(
    `Total Tasks: ${totalTasks} | Completed: ${completedTasks} | Completion Rate: ${completionRate.toFixed(1)}%`,
    14,
    44,
  );

  // Tasks Table
  const tableData = tasks.map(taskToTableRow);
  addTasksTable(doc, tableData, 50);

  // Return as Blob
  return generatePDFBlob(doc);
};

// ============================================================================
// Analytics Export Functions
// ============================================================================

/**
 * Exports comprehensive analytics report to PDF.
 * Includes overall statistics, domain breakdown, and recent session history.
 *
 * @param {Stats} stats - User statistics object
 * @param {Task[]} tasks - Array of user tasks
 * @param {PomodoroSession[]} sessions - Array of Pomodoro sessions
 * @param {string} [userName='User'] - Name to display on the report
 * @returns {void} Downloads the PDF file
 *
 * @example
 * exportAnalyticsToPDF(stats, tasks, sessions, 'John Doe');
 * // Downloads focusly-analytics-2024-01-15.pdf
 */
export const exportAnalyticsToPDF = (
  stats: Stats,
  tasks: Task[],
  sessions: PomodoroSession[],
  userName: string = "User",
): void => {
  const doc = createPDFDocument("Focusly - Analytics Report", userName);

  // Overall Stats
  addSectionTitle(doc, "Overall Statistics", 48);
  const statsLines = [
    `Total Focus Time: ${formatHoursMinutesFromSeconds(stats.totalFocusTime)}`,
    `Total Sessions: ${stats.totalSessions}`,
    `Completed Tasks: ${stats.completedTasks} / ${stats.totalTasks}`,
    `Current Streak: ${stats.streak} days`,
    `Longest Streak: ${stats.longestStreak || 0} days`,
  ];
  addStatsText(doc, statsLines, 56);

  // Domain Breakdown
  addSectionTitle(doc, "Domain Breakdown", 90);

  const domainStats = Object.keys(DOMAINS).map((domainKey) => {
    const domainInfo = DOMAINS[domainKey as keyof typeof DOMAINS];
    const domainTasks = tasks.filter((task) => {
      if (!task.subDomain) return false;
      try {
        return getDomainFromSubDomain(task.subDomain) === domainKey;
      } catch {
        return false;
      }
    });

    const completed = domainTasks.filter((t) => t.completed).length;
    const total = domainTasks.length;
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

    return [
      domainInfo.name.split("(")[0].trim(),
      total.toString(),
      completed.toString(),
      `${rate}%`,
    ];
  });

  addDomainStatsTable(doc, domainStats, 96);

  // Recent Activity
  const finalY = getTableEndY(doc);
  addSectionTitle(doc, "Recent Activity (Last 10 Sessions)", finalY + 10);

  const recentSessions = sessions
    .filter((s) => s.completed && s.type === "work")
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 10)
    .map((session) => [
      format(new Date(session.startedAt), "MMM d, yyyy HH:mm"),
      `${session.duration / 60} min`,
      session.taskId
        ? tasks.find((t) => t.id === session.taskId)?.title || "Unknown"
        : "No task",
    ]);

  addSessionsTable(doc, recentSessions, finalY + 16);

  // Save the PDF
  downloadPDF(doc, "focusly-analytics");
};

/**
 * Exports analytics data to a CSV file with multiple sections.
 * Includes overall statistics, domain breakdown, and recent session history.
 *
 * @param {Stats} stats - User statistics object
 * @param {Task[]} tasks - Array of user tasks
 * @param {PomodoroSession[]} sessions - Array of Pomodoro sessions
 * @returns {void} Downloads the CSV file
 *
 * @example
 * exportAnalyticsToCSV(stats, tasks, sessions);
 * // Downloads focusly-analytics-2024-01-15.csv
 */
export const exportAnalyticsToCSV = (
  stats: Stats,
  tasks: Task[],
  sessions: PomodoroSession[],
): void => {
  const rows = analyticsToCSVRows(stats, sessions, tasks, getDomainName);
  downloadCSV(rows, "focusly-analytics");
};

// ============================================================================
// Large Dataset Export Functions
// ============================================================================

/**
 * Exports large task dataset to PDF using chunked processing.
 * Processes tasks in batches to avoid memory issues with large datasets.
 * Uses streaming approach for better performance.
 *
 * @param {Task[]} tasks - Array of tasks to export
 * @param {string} [userName='User'] - Name to display on the report
 * @param {number} [chunkSize=100] - Number of tasks to process per chunk
 * @returns {void} Downloads the PDF file
 *
 * @example
 * exportLargeTasksToPDF(largeTaskArray, 'John Doe', 100);
 * // Downloads focusly-tasks-large-2024-01-15.pdf
 */
export const exportLargeTasksToPDF = async (
  tasks: Task[],
  userName: string = "User",
  chunkSize: number = 100,
): Promise<void> => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text("Focusly - Large Task Report", 14, 22);

  // Subtitle
  doc.setFontSize(12);
  doc.text(`Generated for: ${userName}`, 14, 30);
  doc.text(`Date: ${format(new Date(), "MMM d, yyyy")}`, 14, 36);

  const { completedTasks, totalTasks, completionRate } =
    getTaskCompletionStats(tasks);

  doc.setFontSize(10);
  doc.text(
    `Total Tasks: ${totalTasks} | Completed: ${completedTasks} | Completion Rate: ${completionRate.toFixed(1)}%`,
    14,
    44,
  );

  // Process tasks in chunks to avoid memory issues
  let startY = 50;

  for (let i = 0; i < tasks.length; i += chunkSize) {
    const chunk = tasks.slice(i, i + chunkSize);
    const tableData = chunk.map(taskToCompactTableRow);

    await new Promise<void>((resolve) => {
      autoTable(doc, {
        startY,
        head:
          i === 0
            ? [["Task", "Priority", "Domain", "Done", "Start", "Due", "Poms"]]
            : undefined,
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 20 },
          2: { cellWidth: 35 },
          3: { cellWidth: 15 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 15 },
        },
        didDrawPage: () => {
          // Add page numbers
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Page ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" },
          );
        },
      });
      resolve();
    });

    startY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? startY;
    startY += 5;

    // Allow UI to update between chunks (prevents blocking)
    if (i + chunkSize < tasks.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Save the PDF
  downloadPDF(doc, "focusly-tasks-large");
};
