"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Button from "@/components/ui/Button";

export interface ExportOptions {
  includeStats: boolean;
  includeCharts: boolean;
  includeInsights: boolean;
  includeTasks: boolean;
  timeRange: string;
  format: "detailed" | "summary";
}

interface ExportPDFModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export default function ExportPDFModal({
  open,
  onClose,
  onExport,
}: ExportPDFModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    includeStats: true,
    includeCharts: true,
    includeInsights: true,
    includeTasks: false,
    timeRange: "30days",
    format: "detailed",
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(options);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Customize PDF Export"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Generate PDF"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Sections to include */}
        <div className="space-y-3">
          <label className="text-base font-semibold block">
            Sections to Include
          </label>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="stats"
              checked={options.includeStats}
              onChange={(e) =>
                setOptions({ ...options, includeStats: e.target.checked })
              }
              className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <label htmlFor="stats" className="text-sm cursor-pointer">
              General Statistics
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="charts"
              checked={options.includeCharts}
              onChange={(e) =>
                setOptions({ ...options, includeCharts: e.target.checked })
              }
              className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <label htmlFor="charts" className="text-sm cursor-pointer">
              Productivity Charts
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="insights"
              checked={options.includeInsights}
              onChange={(e) =>
                setOptions({ ...options, includeInsights: e.target.checked })
              }
              className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <label htmlFor="insights" className="text-sm cursor-pointer">
              Insights & Recommendations
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="tasks"
              checked={options.includeTasks}
              onChange={(e) =>
                setOptions({ ...options, includeTasks: e.target.checked })
              }
              className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            <label htmlFor="tasks" className="text-sm cursor-pointer">
              Recent Tasks List
            </label>
          </div>
        </div>

        {/* Time Range */}
        <div className="space-y-2">
          <label htmlFor="timeRange" className="text-base font-semibold block">
            Time Range
          </label>
          <select
            id="timeRange"
            value={options.timeRange}
            onChange={(e) =>
              setOptions({ ...options, timeRange: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="thisMonth">This month</option>
            <option value="lastMonth">Last month</option>
            <option value="thisYear">This year</option>
          </select>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <label className="text-base font-semibold block">Report Format</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="detailed"
                name="format"
                value="detailed"
                checked={options.format === "detailed"}
                onChange={() => setOptions({ ...options, format: "detailed" })}
                className="w-4 h-4 border-border bg-background text-primary focus:ring-primary"
              />
              <label htmlFor="detailed" className="text-sm cursor-pointer">
                Detailed (all information)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="summary"
                name="format"
                value="summary"
                checked={options.format === "summary"}
                onChange={() => setOptions({ ...options, format: "summary" })}
                className="w-4 h-4 border-border bg-background text-primary focus:ring-primary"
              />
              <label htmlFor="summary" className="text-sm cursor-pointer">
                Summary (concise overview)
              </label>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
