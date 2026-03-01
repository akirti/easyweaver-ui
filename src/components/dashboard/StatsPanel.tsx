import { useState } from 'react';
import { RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { TableStatsCard } from './TableStatsCard';
import { useDashboardStats, useRefreshDashboardStats } from '@/queries/use-dashboard';
import type { DashboardConfig } from '@/types';

interface StatsPanelProps {
  config: DashboardConfig;
}

type TimeRange = '1h' | '3h' | '24h' | 'total';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function StatsPanel({ config }: StatsPanelProps) {
  const [autoRefresh, setAutoRefresh] = useState(config.is_active);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');

  const { data: stats, isLoading } = useDashboardStats(
    config.id,
    autoRefresh ? config.refresh_interval_minutes : undefined
  );
  const refreshMutation = useRefreshDashboardStats(config.id);

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '1h', label: '1h' },
    { value: '3h', label: '3h' },
    { value: '24h', label: '24h' },
    { value: 'total', label: 'Total' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{config.name}</h3>
          {stats && (
            <Badge variant="outline">
              {stats.source_type}
            </Badge>
          )}
          {stats && (
            <span className="flex items-center gap-1.5 text-sm">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  stats.connection_healthy ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              {stats.connection_healthy ? 'Connected' : 'Disconnected'}
            </span>
          )}
        </div>
        {stats && (
          <span className="text-xs text-muted-foreground">
            Last refreshed: {formatRelativeTime(stats.captured_at)}
          </span>
        )}
      </div>

      {/* Connection unhealthy warning */}
      {stats && !stats.connection_healthy && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Connection to the data source is unhealthy. Stats may be stale.
        </div>
      )}

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <div className="flex items-center gap-2">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
          <Label htmlFor="auto-refresh" className="text-sm font-normal">
            Auto-refresh ({config.refresh_interval_minutes}min)
          </Label>
        </div>

        <div className="flex items-center rounded-md border">
          {timeRanges.map((tr) => (
            <button
              key={tr.value}
              onClick={() => setTimeRange(tr.value)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === tr.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              } first:rounded-l-md last:rounded-r-md`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        {stats && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            {stats.tables.length} table{stats.tables.length !== 1 ? 's' : ''} monitored
          </span>
        )}
      </div>

      {/* Table stats grid */}
      {stats && stats.tables.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.tables.map((table) => (
            <TableStatsCard
              key={table.table_name}
              stats={table}
              highlightRange={timeRange}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No stats available yet. Click Refresh to capture initial data.
        </div>
      )}
    </div>
  );
}
