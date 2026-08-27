"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface MobileCardStackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

function MobileCardStack({ children, className, ...props }: MobileCardStackProps) {
  return (
    <div
      data-slot="mobile-card-stack"
      className={cn("flex flex-col gap-3.5 sm:gap-4 md:hidden", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

function MobileCard({ children, className, ...props }: MobileCardProps) {
  return (
    <Card
      data-slot="mobile-card"
      className={cn(
        "border-amber-500/20 dark:border-amber-500/15 bg-card/90 shadow-sm transition-all active:scale-[0.995] overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

function MobileCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardHeader
      data-slot="mobile-card-header"
      className={cn("flex flex-row items-center justify-between p-3.5 pb-2 space-y-0 gap-2", className)}
      {...props}
    />
  )
}

function MobileCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="mobile-card-title"
      className={cn("text-sm font-bold text-foreground truncate flex-1", className)}
      {...props}
    />
  )
}

function MobileCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardContent
      data-slot="mobile-card-content"
      className={cn("p-3.5 pt-1 text-xs space-y-1.5 text-muted-foreground", className)}
      {...props}
    />
  )
}

function MobileCardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <CardFooter
      data-slot="mobile-card-footer"
      className={cn("flex items-center justify-between p-3.5 pt-2 border-t border-border/40 gap-2", className)}
      {...props}
    />
  )
}

export {
  MobileCardStack,
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardContent,
  MobileCardFooter,
}
