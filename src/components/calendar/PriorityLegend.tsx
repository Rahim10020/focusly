/**
 * @fileoverview Priority legend component for calendar
 */

export function PriorityLegend() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <span>High Priority</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <span>Medium Priority</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span>Low Priority</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        <span>No Priority</span>
      </div>
    </div>
  );
}
