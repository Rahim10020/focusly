/**
 * @fileoverview Leaderboard pagination component
 */

"use client";

import Button from "@/components/ui/Button";
import ChevronLeftIcon from "@/components/shared/icons/ChevronLeftIcon";
import ChevronRightIcon from "@/components/shared/icons/ChevronRightIcon";

interface LeaderboardPaginationProps {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function LeaderboardPagination({
  currentPage,
  totalPages,
  loading,
  onPageChange,
}: LeaderboardPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
          size="sm"
        >
          <ChevronLeftIcon size={16} />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Desktop: show page numbers; Mobile: show current page indicator */}
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum =
              Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            if (pageNum > totalPages) return null;

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "primary" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                className="w-10 h-10"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Mobile: current page indicator */}
        <div className="flex sm:hidden items-center gap-2">
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <Button
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || loading}
          size="sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRightIcon size={16} />
        </Button>
      </div>
    </>
  );
}
