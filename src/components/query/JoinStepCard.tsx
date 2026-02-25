import { useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Combine, Plus, Trash2 } from 'lucide-react';
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

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [''];
  if (Array.isArray(val)) return val.length > 0 ? val : [''];
  return [val];
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
        true,
      );
    }
  }, [joinRun?.status, joinRun?.row_count]);

  const config = joinStep.config;

  // Normalize to arrays for multi-pair UI
  const leftKeys = toArray(config?.left_on);
  const rightKeys = toArray(config?.right_on);
  const pairCount = Math.max(leftKeys.length, rightKeys.length);
  const pairs = Array.from({ length: pairCount }, (_, i) => ({
    left: leftKeys[i] || '',
    right: rightKeys[i] || '',
  }));

  const emitConfig = (newPairs: { left: string; right: string }[], joinType?: JoinConfig['join_type']) => {
    store.setJoinConfig(stepIndex, {
      join_type: joinType || config?.join_type || 'inner',
      left_on: newPairs.map((p) => p.left),
      right_on: newPairs.map((p) => p.right),
    });
  };

  const updatePair = (index: number, side: 'left' | 'right', value: string) => {
    const newPairs = pairs.map((p, i) =>
      i === index ? { ...p, [side]: value } : p
    );
    emitConfig(newPairs);
  };

  const addPair = () => {
    emitConfig([...pairs, { left: '', right: '' }]);
  };

  const removePair = (index: number) => {
    emitConfig(pairs.filter((_, i) => i !== index));
  };

  const allPairsFilled = pairs.every((p) => p.left && p.right);

  const canJoin =
    !!leftRunId &&
    !!rightRunId &&
    allPairsFilled &&
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

        <div>
          <Label className="text-xs text-muted-foreground">Join Type</Label>
          <Select
            value={config?.join_type || 'inner'}
            onValueChange={(v) => emitConfig(pairs, v as JoinConfig['join_type'])}
          >
            <SelectTrigger className="w-48">
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

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Column Pairs</Label>
          {pairs.map((pair, i) => {
            const leftCol = leftColumns.find((c) => c.name === pair.left);
            const rightCol = rightColumns.find((c) => c.name === pair.right);
            const mismatch = leftCol && rightCol && leftCol.type !== rightCol.type;

            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Select
                    value={pair.left || ''}
                    onValueChange={(v) => updatePair(i, 'left', v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={`${leftLabel} column`} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      {leftColumns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name} ({col.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-sm text-muted-foreground">=</span>

                  <Select
                    value={pair.right || ''}
                    onValueChange={(v) => updatePair(i, 'right', v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={`${rightLabel} column`} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      {rightColumns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name} ({col.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {pairs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePair(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {mismatch && (
                  <Badge variant="secondary" className="text-amber-600">
                    Type mismatch: {leftCol.type} vs {rightCol.type} (auto-coerced)
                  </Badge>
                )}
              </div>
            );
          })}

          <Button variant="outline" size="sm" onClick={addPair}>
            <Plus className="mr-1 h-3 w-3" />
            Add Column Pair
          </Button>
        </div>

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
