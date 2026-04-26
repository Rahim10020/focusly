/**
 * @fileoverview ScheduleDuration component — redesigned.
 */

import { useEffect, useMemo } from "react";
import Input from "@/components/ui/Input";
import {
  CalendarIcon,
  ClockIcon,
  ArrowRightLgIcon,
} from "@/components/shared/icons";
import { DateTimeService } from "@/lib/domain/services/DateTimeService";

interface ScheduleDurationProps {
  startDate: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  estimatedDuration: string;
  onStartDateChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Formate une durée en minutes (ex: "2h 30min" ou "45min")
 */
function formatDuration(minutes: number): string {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

/**
 * Calcule la durée en minutes entre deux heures (HH:mm)
 */
function calcDurationMinutes(start: string, end: string): number | null {
  if (!start || !end) return null;
  const result = DateTimeService.calculateTimeDuration(start, end);
  return result ? parseInt(result, 10) : null;
}

/**
 * Calcule la différence de jours entre deux dates
 */
function calcDaysDiff(start: string, due: string): number | null {
  if (!start || !due) return null;
  try {
    const diff = Math.round(
      (new Date(due).getTime() - new Date(start).getTime()) / 86_400_000,
    );
    return diff;
  } catch {
    return null;
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: string;
}) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
      {icon}
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="block text-[11px] text-muted-foreground mb-1">
      {children}
    </span>
  );
}

function HintText({
  children,
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <p
      className={`text-xs mt-2 min-h-4 transition-opacity ${
        children ? "opacity-100" : "opacity-0"
      } ${danger ? "text-destructive" : "text-muted-foreground"}`}
    >
      {children ?? "\u00A0"}
    </p>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ScheduleDuration({
  startDate,
  dueDate,
  startTime,
  endTime,
  estimatedDuration,
  onStartDateChange,
  onDueDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
}: ScheduleDurationProps) {
  const today = new Date().toISOString().split("T")[0];

  // Auto-calculate duration from times
  useEffect(() => {
    const minutes = calcDurationMinutes(startTime, endTime);
    if (minutes !== null && minutes > 0) {
      onDurationChange(minutes.toString());
    } else if (startTime && endTime) {
      onDurationChange("");
    }
  }, [startTime, endTime, onDurationChange]);

  // Derived display values
  const durationMinutes = useMemo(
    () => (estimatedDuration ? parseInt(estimatedDuration, 10) : null),
    [estimatedDuration],
  );

  const durationLabel =
    durationMinutes && durationMinutes > 0
      ? formatDuration(durationMinutes)
      : "-- : --";

  const daysDiff = useMemo(
    () => calcDaysDiff(startDate, dueDate),
    [startDate, dueDate],
  );

  const dateHint = useMemo(() => {
    if (!startDate && !dueDate) return null;
    if (daysDiff === null) return null;
    if (daysDiff < 0)
      return { text: "La date de fin est avant le début", danger: true };
    if (daysDiff === 0) return { text: "Même jour", danger: false };
    return {
      text: `${daysDiff} jour${daysDiff > 1 ? "s" : ""}`,
      danger: false,
    };
  }, [startDate, dueDate, daysDiff]);

  const showDurationInput = durationMinutes !== null && durationMinutes > 0;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">
        Schedule & Duration
      </h3>

      <div className="rounded-xl border border-border overflow-hidden bg-background">
        {/* ── Zone 1 : Période ── */}
        <div className="px-5 py-4 border-b border-border">
          <SectionLabel
            icon={<CalendarIcon size={13} className="text-muted-foreground" />}
          >
            Période
          </SectionLabel>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FieldLabel>Début</FieldLabel>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                min={today}
                className="bg-muted/40 border-border w-full"
              />
            </div>

            <div className="pb-2.5 shrink-0">
              <ArrowRightLgIcon size={16} className="text-muted-foreground" />
            </div>

            <div className="flex-1">
              <FieldLabel>Fin</FieldLabel>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => onDueDateChange(e.target.value)}
                min={startDate || today}
                className="bg-muted/40 border-border w-full"
              />
            </div>
          </div>

          <HintText danger={dateHint?.danger}>{dateHint?.text}</HintText>
        </div>

        {/* ── Zone 2 : Créneau ── */}
        <div className="px-5 py-4">
          <SectionLabel
            icon={<ClockIcon size={13} className="text-muted-foreground" />}
          >
            Créneau
          </SectionLabel>

          <div className="flex items-end gap-3">
            {/* Start time */}
            <div className="flex-1">
              <FieldLabel>Début</FieldLabel>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className="bg-muted/40 border-border w-full"
              />
            </div>

            {/* Duration badge */}
            <div className="shrink-0 pb-1.5">
              <span
                className={`
                  inline-flex items-center justify-center
                  px-3.5 py-1.5 rounded-full text-sm font-medium
                  border transition-all duration-200 min-w-20
                  ${
                    showDurationInput
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-muted/40 border-border text-muted-foreground"
                  }
                `}
              >
                {durationLabel}
              </span>
            </div>

            {/* End time */}
            <div className="flex-1">
              <FieldLabel>Fin</FieldLabel>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="bg-muted/40 border-border w-full"
              />
            </div>
          </div>

          {/* Editable minutes field — shown only when duration is set */}
          {showDurationInput && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Durée (min)</span>
              <Input
                type="number"
                value={estimatedDuration}
                onChange={(e) => onDurationChange(e.target.value)}
                min="0"
                placeholder="60"
                className="w-20 bg-muted/40 border-border text-sm"
              />
              <span className="text-xs text-muted-foreground">
                {estimatedDuration &&
                  `= ${formatDuration(parseInt(estimatedDuration, 10))}`}
              </span>
            </div>
          )}

          <HintText>
            {showDurationInput ? `${estimatedDuration} minutes au total` : null}
          </HintText>
        </div>
      </div>
    </div>
  );
}
