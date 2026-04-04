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
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getTypeCategory } from '@/lib/column-types';

interface QuickChartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnName: string;
  columnType: string;
  data: unknown[];
}

const COLORS = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function buildHistogram(data: unknown[]): { bin: string; count: number }[] {
  const values = data.filter(
    (v): v is number => typeof v === 'number' && !Number.isNaN(v)
  );

  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return [{ bin: String(min), count: values.length }];
  }

  const binCount = 20;
  const binWidth = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, () => 0);

  for (const v of values) {
    let idx = Math.floor((v - min) / binWidth);
    if (idx >= binCount) idx = binCount - 1;
    bins[idx]++;
  }

  return bins.map((count, i) => {
    const lo = Math.round((min + i * binWidth) * 100) / 100;
    const hi = Math.round((min + (i + 1) * binWidth) * 100) / 100;
    return { bin: `${lo}-${hi}`, count };
  });
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
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));
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

export function QuickChart({
  open,
  onOpenChange,
  columnName,
  columnType,
  data,
}: QuickChartProps) {
  const category = getTypeCategory(columnType);

  const chartContent = useMemo(() => {
    if (!data || data.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>;
    }

    switch (category) {
      case 'numeric': {
        const histData = buildHistogram(data);
        if (histData.length === 0) {
          return <p className="text-sm text-muted-foreground text-center py-8">No numeric values found</p>;
        }
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={histData} margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Frequency" fill="var(--primary)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'text': {
        const freqData = buildTextFrequency(data);
        if (freqData.length === 0) {
          return <p className="text-sm text-muted-foreground text-center py-8">No text values found</p>;
        }
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={freqData} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Frequency" fill="var(--primary)" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }

      case 'datetime': {
        const densityData = buildDatetimeDensity(data);
        if (densityData.length === 0) {
          return <p className="text-sm text-muted-foreground text-center py-8">No valid dates found</p>;
        }
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={densityData} margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="Count"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      }

      case 'boolean': {
        const boolData = buildBooleanData(data);
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={boolData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                strokeWidth={1}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {boolData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      }

      default:
        return (
          <p className="text-sm text-muted-foreground text-center py-8">
            Chart not available for this column type ({columnType})
          </p>
        );
    }
  }, [data, category, columnType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Distribution of {columnName}</DialogTitle>
          <DialogDescription>
            Showing {category} distribution for column &quot;{columnName}&quot; ({columnType})
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-[300px]" data-testid="quick-chart-content">
          {chartContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
