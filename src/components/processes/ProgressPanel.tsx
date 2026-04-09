import { useState, useMemo } from 'react';
import { XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PhaseIndicator } from './PhaseIndicator';
import { DatasetProgress } from './DatasetProgress';
import { BatchControls } from './BatchControls';
import { DatasetPreview } from './DatasetPreview';
import type { ProgressState } from '@/hooks/use-progress-state';

interface ProgressPanelProps {
  state: ProgressState;
  onPause: () => void;
  onResume: () => void;
  onSetBatchSize: (size: number) => void;
  onSetTargetSeconds: (seconds: number) => void;
  onCancel: () => void;
  runId: string | null;
}

export function ProgressPanel({
  state,
  onPause,
  onResume,
  onSetBatchSize,
  onSetTargetSeconds,
  onCancel,
  runId,
}: ProgressPanelProps) {
  const [previewDataset, setPreviewDataset] = useState<string | null>(null);

  // Compute batch stats from the latest dataset progress
  const batchStats = useMemo(() => {
    const entries = Object.values(state.datasets);
    let latestBatchTime: number | undefined;
    let latestRowsPerSec: number | undefined;

    for (const ds of entries) {
      if (ds.batch_time_ms > 0 && ds.batch_size > 0) {
        latestBatchTime = ds.batch_time_ms;
        latestRowsPerSec = (ds.batch_size / ds.batch_time_ms) * 1000;
      }
    }

    return { latestBatchTime, latestRowsPerSec };
  }, [state.datasets]);

  const isFetchPhase = state.phase === 'fetching';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
              Running Process
            </Badge>
            {state.runId && (
              <span className="text-xs text-muted-foreground">
                Run: {state.runId.slice(0, 8)}...
              </span>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onCancel}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            Cancel
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Phase indicator */}
          <PhaseIndicator
            phase={state.phase}
            phaseIndex={state.phaseIndex}
            totalPhases={state.totalPhases}
          />

          {/* Dataset progress list */}
          <DatasetProgress
            datasets={state.datasets}
            runId={runId}
            onPreview={(key) => setPreviewDataset(key)}
          />

          {/* Batch controls — only during fetch phase */}
          {isFetchPhase && (
            <BatchControls
              paused={state.paused}
              adaptiveEnabled={state.adaptiveEnabled}
              batchSizeOverride={state.batchSizeOverride}
              targetSeconds={state.targetSeconds}
              onPause={onPause}
              onResume={onResume}
              onSetBatchSize={onSetBatchSize}
              onSetTargetSeconds={onSetTargetSeconds}
              currentBatchTime={batchStats.latestBatchTime}
              currentRowsPerSec={batchStats.latestRowsPerSec}
            />
          )}

          {/* Join progress */}
          {state.joinStep && (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
              <span className="font-medium">Join:</span>{' '}
              {state.joinStep.left} + {state.joinStep.right}{' '}
              <Badge variant="outline" className="ml-1 text-xs">
                {state.joinStep.status}
              </Badge>
              {state.joinStep.rows !== null && (
                <span className="ml-2 text-muted-foreground">
                  {state.joinStep.rows.toLocaleString()} rows
                </span>
              )}
            </div>
          )}

          {/* Transform progress */}
          {state.transformStep && (
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
              <span className="font-medium">Transform:</span>{' '}
              {state.transformStep.operation}{' '}
              <span className="text-muted-foreground">
                (step {state.transformStep.step}/{state.transformStep.totalSteps})
              </span>
            </div>
          )}

          {/* Error display */}
          {state.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {state.error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dataset preview dialog */}
      {previewDataset && runId && (
        <DatasetPreview
          runId={runId}
          datasetKey={previewDataset}
          open={!!previewDataset}
          onClose={() => setPreviewDataset(null)}
        />
      )}
    </>
  );
}
