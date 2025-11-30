import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { formatTime } from './time';
import { ExportOptions } from '@/components/dashboard/ExportPDFModal';
import { Insight } from './insightGenerator';

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

const formatDateRange = (range: string): string => {
    const now = new Date();
    switch (range) {
        case '7days':
            return 'Les 7 derniers jours';
        case '30days':
            return 'Les 30 derniers jours';
        case 'thisMonth':
            return `${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        case 'lastMonth':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            return `${lastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
        case 'thisYear':
            return `Année ${now.getFullYear()}`;
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
    chartElement?: HTMLElement | null
): Promise<void> => {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.text('Rapport de Productivité Focusly', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Utilisateur: ${userName}`, 20, yPosition);
    doc.text(`Période: ${formatDateRange(options.timeRange)}`, 20, yPosition + 5);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 150, yPosition);
    yPosition += 20;

    // Stats si sélectionné
    if (options.includeStats) {
        doc.setFontSize(16);
        doc.text('Statistiques', 20, yPosition);
        yPosition += 10;

        const statsData = [
            ['Métrique', 'Valeur'],
            ['Sessions totales', stats.totalSessions.toString()],
            ['Tâches complétées', `${stats.completedTasks}/${stats.totalTasks}`],
            ['Temps focus total', formatTime(stats.totalFocusTime)],
            ['Streak actuel', `${stats.streak} jours`],
            ['Plus long streak', `${stats.longestStreak || 0} jours`]
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [statsData[0]],
            body: statsData.slice(1),
            theme: 'grid',
            styles: { fontSize: 10 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Charts si sélectionné
    if (options.includeCharts && chartElement) {
        try {
            const chartCanvas = await html2canvas(chartElement);
            const chartImage = chartCanvas.toDataURL('image/png');

            if (yPosition > 200) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(16);
            doc.text('Graphique de Productivité', 20, yPosition);
            yPosition += 10;

            doc.addImage(chartImage, 'PNG', 20, yPosition, 170, 100);
            yPosition += 110;
        } catch (error) {
            console.error('Failed to export chart:', error);
        }
    }

    // Insights si sélectionné
    if (options.includeInsights && insights.length > 0) {
        if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text('Insights et Recommandations', 20, yPosition);
        yPosition += 10;

        insights.forEach((insight) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${insight.icon} ${insight.title}`, 20, yPosition);
            yPosition += 7;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const messageLines = doc.splitTextToSize(insight.message, 170);
            doc.text(messageLines, 25, yPosition);
            yPosition += messageLines.length * 5 + 3;

            if (insight.suggestion) {
                doc.setTextColor(100, 100, 100);
                const suggestionLines = doc.splitTextToSize(`→ ${insight.suggestion}`, 165);
                doc.text(suggestionLines, 25, yPosition);
                doc.setTextColor(0, 0, 0);
                yPosition += suggestionLines.length * 5;
            }

            yPosition += 5;
        });
    }

    // Tasks si sélectionné
    if (options.includeTasks && tasks.length > 0) {
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(16);
        doc.text('Tâches Récentes', 20, yPosition);
        yPosition += 10;

        const recentTasks = tasks
            .filter(t => t.status === 'completed')
            .slice(0, 20)
            .map(t => [
                t.title.substring(0, 40),
                new Date(t.completed_at || t.created_at).toLocaleDateString('fr-FR')
            ]);

        if (recentTasks.length > 0) {
            autoTable(doc, {
                startY: yPosition,
                head: [['Tâche', 'Date']],
                body: recentTasks,
                theme: 'grid',
                styles: { fontSize: 9 }
            });
        }
    }

    // Save
    const filename = `focusly-rapport-${options.timeRange}-${Date.now()}.pdf`;
    doc.save(filename);
};
