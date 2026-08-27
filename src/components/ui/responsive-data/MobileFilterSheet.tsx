"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { FilterX } from "lucide-react"

interface MobileFilterSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  onApply?: () => void
  onReset?: () => void
  activeFilterCount?: number
}

function MobileFilterSheet({
  isOpen,
  onClose,
  title = "Filter Data",
  children,
  onApply,
  onReset,
  activeFilterCount = 0,
}: MobileFilterSheetProps) {
  const handleApply = () => {
    onApply?.()
    onClose()
  }

  const handleReset = () => {
    onReset?.()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl">
        <SheetHeader className="border-b border-border/40 pb-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <span>{title}</span>
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {activeFilterCount} Aktif
                </span>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>
        <SheetBody className="py-4 space-y-4 overflow-y-auto">
          {children}
        </SheetBody>
        <SheetFooter className="border-t border-border/40 pt-3 flex flex-row items-center gap-2">
          {onReset && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 h-10 text-xs font-semibold gap-1.5"
            >
              <FilterX className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Reset</span>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="flex-1 h-10 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
          >
            Terapkan Filter
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { MobileFilterSheet }
