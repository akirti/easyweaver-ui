import { useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Combine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQueryResults, useJoinResults, useQueryRun } from '@/queries/use-queries';
import { useQueryStore, type JoinStep } from '@/stores/query-store';
import { toast } from 'sonner';
import type { JoinConfig, JoinResultsRequest, ColumnInfo } from '@/types';

interface Props {
  stepIndex: number;
  leftRunId: string | null;
  rightRunId: string | null;
  leftLabel: string;
  rightLabel: string;
  joinStep: JoinStep;
}

export function JoinStepCard({
  stepIndex,
  leftRunId,
  rightRunId,
  leftLabel,
  rightLabel,
  joinStep,
}: Props) {
  const store = useQueryStore();
  const joinMutation = useJoinResults();

  // Fetch columns from left run result
  const { data: leftResults } = useQueryResults(leftRunId, { page: 1, page_size: 1 });
  const leftColumns: ColumnInfo[] = (leftResults?.columns || []).map((c) => ({
    name: c.name, type: c.type, nullable: true, primary_key: false,
  }));

  // Fetch columns from right run result
  const { data: rightResults } = useQueryResults(rightRunId, { page: 1, page_size: 1 });
  const rightColumns: ColumnInfo[] = (rightResults?.columns || []).map((c) => ({
    name: c.name, type: c.type, nullable: true, primary_key: false,
  }));

  // Poll join run status
  const { data: joinRun } = useQueryRun(joinStep.runId);
  useEffect(() => {
    if (!joinRun || !joinStep.runId) return;
    if (joinRun.status !== joinStep.status) {
      store.setJoinResult(
        stepIndex,
        joinStep.runId,
        joinRun.status as JoinStep['status'],
        joinRun.row_count,
        joinRun.error,
      );
    }
  }, [joinRun?.status, joinRun?.row_count]);

  const config = joinStep.config;

  const setConfig = (updates: Partial<JoinConfig>) => {
    store.setJoinConfig(stepIndex, {
      join_type: config?.join_type || 'inner',
      left_on: config?.left_on || '',
      right_on: config?.right_on || '',
      ...updates,
    });
  };

  const canJoin =
    !!leftRunId &&
    !!rightRunId &&
    !!config?.left_on &&
    !!config?.right_on &&
    joinStep.status !== 'pending' &&
    joinStep.status !== 'running';

  const joinRunning = joinStep.status === 'pending' || joinStep.status === 'running';

  const handleJoin = async () => {
    if (!leftRunId || !rightRunId || !config) return;

    const request: JoinResultsRequest = {
      left_run_id: leftRunId,
      right_run_id: rightRunId,
      join: config,
      filters: [],
      sort: [],
      transforms: [],
    };

    try {
      const run = await joinMutation.mutateAsync(request);
      store.setJoinResult(stepIndex, run.id, 'pending');
    } catch {
      toast.error('Failed to join datasets');
    }
  };

  // Type mismatch check
  const leftCol = leftColumns.find((c) => c.name === config?.left_on);
  const rightCol = rightColumns.find((c) => c.name === config?.right_on);
  const typeMismatch = leftCol && rightCol && leftCol.type !== rightCol.type;

  if (!leftRunId || !rightRunId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4 text-center text-sm text-muted-foreground">
          Run both datasets to configure this join
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <Label className="text-sm font-semibold">
          Join: {leftLabel} + {rightLabel}
        </Label>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Join Type</Label>
            <Select
              value={config?.join_type || 'inner'}
              onValueChange={(v) => setConfig({ join_type: v as JoinConfig['join_type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="inner">Inner Join</SelectItem>
                <SelectItem value="left">Left Join</SelectItem>
                <SelectItem value="right">Right Join</SelectItem>
                <SelectItem value="outer">Full Outer Join</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Left Key ({leftLabel})</Label>
            <Select
              value={config?.left_on || ''}
              onValueChange={(v) => setConfig({ left_on: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {leftColumns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Right Key ({rightLabel})</Label>
            <Select
              value={config?.right_on || ''}
              onValueChange={(v) => setConfig({ right_on: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {rightColumns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {typeMismatch && (
          <Badge variant="secondary" className="text-amber-600">
            Type mismatch: {leftCol.type} vs {rightCol.type} (will be auto-coerced to string)
          </Badge>
        )}

        <Button onClick={handleJoin} disabled={!canJoin} className="w-full">
          {joinRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <Combine className="mr-2 h-4 w-4" />
              Join Datasets
            </>
          )}
        </Button>

        {joinStep.status === 'completed' && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Joined: {joinStep.rowCount?.toLocaleString()} rows
          </span>
        )}
        {joinStep.status === 'failed' && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            {joinStep.error || 'Join failed'}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
