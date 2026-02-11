/**
 * @fileoverview Leaderboard pagination component
 */

'use client';

import Button from '@/components/ui/Button';

interface LeaderboardPaginationProps {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function LeaderboardPagination({ currentPage, totalPages, loading, onPageChange }: LeaderboardPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <>
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
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

        <Button
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || loading}
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </>
  );
}
