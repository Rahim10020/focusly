'use client';

import { useMemo } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatTime } from '@/lib/utils/time';

interface Session {
    started_at: string;
    duration: number;
}

interface ProductivityHeatmapProps {
    sessions: Session[];
}

export default function ProductivityHeatmap({ sessions }: ProductivityHeatmapProps) {
    const heatmapData = useMemo(() => {
        const data: Array<{
            day: number;
            hour: number;
            value: number;
            sessions: number;
            dayName: string;
        }> = [];

        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

        for (let day = 0; day < 7; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const sessionsAtTime = sessions.filter(s => {
                    const date = new Date(s.started_at);
                    return date.getDay() === day && date.getHours() === hour;
                });

                const totalTime = sessionsAtTime.reduce((sum, s) => sum + s.duration, 0);

                data.push({
                    day,
                    hour,
                    value: totalTime,
                    sessions: sessionsAtTime.length,
                    dayName: days[day]
                });
            }
        }

        return data;
    }, [sessions]);

    const maxValue = useMemo(() =>
        Math.max(...heatmapData.map(d => d.value), 1),
        [heatmapData]
    );

    const getColor = (value: number) => {
        if (value === 0) return 'bg-gray-100 dark:bg-gray-800';

        const intensity = value / maxValue;

        if (intensity > 0.8) return 'bg-green-700';
        if (intensity > 0.6) return 'bg-green-600';
        if (intensity > 0.4) return 'bg-green-500';
        if (intensity > 0.2) return 'bg-green-400';
        return 'bg-green-200';
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Heatmap de Productivité</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                        {/* Header avec les heures */}
                        <div className="flex mb-2">
                            <div className="w-12"></div>
                            <div className="flex-1 grid grid-cols-24 gap-1">
                                {hours.map(hour => (
                                    hour % 3 === 0 && (
                                        <div key={hour} className="col-span-3 text-xs text-center text-muted-foreground">
                                            {hour}h
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Grille heatmap */}
                        {days.map((day, dayIndex) => (
                            <div key={day} className="flex items-center mb-1">
                                <div className="w-12 text-xs text-muted-foreground pr-2">
                                    {day}
                                </div>
                                <div className="flex-1 grid grid-cols-24 gap-1">
                                    {hours.map(hour => {
                                        const cell = heatmapData.find(
                                            d => d.day === dayIndex && d.hour === hour
                                        );
                                        return (
                                            <div
                                                key={`${dayIndex}-${hour}`}
                                                className={`h-4 rounded-sm ${getColor(cell?.value || 0)} 
                          transition-transform hover:scale-150 hover:z-10 cursor-pointer`}
                                                title={`${day} ${hour}h: ${formatTime(cell?.value || 0)} (${cell?.sessions || 0} sessions)`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Légende */}
                        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                            <span>Moins</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                                <div className="w-3 h-3 rounded-sm bg-green-200" />
                                <div className="w-3 h-3 rounded-sm bg-green-400" />
                                <div className="w-3 h-3 rounded-sm bg-green-500" />
                                <div className="w-3 h-3 rounded-sm bg-green-600" />
                                <div className="w-3 h-3 rounded-sm bg-green-700" />
                            </div>
                            <span>Plus</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
