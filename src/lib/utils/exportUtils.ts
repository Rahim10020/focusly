/**
 * @fileoverview Export utilities for generating PDF and CSV reports.
 * Provides functions to export tasks and analytics data in various formats.
 * @module lib/utils/exportUtils
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task, Stats, PomodoroSession, DOMAINS, getDomainFromSubDomain } from '@/types';
import { format } from 'date-fns';

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
export const exportTasksToPDF = (tasks: Task[], userName: string = 'User') => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Focusly - Task Report', 14, 22);

    // Subtitle
    doc.setFontSize(12);
    doc.text(`Generated for: ${userName}`, 14, 30);
    doc.text(`Date: ${format(new Date(), 'MMM d, yyyy')}`, 14, 36);

    // Summary Stats
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

    doc.setFontSize(10);
    doc.text(`Total Tasks: ${totalTasks} | Completed: ${completedTasks} | Completion Rate: ${completionRate}%`, 14, 44);

    // Tasks Table
    const tableData = tasks.map(task => [
        task.title,
        task.priority || 'None',
        task.subDomain ? DOMAINS[getDomainFromSubDomain(task.subDomain)]?.name.split('(')[0].trim() : 'N/A',
        task.completed ? 'Yes' : 'No',
        task.startDate ? format(new Date(task.startDate), 'MMM d, yyyy') : 'N/A',
        task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'N/A',
        task.pomodoroCount.toString(),
    ]);

    autoTable(doc, {
        startY: 50,
        head: [['Task', 'Priority', 'Domain', 'Completed', 'Start Date', 'Due Date', 'Pomodoros']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }, // Primary color
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 20 },
        },
    });

    // Save the PDF
    doc.save(`focusly-tasks-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

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
    userName: string = 'User'
) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Focusly - Analytics Report', 14, 22);

    // Subtitle
    doc.setFontSize(12);
    doc.text(`Generated for: ${userName}`, 14, 30);
    doc.text(`Date: ${format(new Date(), 'MMM d, yyyy')}`, 14, 36);

    // Overall Stats
    doc.setFontSize(14);
    doc.text('Overall Statistics', 14, 48);

    doc.setFontSize(10);
    const statsY = 56;
    doc.text(`Total Focus Time: ${Math.round(stats.totalFocusTime / 3600)}h ${Math.round((stats.totalFocusTime % 3600) / 60)}m`, 14, statsY);
    doc.text(`Total Sessions: ${stats.totalSessions}`, 14, statsY + 6);
    doc.text(`Completed Tasks: ${stats.completedTasks} / ${stats.totalTasks}`, 14, statsY + 12);
    doc.text(`Current Streak: ${stats.streak} days`, 14, statsY + 18);
    doc.text(`Longest Streak: ${stats.longestStreak || 0} days`, 14, statsY + 24);

    // Domain Breakdown
    doc.setFontSize(14);
    doc.text('Domain Breakdown', 14, statsY + 36);

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

        const completed = domainTasks.filter(t => t.completed).length;
        const total = domainTasks.length;
        const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';

        return [
            domainInfo.name.split('(')[0].trim(),
            total.toString(),
            completed.toString(),
            `${rate}%`
        ];
    });

    autoTable(doc, {
        startY: statsY + 42,
        head: [['Domain', 'Total Tasks', 'Completed', 'Completion Rate']],
        body: domainStats,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 9 },
    });

    // Recent Activity
    const finalY = (doc as any).lastAutoTable.finalY || statsY + 100;
    doc.setFontSize(14);
    doc.text('Recent Activity (Last 10 Sessions)', 14, finalY + 10);

    const recentSessions = sessions
        .filter(s => s.completed && s.type === 'work')
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 10)
        .map(session => [
            format(new Date(session.startedAt), 'MMM d, yyyy HH:mm'),
            `${session.duration / 60} min`,
            session.taskId ? tasks.find(t => t.id === session.taskId)?.title || 'Unknown' : 'No task'
        ]);

    autoTable(doc, {
        startY: finalY + 16,
        head: [['Date & Time', 'Duration', 'Task']],
        body: recentSessions,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 9 },
    });

    // Save the PDF
    doc.save(`focusly-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
export const exportTasksToCSV = (tasks: Task[]) => {
    const headers = ['Title', 'Priority', 'Domain', 'Completed', 'Start Date', 'Start Time', 'Due Date', 'End Time', 'Estimated Duration (min)', 'Pomodoros', 'Notes'];

    const rows = tasks.map(task => [
        task.title,
        task.priority || '',
        task.subDomain ? DOMAINS[getDomainFromSubDomain(task.subDomain)]?.name : '',
        task.completed ? 'Yes' : 'No',
        task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
        task.startTime || '',
        task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        task.endTime || '',
        task.estimatedDuration?.toString() || '',
        task.pomodoroCount.toString(),
        task.notes || '',
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `focusly-tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
export const exportAnalyticsToCSV = (stats: Stats, tasks: Task[], sessions: PomodoroSession[]) => {
    const lines: string[] = [];

    // Overall Stats
    lines.push('OVERALL STATISTICS');
    lines.push(`Total Focus Time (hours),${(stats.totalFocusTime / 3600).toFixed(2)}`);
    lines.push(`Total Sessions,${stats.totalSessions}`);
    lines.push(`Total Tasks,${stats.totalTasks}`);
    lines.push(`Completed Tasks,${stats.completedTasks}`);
    lines.push(`Completion Rate (%),${stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(2) : 0}`);
    lines.push(`Current Streak (days),${stats.streak}`);
    lines.push(`Longest Streak (days),${stats.longestStreak || 0}`);
    lines.push('');

    // Domain Stats
    lines.push('DOMAIN STATISTICS');
    lines.push('Domain,Total Tasks,Completed Tasks,Completion Rate (%)');

    Object.keys(DOMAINS).forEach((domainKey) => {
        const domainInfo = DOMAINS[domainKey as keyof typeof DOMAINS];
        const domainTasks = tasks.filter((task) => {
            if (!task.subDomain) return false;
            try {
                return getDomainFromSubDomain(task.subDomain) === domainKey;
            } catch {
                return false;
            }
        });

        const completed = domainTasks.filter(t => t.completed).length;
        const total = domainTasks.length;
        const rate = total > 0 ? ((completed / total) * 100).toFixed(2) : '0';

        lines.push(`"${domainInfo.name}",${total},${completed},${rate}`);
    });

    lines.push('');

    // Recent Sessions
    lines.push('RECENT SESSIONS');
    lines.push('Date & Time,Duration (min),Task');

    sessions
        .filter(s => s.completed && s.type === 'work')
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 50)
        .forEach(session => {
            const taskTitle = session.taskId ? tasks.find(t => t.id === session.taskId)?.title || 'Unknown' : 'No task';
            lines.push(`${format(new Date(session.startedAt), 'yyyy-MM-dd HH:mm')},${session.duration / 60},"${taskTitle}"`);
        });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `focusly-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
