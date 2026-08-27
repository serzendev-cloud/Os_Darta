"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

export interface ActionItem {
  key: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  isDestructive?: boolean
  disabled?: boolean
}

interface MobileRowActionsProps {
  primaryAction?: ActionItem
  secondaryActions?: ActionItem[]
  className?: string
}

function MobileRowActions({ primaryAction, secondaryActions = [], className }: MobileRowActionsProps) {
  const hasSecondary = secondaryActions.length > 0

  return (
    <div data-slot="mobile-row-actions" className={cn("flex items-center gap-3", className)}>
      {/* Primary Action Button */}
      {primaryAction && (
        <Button
          type="button"
          size="sm"
          variant={primaryAction.variant || "default"}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="h-9 px-3 text-xs font-semibold gap-1.5"
        >
          {primaryAction.icon && <primaryAction.icon className="w-3.5 h-3.5" />}
          <span>{primaryAction.label}</span>
        </Button>
      )}

      {/* Overflow Secondary Actions via DropdownMenu */}
      {hasSecondary && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center size-9 rounded-lg border border-border/60 bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Aksi Lainnya"
          >
            <MoreVertical className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {secondaryActions.map((action) => {
              const ActionIcon = action.icon
              return (
                <DropdownMenuItem
                  key={action.key}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    "cursor-pointer text-xs font-medium gap-2 py-2",
                    action.isDestructive && "text-destructive focus:text-destructive"
                  )}
                >
                  {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
                  <span>{action.label}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export { MobileRowActions }
