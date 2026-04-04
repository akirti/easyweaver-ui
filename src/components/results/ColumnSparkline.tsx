import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { getTypeCategory } from '@/lib/column-types';
import { cn } from '@/lib/utils';

interface ColumnSparklineProps {
  columnName: string;
  columnType: string;
  data: unknown[];
  width?: number;
  height?: number;
  className?: string;
}

const COLORS = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function buildNumericHistogram(data: unknown[]): { bin: string; count: number }[] {
  const values = data
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [{ bin: String(min), count: values.length }];
  }

  const binCount = 10;
  const binWidth = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, () => 0);

  for (const v of values) {
    let idx = Math.floor((v - min) / binWidth);
    if (idx >= binCount) idx = binCount - 1;
    bins[idx]++;
  }

  return bins.map((count, i) => ({
    bin: String(Math.round((min + i * binWidth) * 100) / 100),
    count,
  }));
}

function buildTextFrequency(data: unknown[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of data) {
    if (v == null) continue;
    const key = String(v);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

function buildBooleanData(data: unknown[]): { name: string; value: number }[] {
  let trueCount = 0;
  let falseCount = 0;
  for (const v of data) {
    if (v === true || v === 'true' || v === 1) trueCount++;
    else if (v === false || v === 'false' || v === 0) falseCount++;
  }
  return [
    { name: 'True', value: trueCount },
    { name: 'False', value: falseCount },
  ];
}

function buildDatetimeDensity(data: unknown[]): { month: string; count: number }[] {
  const monthCounts = new Map<string, number>();

  for (const v of data) {
    if (v == null) continue;
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }

  return Array.from(monthCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }));
}

function countUnique(data: unknown[]): number {
  return new Set(data.filter((v) => v != null).map(String)).size;
}

export function ColumnSparkline({
  columnName,
  columnType,
  data,
  width = 120,
  height = 40,
  className,
}: ColumnSparklineProps) {
  const category = getTypeCategory(columnType);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    switch (category) {
      case 'numeric':
        return { type: 'numeric' as const, data: buildNumericHistogram(data) };
      case 'text':
        return { type: 'text' as const, data: buildTextFrequency(data) };
      case 'boolean':
        return { type: 'boolean' as const, data: buildBooleanData(data) };
      case 'datetime':
        return { type: 'datetime' as const, data: buildDatetimeDensity(data) };
      default:
        return { type: 'other' as const, unique: countUnique(data) };
    }
  }, [data, category]);

  if (!chartData || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-xs text-muted-foreground', className)} style={{ width, height }}>
        No data
      </div>
    );
  }

  if (chartData.type === 'other') {
    return (
      <div
        className={cn('flex items-center justify-center text-xs text-muted-foreground', className)}
        style={{ width, height }}
        title={`${columnName}: ${chartData.unique} unique values`}
      >
        {chartData.unique} unique values
      </div>
    );
  }

  if (chartData.type === 'numeric') {
    if (chartData.data.length === 0) {
      return (
        <div className={cn('flex items-center justify-center text-xs text-muted-foreground', className)} style={{ width, height }}>
          No numeric data
        </div>
      );
    }
    return (
      <div className={className} style={{ width, height }} title={`${columnName} distribution`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Bar dataKey="count" fill="var(--primary)" radius={[1, 1, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartData.type === 'text') {
    if (chartData.data.length === 0) {
      return (
        <div className={cn('flex items-center justify-center text-xs text-muted-foreground', className)} style={{ width, height }}>
          No text data
        </div>
      );
    }
    return (
      <div className={className} style={{ width, height }} title={`${columnName} top values`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Bar dataKey="count" fill="var(--primary)" radius={[0, 1, 1, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartData.type === 'boolean') {
    return (
      <div className={className} style={{ width, height }} title={`${columnName} true/false`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={chartData.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={height * 0.2}
              outerRadius={height * 0.45}
              strokeWidth={0}
            >
              {chartData.data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartData.type === 'datetime') {
    if (chartData.data.length === 0) {
      return (
        <div className={cn('flex items-center justify-center text-xs text-muted-foreground', className)} style={{ width, height }}>
          No date data
        </div>
      );
    }
    return (
      <div className={className} style={{ width, height }} title={`${columnName} over time`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData.data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--primary)"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
