import { Clock, Loader2, Pause, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DatasetProgress as DatasetProgressType } from '@/hooks/use-progress-state';

interface DatasetProgressProps {
  datasets: Record<string, DatasetProgressType>;
  runId: string | null;
  onPreview: (datasetKey: string) => void;
}

const STATUS_CONFIG: Record<
  DatasetProgressType['status'],
  { icon: React.ElementType; className: string; spin?: boolean }
> = {
  waiting: { icon: Clock, className: 'text-yellow-500' },
  fetching: { icon: Loader2, className: 'text-blue-500', spin: true },
  paused: { icon: Pause, className: 'text-orange-500' },
  completed: { icon: CheckCircle2, className: 'text-green-500' },
  failed: { icon: XCircle, className: 'text-red-500' },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `~${(ms / 1000).toFixed(1)}s`;
}

function formatRowCount(fetched: number, total: number | null): string {
  const fmtFetched = fetched.toLocaleString();
  if (total !== null && total > 0) {
    return `${fmtFetched}/${total.toLocaleString()} rows`;
  }
  return `${fmtFetched} rows`;
}

export function DatasetProgress({ datasets, runId, onPreview }: DatasetProgressProps) {
  const entries = Object.entries(datasets);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Datasets
      </h4>
      <div className="space-y-1.5">
        {entries.map(([key, ds]) => {
          const config = STATUS_CONFIG[ds.status];
          const Icon = config.icon;
          const canPreview =
            runId &&
            (ds.status === 'completed' || (ds.status === 'fetching' && ds.rows_fetched > 0));

          // Progress percentage (only during fetching)
          const showProgress = ds.status === 'fetching';
          const pct =
            ds.total_rows !== null && ds.total_rows > 0
              ? Math.min(100, (ds.rows_fetched / ds.total_rows) * 100)
              : null;

          return (
            <div
              key={key}
              className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
            >
              {/* Status icon */}
              <Icon
                className={`h-4 w-4 shrink-0 ${config.className} ${config.spin ? 'animate-spin' : ''}`}
              />

              {/* Dataset name */}
              <span className="min-w-0 shrink-0 font-medium">{key}</span>

              {/* Progress bar */}
              {showProgress && (
                <div className="mx-2 h-2 min-w-[80px] flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  {pct !== null ? (
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-full bg-blue-300 dark:bg-blue-700" />
                  )}
                </div>
              )}

              {/* Row count */}
              {ds.rows_fetched > 0 && (
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatRowCount(ds.rows_fetched, ds.total_rows)}
                </span>
              )}

              {/* Batch info */}
              {ds.batch_number > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  batch {ds.batch_number}
                </span>
              )}
              {ds.batch_time_ms > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDuration(ds.batch_time_ms)}
                </span>
              )}

              {/* Preview button */}
              {canPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 px-2 text-xs"
                  onClick={() => onPreview(key)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  Preview
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
