'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import type { TimeSeriesPoint, DistributionItem, TopNItem } from '@/hooks/useChartData';
import { cn } from '@/lib/utils';

// ─── Trend Chart (Area) ────────────────────────────────────────────

interface TrendChartProps {
  data: TimeSeriesPoint[];
  className?: string;
  height?: number;
  color?: string;
}

export function TrendChart({ data, className, height = 256, color = '#f59e0b' }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('h-64 flex items-center justify-center text-muted-foreground text-sm', className)}>
        Belum ada data tren
      </div>
    );
  }

  // Format date labels to show day-of-month
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date).getDate().toString(),
  }));

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`trendGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
            labelFormatter={(label) => `Tanggal ${label}`}
            formatter={(value) => [`${value} pelanggaran`, '']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
            fill={`url(#trendGradient-${color})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Donut Chart ────────────────────────────────────────────────────

interface DonutChartProps {
  data: DistributionItem[];
  className?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export function DonutChart({ data, className, height = 256, innerRadius = 55, outerRadius = 85 }: DonutChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('h-64 flex items-center justify-center text-muted-foreground text-sm', className)}>
        Belum ada data distribusi
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            nameKey="label"
          >
            {data.map((entry, i) => (
              <Cell key={entry.label} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
            formatter={(value, name) => [`${value}`, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Horizontal Bar Chart ───────────────────────────────────────────

interface HorizontalBarChartProps {
  data: TopNItem[];
  className?: string;
  height?: number;
  color?: string;
}

export function HorizontalBarChart({ data, className, height = 256, color = '#f59e0b' }: HorizontalBarChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('h-64 flex items-center justify-center text-muted-foreground text-sm', className)}>
        Belum ada data
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            domain={[0, maxValue]}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Distribution Bar Chart (Vertical) ─────────────────────────────

interface DistributionBarChartProps {
  data: DistributionItem[];
  className?: string;
  height?: number;
}

export function DistributionBarChart({ data, className, height = 256 }: DistributionBarChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('h-64 flex items-center justify-center text-muted-foreground text-sm', className)}>
        Belum ada data distribusi
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              fontSize: '12px',
            }}
          />
          {data.map((entry, i) => (
            <Bar key={entry.label} dataKey="value" fill={entry.color} radius={[4, 4, 0, 0]} barSize={32} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
