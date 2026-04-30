import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import { DateTimeService } from "@/lib/domain/services/DateTimeService";
import { ExportOptions } from "@/app/(app)/dashboard/_components/ExportPDFModal";
import { Insight } from "./InsightService";

interface Stats {
  totalFocusTime: number;
  totalTasks: number;
  completedTasks: number;
  totalSessions: number;
  streak: number;
  longestStreak?: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  completed_at?: string;
  created_at: string;
}

interface Session {
  started_at: string;
  duration: number;
}

interface JsPdfWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

const formatDateRange = (range: string): string => {
  const now = new Date();
  switch (range) {
    case "7days":
      return "Last 7 days";
    case "30days":
      return "Last 30 days";
    case "thisMonth":
      return `${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    case "lastMonth":
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return `${lastMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    case "thisYear":
      return `Year ${now.getFullYear()}`;
    default:
      return range;
  }
};

export const exportCustomAnalyticsToPDF = async (
  stats: Stats,
  tasks: Task[],
  sessions: Session[],
  userName: string,
  options: ExportOptions,
  insights: Insight[],
  chartElement?: HTMLElement | null,
): Promise<void> => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.text("Focusly Productivity Report", 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.text(`User: ${userName}`, 20, yPosition);
  doc.text(`Period: ${formatDateRange(options.timeRange)}`, 20, yPosition + 5);
  doc.text(
    `Generated on: ${new Date().toLocaleDateString("en-US")}`,
    150,
    yPosition,
  );
  yPosition += 20;

  // Stats if selected
  if (options.includeStats) {
    doc.setFontSize(16);
    doc.text("Statistics", 20, yPosition);
    yPosition += 10;

    const statsData = [
      ["Metric", "Value"],
      ["Total Sessions", stats.totalSessions.toString()],
      ["Completed Tasks", `${stats.completedTasks}/${stats.totalTasks}`],
      ["Total Focus Time", DateTimeService.formatTime(stats.totalFocusTime)],
      ["Current Streak", `${stats.streak} days`],
      ["Longest Streak", `${stats.longestStreak || 0} days`],
    ];

    (doc as any).autoTable({
      startY: yPosition,
      head: [statsData[0]],
      body: statsData.slice(1),
      theme: "grid",
      styles: { fontSize: 10 },
    });

    yPosition =
      ((doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? yPosition) + 15;
  }

  // Charts si sélectionné
  if (options.includeCharts && chartElement) {
    try {
      const chartCanvas = await html2canvas(chartElement);
      const chartImage = chartCanvas.toDataURL("image/png");

      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text("Productivity Chart", 20, yPosition);
      yPosition += 10;

      doc.addImage(chartImage, "PNG", 20, yPosition, 170, 100);
      yPosition += 110;
    } catch (error) {
      console.error("Failed to export chart:", error);
    }
  }

  // Insights if selected
  if (options.includeInsights && insights.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.text("Insights & Recommendations", 20, yPosition);
    yPosition += 10;

    insights.forEach((insight) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${insight.icon} ${insight.title}`, 20, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const messageLines = doc.splitTextToSize(insight.message, 170);
      doc.text(messageLines, 25, yPosition);
      yPosition += messageLines.length * 5 + 3;

      if (insight.suggestion) {
        doc.setTextColor(100, 100, 100);
        const suggestionLines = doc.splitTextToSize(
          `→ ${insight.suggestion}`,
          165,
        );
        doc.text(suggestionLines, 25, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += suggestionLines.length * 5;
      }

      yPosition += 5;
    });
  }

  // Tasks if selected
  if (options.includeTasks && tasks.length > 0) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(16);
    doc.text("Recent Tasks", 20, yPosition);
    yPosition += 10;

    const recentTasks = tasks
      .filter((t) => t.status === "completed")
      .slice(0, 20)
      .map((t) => [
        t.title.substring(0, 40),
        new Date(t.completed_at || t.created_at).toLocaleDateString("en-US"),
      ]);

    if (recentTasks.length > 0) {
      (doc as any).autoTable({
        startY: yPosition,
        head: [["Task", "Date"]],
        body: recentTasks,
        theme: "grid",
        styles: { fontSize: 9 },
      });
    }
  }

  // Save
  const filename = `focusly-report-${options.timeRange}-${Date.now()}.pdf`;
  doc.save(filename);
};
