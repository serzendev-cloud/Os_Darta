"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveDataGridProps<T> {
  data: T[]
  keyExtractor: (item: T, index: number) => string | number
  renderDesktop: () => React.ReactNode
  renderMobile: (item: T, index: number) => React.ReactNode
  isLoading?: boolean
  emptyState?: React.ReactNode
  className?: string
  mobileBreakpoint?: "sm" | "md" | "lg"
}

function ResponsiveDataGrid<T>({
  data,
  keyExtractor,
  renderDesktop,
  renderMobile,
  isLoading = false,
  emptyState,
  className,
  mobileBreakpoint = "md",
}: ResponsiveDataGridProps<T>) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[200px] text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs">Memuat data...</span>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[160px] text-center border border-dashed border-border/60 rounded-xl bg-muted/20">
        {emptyState || <span className="text-xs text-muted-foreground">Tidak ada data untuk ditampilkan.</span>}
      </div>
    )
  }

  const hideMobileClass =
    mobileBreakpoint === "sm" ? "hidden sm:block" : mobileBreakpoint === "lg" ? "hidden lg:block" : "hidden md:block"
  const hideDesktopClass =
    mobileBreakpoint === "sm" ? "block sm:hidden" : mobileBreakpoint === "lg" ? "block lg:hidden" : "block md:hidden"

  return (
    <div data-slot="responsive-data-grid" className={cn("w-full space-y-4", className)}>
      {/* Desktop Table Presentation */}
      <div className={hideMobileClass}>{renderDesktop()}</div>

      {/* Mobile Card Presentation */}
      <div className={cn("flex flex-col gap-3.5", hideDesktopClass)}>
        {data.map((item, index) => (
          <React.Fragment key={keyExtractor(item, index)}>{renderMobile(item, index)}</React.Fragment>
        ))}
      </div>
    </div>
  )
}

export { ResponsiveDataGrid }
