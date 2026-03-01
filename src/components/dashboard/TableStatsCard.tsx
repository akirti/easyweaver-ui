import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Columns3, HardDrive } from 'lucide-react';
import type { TableStats } from '@/types';

interface TableStatsCardProps {
  stats: TableStats;
  highlightRange: '1h' | '3h' | '24h' | 'total';
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

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

function ChangeIndicator({ value, highlighted }: { value: number | null; highlighted?: boolean }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">--</span>;
  }
  if (value === 0) {
    return <span className="text-muted-foreground">0</span>;
  }
  return (
    <span className={`font-medium ${highlighted ? 'text-green-600 dark:text-green-400' : 'text-green-600 dark:text-green-400'}`}>
      +{formatNumber(value)}
    </span>
  );
}

export function TableStatsCard({ stats, highlightRange }: TableStatsCardProps) {
  const hasRecentChanges =
    (stats.changes_1h && stats.changes_1h > 0) ||
    (stats.changes_3h && stats.changes_3h > 0) ||
    (stats.changes_24h && stats.changes_24h > 0);

  return (
    <Card className={hasRecentChanges ? 'border-green-200 dark:border-green-900' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{stats.table_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">{formatNumber(stats.current_row_count)}</div>
        <div className="text-xs text-muted-foreground">total rows</div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className={`rounded-md p-1.5 ${highlightRange === '1h' ? 'bg-accent' : ''}`}>
            <div className="text-xs text-muted-foreground">1h</div>
            <ChangeIndicator value={stats.changes_1h} highlighted={highlightRange === '1h'} />
          </div>
          <div className={`rounded-md p-1.5 ${highlightRange === '3h' ? 'bg-accent' : ''}`}>
            <div className="text-xs text-muted-foreground">3h</div>
            <ChangeIndicator value={stats.changes_3h} highlighted={highlightRange === '3h'} />
          </div>
          <div className={`rounded-md p-1.5 ${highlightRange === '24h' ? 'bg-accent' : ''}`}>
            <div className="text-xs text-muted-foreground">24h</div>
            <ChangeIndicator value={stats.changes_24h} highlighted={highlightRange === '24h'} />
          </div>
        </div>

        <div className="space-y-1 border-t pt-2 text-xs text-muted-foreground">
          <div>
            {stats.last_modified_at
              ? `Last change: ${formatRelativeTime(stats.last_modified_at)}${stats.last_modified_by ? ` by ${stats.last_modified_by}` : ''}`
              : 'Last change: N/A'}
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Columns3 className="h-3 w-3" />
              {stats.column_count} columns
            </span>
            {stats.size_bytes !== null && (
              <Badge variant="outline" className="text-xs font-normal">
                <HardDrive className="mr-1 h-3 w-3" />
                {formatBytes(stats.size_bytes)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
