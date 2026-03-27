/**
 * @fileoverview Calendar header component with month navigation
 */

"use client";

import { format } from "date-fns";
import Button from "@/components/ui/Button";
import ChevronLeftIcon from "../shared/icons/ChevronLeftIcon";
import ChevronRightIcon from "../shared/icons/ChevronRightIcon";

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPreviousMonth}>
          <ChevronLeftIcon size={20} />
        </Button>
        <Button variant="outline" onClick={onToday}>
          Today
        </Button>
        <Button variant="outline" onClick={onNextMonth}>
          <ChevronRightIcon size={20} />
        </Button>
      </div>
    </div>
  );
}
