import { Loader2, Pause, Play, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProgressState } from '@/hooks/use-progress-state';

interface QueryFetchProgressProps {
  state: ProgressState;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function QueryFetchProgress({ state, onPause, onResume, onCancel }: QueryFetchProgressProps) {
  const ds = state.datasets['query'];
  if (!ds) return null;

  const isFetching = ds.status === 'fetching' || ds.status === 'paused';
  const rowsPerSec = ds.batch_time_ms > 0
    ? ((ds.batch_size / ds.batch_time_ms) * 1000).toFixed(0)
    : '--';
  const batchTimeSec = ds.batch_time_ms > 0
    ? (ds.batch_time_ms / 1000).toFixed(1)
    : '--';

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
      {/* Top row: spinner + indeterminate progress bar */}
      <div className="flex items-center gap-2">
        <Loader2
          className={`h-4 w-4 ${ds.status !== 'paused' ? 'animate-spin' : ''} text-primary`}
        />
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full bg-primary ${
              ds.status !== 'paused' ? 'animate-pulse' : ''
            }`}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{ds.rows_fetched.toLocaleString()} rows</span>
        <span>|</span>
        <span>batch {ds.batch_number}</span>
        <span>|</span>
        <span>~{batchTimeSec}s/batch</span>
        <span>|</span>
        <span>~{rowsPerSec} rows/sec</span>
      </div>

      {/* Controls row */}
      {isFetching && (
        <div className="flex items-center gap-2">
          {ds.status === 'paused' ? (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onResume}>
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onPause}>
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>
            <XCircle className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      )}

      {/* Error display */}
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </div>
  );
}
