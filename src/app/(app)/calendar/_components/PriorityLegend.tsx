/**
 * @fileoverview Priority legend component for calendar
 */

export function PriorityLegend() {
  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-error"></div>
        <span>High Priority</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-warning"></div>
        <span>Medium Priority</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-success"></div>
        <span>Low Priority</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-info"></div>
        <span>No Priority</span>
      </div>
    </div>
  );
}
