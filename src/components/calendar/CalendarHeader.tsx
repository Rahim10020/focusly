/**
 * @fileoverview Calendar header component with month navigation
 */

'use client';

import { format } from 'date-fns';
import Button from '@/components/ui/Button';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({ currentDate, onPreviousMonth, onNextMonth, onToday }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPreviousMonth}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Button>
        <Button variant="outline" onClick={onToday}>
          Today
        </Button>
        <Button variant="outline" onClick={onNextMonth}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Button>
      </div>
    </div>
  );
}
