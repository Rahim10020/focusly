/**
 * @fileoverview CSV helper functions for exporting data to CSV format.
 * Provides utilities for creating and downloading CSV files.
 * @module lib/utils/csv-helpers
 */

import { format } from 'date-fns';
import { getTaskCompletionStats } from '../domain/services/StatsCalculationService';

// ============================================================================
// CSV Generation Helpers
// ============================================================================

/**
 * Escapes a CSV cell value to handle quotes and commas.
 *
 * @param {string} value - Cell value to escape
 * @returns {string} Escaped CSV cell
 *
 * @example
 * escapeCSVCell('Hello, World'); // Returns '"Hello, World"'
 */
export const escapeCSVCell = (value: string): string => {
    const stringValue = String(value ?? '');
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

/**
 * Converts an array of data rows to CSV format.
 *
 * @param {string[][]} rows - Array of rows, where each row is an array of cells
 * @returns {string} Complete CSV content
 *
 * @example
 * const csv = rowsToCSV([
 *   ['Name', 'Age'],
 *   ['John', '30'],
 * ]);
 * // Returns "Name,Age\nJohn,30"
 */
export const rowsToCSV = (rows: string[][]): string => {
    return rows.map(row => row.map(escapeCSVCell).join(',')).join('\n');
};

/**
 * Converts data rows to CSV and returns as blob-ready string.
 *
 * @param {string[][]} rows - Array of rows
 * @returns {string} CSV content with proper line endings
 */
export const generateCSVContent = (rows: string[][]): string => {
    return rowsToCSV(rows);
};

// ============================================================================
// Download Helpers
// ============================================================================

/**
 * Creates a CSV blob from content.
 *
 * @param {string} content - CSV content string
 * @returns {Blob} CSV file as Blob
 */
export const createCSVBlob = (content: string): Blob => {
    return new Blob([content], { type: 'text/csv;charset=utf-8;' });
};

/**
 * Creates a download link and triggers the download.
 *
 * @param {Blob} blob - CSV Blob to download
 * @param {string} filename - Download filename (without extension)
 */
export const downloadCSVBlob = (blob: Blob, filename: string): void => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Creates and triggers a CSV download from rows.
 *
 * @param {string[][]} rows - Array of rows to export
 * @param {string} filename - Download filename (without extension)
 */
export const downloadCSV = (rows: string[][], filename: string): void => {
    const content = generateCSVContent(rows);
    const blob = createCSVBlob(content);
    downloadCSVBlob(blob, filename);
};

// ============================================================================
// Data Transformation Helpers
// ============================================================================

/**
 * Transforms task data to CSV rows for task export.
 *
 * @param {Array<{ title: string; priority?: string; subDomain?: string; completed: boolean; startDate?: string; startTime?: string; dueDate?: string; endTime?: string; estimatedDuration?: number; pomodoroCount: number; notes?: string }>} tasks - Task data
 * @param {(subDomain: string) => string} getDomainName - Function to get domain name from subDomain
 * @returns {string[][]} CSV-ready rows
 */
export const tasksToCSVRows = (
    tasks: Array<{
        title: string;
        priority?: string | null;
        subDomain?: string;
        completed: boolean;
        startDate?: string | null;
        startTime?: string | null;
        dueDate?: string | null;
        endTime?: string | null;
        estimatedDuration?: number | null;
        pomodoroCount: number;
        notes?: string | null;
    }>,
    getDomainName: (subDomain: string) => string
): string[][] => {
    const headers = [
        'Title',
        'Priority',
        'Domain',
        'Completed',
        'Start Date',
        'Start Time',
        'Due Date',
        'End Time',
        'Estimated Duration (min)',
        'Pomodoros',
        'Notes',
    ];

    const rows = tasks.map(task => [
        task.title,
        task.priority || '',
        task.subDomain ? getDomainName(task.subDomain) : '',
        task.completed ? 'Yes' : 'No',
        task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
        task.startTime || '',
        task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        task.endTime || '',
        task.estimatedDuration?.toString() || '',
        task.pomodoroCount.toString(),
        task.notes || '',
    ]);

    return [headers, ...rows];
};

/**
 * Transforms stats data to CSV rows for analytics export.
 *
 * @param {Object} params - Stats parameters
 * @param {Object} params.stats - User statistics
 * @param {Array<{ completed: boolean; type: string; startedAt: string | number | Date; duration: number; taskId?: string }>} params.sessions - Pomodoro sessions
 * @param {Array<{ title: string; completed: boolean; subDomain?: string }>} params.tasks - Tasks
 * @param {(subDomain: string) => string} getDomainName - Function to get domain name
 * @returns {string[][]} CSV-ready rows
 */
export const analyticsToCSVRows = (
    stats: {
        totalFocusTime: number;
        totalSessions: number;
        totalTasks: number;
        completedTasks: number;
        streak: number;
        longestStreak?: number | null;
    },
    sessions: Array<{
        completed: boolean;
        type: string;
        startedAt: number;
        duration: number;
        taskId?: string | null;
    }>,
    tasks: Array<{
        id?: string;
        title: string;
        completed: boolean;
        subDomain?: string | null;
    }>,
    getDomainName: (subDomain: string) => string
): string[][] => {
    const lines: string[][] = [];
    const { completionRate } = getTaskCompletionStats(
        tasks.map((task) => ({
            id: task.id || task.title,
            title: task.title,
            completed: task.completed,
            createdAt: 0,
            pomodoroCount: 0,
        }))
    );

    // Overall Stats
    lines.push(['OVERALL STATISTICS']);
    lines.push(['Total Focus Time (hours)', (stats.totalFocusTime / 3600).toFixed(2)]);
    lines.push(['Total Sessions', stats.totalSessions.toString()]);
    lines.push(['Total Tasks', stats.totalTasks.toString()]);
    lines.push(['Completed Tasks', stats.completedTasks.toString()]);
    lines.push(['Completion Rate (%)', completionRate.toFixed(2)]);
    lines.push(['Current Streak (days)', stats.streak.toString()]);
    lines.push(['Longest Streak (days)', (stats.longestStreak || 0).toString()]);
    lines.push([]);

    // Domain Stats
    lines.push(['DOMAIN STATISTICS']);
    lines.push(['Domain', 'Total Tasks', 'Completed Tasks', 'Completion Rate (%)']);

    // Add domain rows
    const domains = new Map<string, { total: number; completed: number }>();
    
    tasks.forEach(task => {
        if (task.subDomain) {
            const domainName = getDomainName(task.subDomain);
            const existing = domains.get(domainName) || { total: 0, completed: 0 };
            existing.total += 1;
            if (task.completed) existing.completed += 1;
            domains.set(domainName, existing);
        }
    });

    domains.forEach((data, domain) => {
        const rate = data.total > 0 ? ((data.completed / data.total) * 100).toFixed(2) : '0';
        lines.push([domain, data.total.toString(), data.completed.toString(), rate]);
    });

    lines.push([]);

    // Recent Sessions
    lines.push(['RECENT SESSIONS']);
    lines.push(['Date & Time', 'Duration (min)', 'Task']);

    sessions
        .filter(s => s.completed && s.type === 'work')
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 50)
        .forEach(session => {
            const taskTitle = session.taskId ? tasks.find(t => t.id === session.taskId)?.title ?? 'Unknown' : 'No task';
            lines.push([
                format(new Date(session.startedAt), 'yyyy-MM-dd HH:mm'),
                (session.duration / 60).toString(),
                taskTitle,
            ]);
        });

    return lines;
};
