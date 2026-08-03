"use client";

import { useMemo } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DateTimeService } from "@/lib/domain/services/DateTimeService";
import { useMediaQuery } from "@/hooks/use-media-query";

interface Session {
  started_at: string;
  duration: number;
}

interface CellData {
  label: string;
  value: number;
  sessions: number;
}

type TimeBlock = "night" | "morning" | "afternoon" | "evening";

interface ProductivityHeatmapProps {
  sessions: Session[];
}

const TIME_BLOCKS: { key: TimeBlock; label: string }[] = [
  { key: "night", label: "Night" },
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTimeBlock(hour: number): TimeBlock {
  if (hour >= 0 && hour < 6) return "night";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

export default function ProductivityHeatmap({
  sessions,
}: ProductivityHeatmapProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  const heatmapData = useMemo(() => {
    const data: Array<{
      day: number;
      hour: number;
      value: number;
      sessions: number;
    }> = [];

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
        });
      }
    }

    return data;
  }, [sessions]);

  const timeBlockData = useMemo(() => {
    const data: Record<number, Record<TimeBlock, CellData>> = {};

    for (let day = 0; day < 7; day++) {
      data[day] = {
        night: { label: "Night", value: 0, sessions: 0 },
        morning: { label: "Morning", value: 0, sessions: 0 },
        afternoon: { label: "Afternoon", value: 0, sessions: 0 },
        evening: { label: "Evening", value: 0, sessions: 0 },
      };
    }

    sessions.forEach((s) => {
      const date = new Date(s.started_at);
      const day = date.getDay();
      const block = getTimeBlock(date.getHours());
      data[day][block].value += s.duration;
      data[day][block].sessions += 1;
    });

    return data;
  }, [sessions]);

  const getColor = (value: number, maxValue: number) => {
    if (value === 0) return "bg-muted";

    const intensity = value / maxValue;

    if (intensity > 0.8) return "bg-brand-primary";
    if (intensity > 0.6) return "bg-brand-primary/80";
    if (intensity > 0.4) return "bg-brand-primary/60";
    if (intensity > 0.2) return "bg-brand-primary/40";
    return "bg-brand-primary/20";
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const desktopMaxValue = useMemo(
    () => Math.max(...heatmapData.map((d) => d.value), 1),
    [heatmapData],
  );

  const mobileMaxValue = useMemo(
    () =>
      Math.max(
        ...Object.values(timeBlockData).flatMap((day) =>
          Object.values(day).map((d) => d.value),
        ),
        1,
      ),
    [timeBlockData],
  );

  if (isMobile) {
    return (
      <Card variant="special">
        <CardHeader>
          <CardTitle>Productivity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex mb-2">
                <div className="w-14"></div>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {TIME_BLOCKS.map((block) => (
                    <div
                      key={block.key}
                      className="text-xs font-normal text-center text-muted-foreground"
                    >
                      {block.label}
                    </div>
                  ))}
                </div>
              </div>

              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center mb-1">
                  <div className="w-12 text-xs text-muted-foreground pr-2">
                    {day}
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    {TIME_BLOCKS.map((block) => {
                      const cell = timeBlockData[dayIndex][block.key];
                      return (
                        <div
                          key={block.key}
                          className={`h-10 rounded ${getColor(cell.value, mobileMaxValue)} 
                            transition-transform hover:scale-102 hover:border z-10 cursor-pointer`}
                          title={`${day} ${block.label}: ${DateTimeService.formatTime(cell.value)} (${cell.sessions} sessions)`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

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

  return (
    <Card variant="special">
      <CardHeader>
        <CardTitle>Productivity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex mb-2">
              <div className="w-12"></div>
              <div className="flex-1 grid grid-cols-24 gap-1">
                {hours.map(
                  (hour) =>
                    hour % 3 === 0 && (
                      <div
                        key={hour}
                        className="col-span-3 text-sm lg:text-lg font-normal text-center text-muted-foreground"
                      >
                        {hour}h
                      </div>
                    ),
                )}
              </div>
            </div>

            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-12 text-sm lg:text-lg text-muted-foreground pr-2">
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
                        className={`h-4 rounded-sm ${getColor(cell?.value || 0, desktopMaxValue)} 
                          transition-transform hover:scale-125 hover:border z-10 cursor-pointer`}
                        title={`${day} ${hour}h: ${DateTimeService.formatTime(cell?.value || 0)} (${cell?.sessions || 0} sessions)`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

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
