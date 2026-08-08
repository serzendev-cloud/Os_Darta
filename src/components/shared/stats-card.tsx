'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
  iconClassName?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, className, iconClassName }: StatsCardProps) {
  return (
    <Card className={cn(
      'relative overflow-hidden cursor-default border border-amber-500/20 dark:border-amber-500/30',
      'transition-[transform,box-shadow,background-color,border-color] duration-300',
      'hover:shadow-lg hover:border-amber-500/50',
      'bg-gradient-to-br from-emerald-950/5 via-stone-50 to-amber-500/5 dark:from-emerald-950/20 dark:via-stone-900/60 dark:to-stone-950/90',
      'motion-safe:hover:-translate-y-0.5',
      'before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-amber-500/60 before:to-transparent',
      className,
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {/* Title: slightly more visible in dark mode for readability */}
        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/90">
          {title}
        </CardTitle>
        {/* Icon container: softer dark-mode background for premium softness */}
        <div className={cn(
          'flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10',
          'dark:bg-primary/10 dark:ring-1 dark:ring-primary/20',
          iconClassName,
        )}>
          <Icon aria-hidden="true" className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Value: slightly enhanced weight for dark-mode pop */}
        <div className="text-2xl font-bold tracking-tight dark:text-foreground/95">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span className={cn(
              'text-xs font-medium',
              trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
