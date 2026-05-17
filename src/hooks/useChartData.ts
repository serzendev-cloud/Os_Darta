'use client';

import { useMemo } from 'react';

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface DistributionItem {
  label: string;
  value: number;
  color: string;
}

export interface TopNItem {
  label: string;
  value: number;
}

// ─── Color Palette ─────────────────────────────────────────────────

const CHART_COLORS = [
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// ─── Time Series Aggregation ────────────────────────────────────────

export function useTimeSeries<T>(
  data: T[],
  dateKey: keyof T,
  days = 30
): TimeSeriesPoint[] {
  return useMemo(() => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Initialize all days with 0
    const dateMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap.set(key, 0);
    }

    // Count occurrences per day
    for (const item of data) {
      const raw = item[dateKey];
      if (raw == null) continue;
      const dateStr = typeof raw === 'string' ? raw.split('T')[0] : '';
      if (dateStr && dateMap.has(dateStr)) {
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    }

    return Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));
  }, [data, dateKey, days]);
}

// ─── Distribution Aggregation ──────────────────────────────────────

export function useDistribution<T>(
  data: T[],
  key: keyof T,
  labelMap?: Record<string, string>
): DistributionItem[] {
  return useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of data) {
      const raw = item[key];
      if (raw == null) continue;
      const val = String(raw).toLowerCase().replace(/\s+/g, '_');
      counts.set(val, (counts.get(val) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label: labelMap?.[label] ?? label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
        color: getChartColor(i),
      }));
  }, [data, key, labelMap]);
}

// ─── Top N ──────────────────────────────────────────────────────────

export function useTopN<T>(
  data: T[],
  key: keyof T,
  n = 5,
  labelKey?: keyof T
): TopNItem[] {
  return useMemo(() => {
    return [...data]
      .sort((a, b) => {
        const aVal = Number(b[key]) || 0;
        const bVal = Number(a[key]) || 0;
        return aVal - bVal;
      })
      .slice(0, n)
      .map((item) => ({
        label: labelKey ? String(item[labelKey] ?? '') : '',
        value: Number(item[key]) || 0,
      }));
  }, [data, key, n, labelKey]);
}

// ─── Aggregation Utility ───────────────────────────────────────────

export function useAggregation<T>(
  data: T[],
  filterFn: (item: T) => boolean
): number {
  return useMemo(() => data.filter(filterFn).length, [data, filterFn]);
}
