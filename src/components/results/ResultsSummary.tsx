import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getTypeCategory, type TypeCategory } from '@/lib/column-types';
import { cn } from '@/lib/utils';
import type { QueryResults } from '@/types';

interface ResultsSummaryProps {
  results: QueryResults;
  className?: string;
}

const TYPE_COLORS: Record<TypeCategory, string> = {
  numeric: 'var(--primary)',
  text: 'var(--chart-2)',
  datetime: 'var(--chart-3)',
  boolean: 'var(--chart-4)',
  other: 'var(--chart-5)',
};

function getNullPercentage(
  rows: Record<string, unknown>[],
  columnName: string
): number {
  if (rows.length === 0) return 0;
  const nullCount = rows.filter(
    (row) => row[columnName] === null || row[columnName] === undefined
  ).length;
  return (nullCount / rows.length) * 100;
}

function getNullBarColor(percentage: number): string {
  if (percentage <= 10) return 'var(--chart-2)';
  if (percentage <= 30) return 'var(--chart-3)';
  if (percentage <= 60) return 'var(--chart-4)';
  return 'var(--chart-5)';
}

export function ResultsSummary({ results, className }: ResultsSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  const typeCounts = useMemo(() => {
    const counts: Record<TypeCategory, number> = {
      numeric: 0,
      text: 0,
      datetime: 0,
      boolean: 0,
      other: 0,
    };
    for (const col of results.columns) {
      counts[getTypeCategory(col.type)]++;
    }
    return counts;
  }, [results.columns]);

  const typeBreakdownText = useMemo(() => {
    const parts: string[] = [];
    for (const [cat, count] of Object.entries(typeCounts)) {
      if (count > 0) parts.push(`${count} ${cat}`);
    }
    return parts.join(', ');
  }, [typeCounts]);

  const typeCompositionData = useMemo(() => {
    return Object.entries(typeCounts)
      .filter(([, count]) => count > 0)
      .map(([category, count]) => ({
        name: category,
        value: count,
        fill: TYPE_COLORS[category as TypeCategory],
      }));
  }, [typeCounts]);

  const nullPercentages = useMemo(() => {
    return results.columns.map((col) => ({
      name: col.name,
      percentage: getNullPercentage(results.rows, col.name),
    }));
  }, [results.columns, results.rows]);

  return (
    <div className={cn('border rounded-lg', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="w-full flex items-center justify-between px-3 py-2 h-auto"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        data-testid="summary-toggle"
      >
        <span className="text-sm font-medium">Results Summary</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {expanded && (
        <div className="px-3 pb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="summary-content">
          {/* Total rows */}
          <Card className="py-3">
            <CardContent className="px-4 py-0">
              <p className="text-xs text-muted-foreground">Total Rows</p>
              <p className="text-xl font-semibold" data-testid="total-rows">
                {results.total.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Columns breakdown */}
          <Card className="py-3">
            <CardContent className="px-4 py-0">
              <p className="text-xs text-muted-foreground">Columns</p>
              <p className="text-xl font-semibold">{results.columns.length}</p>
              <p className="text-xs text-muted-foreground mt-1" data-testid="type-breakdown">
                {typeBreakdownText}
              </p>
            </CardContent>
          </Card>

          {/* Null percentage heatmap */}
          <Card className="py-3">
            <CardContent className="px-4 py-0">
              <p className="text-xs text-muted-foreground mb-2">Null Percentage</p>
              <div className="space-y-1 max-h-32 overflow-y-auto" data-testid="null-heatmap">
                {nullPercentages.map((col) => (
                  <div key={col.name} className="flex items-center gap-2 text-xs">
                    <span className="w-20 truncate text-muted-foreground" title={col.name}>
                      {col.name}
                    </span>
                    <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-all"
                        style={{
                          width: `${Math.max(col.percentage, 0)}%`,
                          backgroundColor: getNullBarColor(col.percentage),
                        }}
                      />
                    </div>
                    <span className="w-10 text-right tabular-nums">
                      {col.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Type composition pie chart */}
          <Card className="py-3">
            <CardContent className="px-4 py-0">
              <p className="text-xs text-muted-foreground mb-1">Type Composition</p>
              {typeCompositionData.length > 0 ? (
                <div style={{ width: '100%', height: 100 }} data-testid="type-composition-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeCompositionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        strokeWidth={0}
                      >
                        {typeCompositionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No columns</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
