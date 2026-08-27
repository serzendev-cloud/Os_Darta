"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ResponsivePaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  onPageChange: (page: number) => void
  className?: string
}

function ResponsivePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  className,
}: ResponsivePaginationProps) {
  if (totalPages <= 1) return null

  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  return (
    <nav
      aria-label="Navigasi Halaman"
      data-slot="responsive-pagination"
      className={cn("flex items-center justify-between py-3 px-1 text-xs border-t border-border/40 gap-2", className)}
    >
      {/* Total item indicator */}
      <div className="hidden sm:block text-muted-foreground font-medium">
        {totalItems !== undefined ? (
          <span>Total <strong>{totalItems}</strong> data ({totalPages} halaman)</span>
        ) : (
          <span>Halaman {currentPage} dari {totalPages}</span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        {/* Previous Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className="h-9 px-3 gap-1 text-xs font-semibold"
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>

        {/* Compact Page Indicator */}
        <span className="text-xs font-bold text-foreground sm:px-2">
          {currentPage} / {totalPages}
        </span>

        {/* Next Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className="h-9 px-3 gap-1 text-xs font-semibold"
          aria-label="Halaman Selanjutnya"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </nav>
  )
}

export { ResponsivePagination }
