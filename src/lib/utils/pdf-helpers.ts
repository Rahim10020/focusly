/**
 * @fileoverview PDF helper functions for generating PDF documents.
 * Provides reusable utilities for creating PDF reports with consistent styling.
 * @module lib/utils/pdf-helpers
 */

import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

// Type definitions for better type safety
type ColumnStyles = Record<number, { cellWidth: number }>;
type FillColor = [number, number, number];

// ============================================================================
// PDF Document Factory
// ============================================================================

/**
 * Creates a new PDF document with standard header (title, user name, date).
 *
 * @param {string} title - Document title
 * @param {string} userName - User name to display
 * @param {string} subtitle - Optional subtitle
 * @returns {jsPDF} Configured jsPDF document
 *
 * @example
 * const doc = createPDFDocument('My Report', 'John Doe', 'Monthly Summary');
 */
export const createPDFDocument = (
  title: string,
  userName: string,
  subtitle?: string,
): jsPDF => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text(title, 14, 22);

  // Subtitle
  doc.setFontSize(12);
  doc.text(`Generated for: ${userName}`, 14, 30);
  doc.text(`Date: ${format(new Date(), "MMM d, yyyy")}`, 14, 36);

  if (subtitle) {
    doc.text(subtitle, 14, 42);
  }

  return doc;
};

/**
 * Adds a header section with title, subtitle and date to an existing PDF document.
 *
 * @param {jsPDF} doc - PDF document instance
 * @param {string} title - Main title
 * @param {string} userName - User name
 * @param {number} startY - Starting Y position (default: 22)
 * @returns {number} Y position after header
 */
export const addPDFHeader = (
  doc: jsPDF,
  title: string,
  userName: string,
  startY: number = 22,
): number => {
  doc.setFontSize(20);
  doc.text(title, 14, startY);

  doc.setFontSize(12);
  doc.text(`Generated for: ${userName}`, 14, startY + 8);
  doc.text(`Date: ${format(new Date(), "MMM d, yyyy")}`, 14, startY + 14);

  return startY + 22;
};

// ============================================================================
// Table Configuration
// ============================================================================

/**
 * Standard primary color for PDF tables.
 */
const PRIMARY_COLOR: FillColor = [99, 102, 241];

/**
 * Table styles used across PDF exports.
 */
export const PDF_TABLE_STYLES = {
  theme: "grid" as const,
  headStyles: { fillColor: PRIMARY_COLOR },
  defaultStyles: { fontSize: 8 },
  tasks: {
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20 },
      2: { cellWidth: 30 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 20 },
    } as ColumnStyles,
  },
  tasksCompact: {
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20 },
      2: { cellWidth: 35 },
      3: { cellWidth: 15 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 15 },
    } as ColumnStyles,
  },
  analytics: {
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
    } as ColumnStyles,
  },
  sessions: {
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30 },
      2: { cellWidth: 60 },
    } as ColumnStyles,
  },
};

/**
 * Creates a tasks table configuration.
 *
 * @param {jsPDF} doc - PDF document instance
 * @param {string[][]} data - Table data rows
 * @param {number} startY - Starting Y position
 * @param {boolean} compact - Use compact mode for large datasets
 * @returns {number} Y position after table
 */
export const addTasksTable = (
  doc: jsPDF,
  data: string[][],
  startY: number,
  compact: boolean = false,
): number => {
  (doc as any).autoTable({
    startY,
    head: compact
      ? [["Task", "Priority", "Domain", "Done", "Start", "Due", "Poms"]]
      : [
          [
            "Task",
            "Priority",
            "Domain",
            "Completed",
            "Start Date",
            "Due Date",
            "Pomodoros",
          ],
        ],
    body: data,
    theme: "grid",
    headStyles: { fillColor: PRIMARY_COLOR },
    styles: {
      fontSize: compact ? 7 : 8,
    },
    columnStyles: compact
      ? PDF_TABLE_STYLES.tasksCompact.columnStyles
      : PDF_TABLE_STYLES.tasks.columnStyles,
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable?.finalY;
  return finalY ?? startY;
};

/**
 * Creates a domain statistics table.
 *
 * @param {jsPDF} doc - PDF document instance
 * @param {string[][]} data - Table data rows
 * @param {number} startY - Starting Y position
 * @returns {number} Y position after table
 */
export const addDomainStatsTable = (
  doc: jsPDF,
  data: string[][],
  startY: number,
): number => {
  (doc as any).autoTable({
    startY,
    head: [["Domain", "Total Tasks", "Completed", "Completion Rate"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: PRIMARY_COLOR },
    styles: { fontSize: 9 },
    columnStyles: PDF_TABLE_STYLES.analytics.columnStyles,
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable?.finalY;
  return finalY ?? startY;
};

/**
 * Creates a sessions table for recent activity.
 *
 * @param {jsPDF} doc - PDF document instance
 * @param {string[][]} data - Table data rows
 * @param {number} startY - Starting Y position
 * @returns {number} Y position after table
 */
export const addSessionsTable = (
  doc: jsPDF,
  data: string[][],
  startY: number,
): number => {
  (doc as any).autoTable({
    startY,
    head: [["Date & Time", "Duration", "Task"]],
    body: data,
    theme: "grid",
    headStyles: { fillColor: PRIMARY_COLOR },
    styles: { fontSize: 9 },
    columnStyles: PDF_TABLE_STYLES.sessions.columnStyles,
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable?.finalY;
  return finalY ?? startY;
};

// ============================================================================
// Text Helpers
// ============================================================================

/**
 * Adds statistics text section to PDF.
 *
 * @param {jsPDF} doc - PDF document instance
 * @param {string[]} lines - Text lines to display
 * @param {number} startY - Starting Y position
 * @param {number} lineHeight - Line height (default: 6)
 * @returns {number} Y position after text
 */
export const addStatsText = (
  doc: jsPDF,
  lines: string[],
  startY: number,
  lineHeight: number = 6,
): number => {
  doc.setFontSize(10);
  lines.forEach((line, index) => {
    doc.text(line, 14, startY + index * lineHeight);
  });
  return startY + lines.length * lineHeight;
};

/**
 * Adds a section title to PDF.
 *
 * @param {jsPDF} doc - PDF document instance
 * @param {string} title - Section title
 * @param {number} y - Y position
 * @param {number} fontSize - Font size (default: 14)
 */
export const addSectionTitle = (
  doc: jsPDF,
  title: string,
  y: number,
  fontSize: number = 14,
): void => {
  doc.setFontSize(fontSize);
  doc.text(title, 14, y);
};

// ============================================================================
// Download Helpers
// ============================================================================

/**
 * Triggers a PDF download from a jsPDF document.
 *
 * @param {jsPDF} doc - PDF document instance
 * @param {string} filename - Download filename (without extension)
 */
export const downloadPDF = (doc: jsPDF, filename: string): void => {
  doc.save(`${filename}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

/**
 * Generates a PDF blob from a jsPDF document.
 *
 * @param {jsPDF} doc - PDF document instance
 * @returns {Blob} PDF as Blob
 */
export const generatePDFBlob = (doc: jsPDF): Blob => {
  return doc.output("blob");
};

/**
 * Gets the current Y position after the last table.
 *
 * @param {jsPDF} doc - PDF document instance
 * @param {number} defaultY - Default Y if no table exists
 * @returns {number} Y position
 */
export const getTableEndY = (doc: jsPDF, defaultY: number = 100): number => {
  const lastAutoTable = (
    doc as unknown as { lastAutoTable?: { finalY: number } }
  ).lastAutoTable;
  return lastAutoTable?.finalY ?? defaultY;
};
