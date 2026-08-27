"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal } from "lucide-react"
import { MobileFilterSheet } from "./MobileFilterSheet"

interface ResponsiveFilterBarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filterContent?: React.ReactNode
  activeFilterCount?: number
  onApplyFilters?: () => void
  onResetFilters?: () => void
  className?: string
  children?: React.ReactNode
}

function ResponsiveFilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filterContent,
  activeFilterCount = 0,
  onApplyFilters,
  onResetFilters,
  className,
  children,
}: ResponsiveFilterBarProps) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false)

  return (
    <div data-slot="responsive-filter-bar" className={cn("w-full space-y-2.5 mb-4", className)}>
      {/* Mobile Filter Header: Search Input + Filter Button Trigger */}
      <div className="flex items-center gap-2 md:hidden">
        {onSearchChange && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 pr-3 h-[var(--density-control-height,2.5rem)] text-base"
            />
          </div>
        )}
        {filterContent && (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setIsFilterSheetOpen(true)}
            className="relative shrink-0 gap-1.5 h-[var(--density-control-height,2.5rem)] px-3 border-amber-500/30"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-[10px] font-extrabold rounded-full bg-amber-500 text-white shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Desktop Filter Header: Inline Search + Inline Dropdowns */}
      <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between gap-3">
        {onSearchChange && (
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 pr-3 h-[var(--density-control-height,2rem)] text-sm"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          {filterContent}
          {children}
        </div>
      </div>

      {/* Mobile Filter Sheet Drawer */}
      {filterContent && (
        <MobileFilterSheet
          isOpen={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          activeFilterCount={activeFilterCount}
          onApply={onApplyFilters}
          onReset={onResetFilters}
        >
          {filterContent}
        </MobileFilterSheet>
      )}
    </div>
  )
}

export { ResponsiveFilterBar }
