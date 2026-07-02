"use client";

import { useMemo } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DateTimeService } from "@/lib/domain/services/DateTimeService";

interface Session {
  started_at: string;
  duration: number;
}

interface ProductivityHeatmapProps {
  sessions: Session[];
}

export default function ProductivityHeatmap({
  sessions,
}: ProductivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const data: Array<{
      day: number;
      hour: number;
      value: number;
      sessions: number;
      dayName: string;
    }> = [];

    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const sessionsAtTime = sessions.filter((s) => {
          const date = new Date(s.started_at);
          return date.getDay() === day && date.getHours() === hour;
        });

        const totalTime = sessionsAtTime.reduce(
          (sum, s) => sum + s.duration,
          0,
        );

        data.push({
          day,
          hour,
          value: totalTime,
          sessions: sessionsAtTime.length,
          dayName: days[day],
        });
      }
    }

    return data;
  }, [sessions]);

  const maxValue = useMemo(
    () => Math.max(...heatmapData.map((d) => d.value), 1),
    [heatmapData],
  );

  const getColor = (value: number) => {
    if (value === 0) return "bg-muted";

    const intensity = value / maxValue;

    if (intensity > 0.8) return "bg-brand-primary";
    if (intensity > 0.6) return "bg-brand-primary/80";
    if (intensity > 0.4) return "bg-brand-primary/60";
    if (intensity > 0.2) return "bg-brand-primary/40";
    return "bg-brand-primary/20";
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productivity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header avec les heures */}
            <div className="flex mb-2">
              <div className="w-12"></div>
              <div className="flex-1 grid grid-cols-24 gap-1">
                {hours.map(
                  (hour) =>
                    hour % 3 === 0 && (
                      <div
                        key={hour}
                        className="col-span-3 text-xs font-medium text-center text-muted-foreground"
                      >
                        {hour}h
                      </div>
                    ),
                )}
              </div>
            </div>

            {/* Grille heatmap */}
            {days.map((day, dayIndex) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-12 text-xs text-muted-foreground pr-2">
                  {day}
                </div>
                <div className="flex-1 grid grid-cols-24 gap-1">
                  {hours.map((hour) => {
                    const cell = heatmapData.find(
                      (d) => d.day === dayIndex && d.hour === hour,
                    );
                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className={`h-4 rounded-sm ${getColor(cell?.value || 0)} 
                          transition-transform hover:scale-120 hover:border z-10 cursor-pointer`}
                        title={`${day} ${hour}h: ${DateTimeService.formatTime(cell?.value || 0)} (${cell?.sessions || 0} sessions)`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <div className="w-3 h-3 rounded-sm bg-brand-primary/20" />
                <div className="w-3 h-3 rounded-sm bg-brand-primary/40" />
                <div className="w-3 h-3 rounded-sm bg-brand-primary/60" />
                <div className="w-3 h-3 rounded-sm bg-brand-primary/80" />
                <div className="w-3 h-3 rounded-sm bg-brand-primary" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
