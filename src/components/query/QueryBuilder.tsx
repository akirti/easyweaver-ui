import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { SourceSelector } from './SourceSelector';
import { JoinConfigurator } from './JoinConfigurator';
import { FilterBuilder } from './FilterBuilder';
import { SortConfigurator } from './SortConfigurator';
import { DataTable } from '@/components/results/DataTable';
import { useQueryStore } from '@/stores/query-store';
import { useSourceSchema } from '@/queries/use-sources';
import { useExecuteQuery, useQueryRun } from '@/queries/use-queries';
import { toast } from 'sonner';
import type { QueryRequest } from '@/types';

export function QueryBuilder() {
  const store = useQueryStore();
  const executeMutation = useExecuteQuery();
  const { data: queryRun } = useQueryRun(store.currentRunId);

  const { data: leftSchema } = useSourceSchema(store.leftSourceId || '');
  const { data: rightSchema } = useSourceSchema(store.rightSourceId || '');

  const leftColumns = leftSchema?.find((t) => t.name === store.leftTable)?.columns || [];
  const rightColumns = rightSchema?.find((t) => t.name === store.rightTable)?.columns || [];
  const allColumns = store.isJoin ? [...leftColumns, ...rightColumns] : leftColumns;

  const isRunning = queryRun?.status === 'pending' || queryRun?.status === 'running';

  const handleExecute = async () => {
    if (!store.leftSourceId || !store.leftTable) {
      toast.error('Select a source and table');
      return;
    }

    if (store.isJoin && (!store.rightSourceId || !store.rightTable || !store.joinConfig?.left_on)) {
      toast.error('Configure join completely');
      return;
    }

    const request: QueryRequest = {
      type: store.isJoin ? 'join' : 'single',
      left: {
        source_id: store.leftSourceId,
        table: store.leftTable,
        columns: store.leftColumns.length > 0 ? store.leftColumns : undefined,
        filters: store.leftFilters,
      },
      sort: store.sorts,
      page: 1,
      page_size: 50,
    };

    if (store.isJoin && store.rightSourceId && store.rightTable && store.joinConfig) {
      request.right = {
        source_id: store.rightSourceId,
        table: store.rightTable,
        columns: store.rightColumns.length > 0 ? store.rightColumns : undefined,
        filters: store.rightFilters,
      };
      request.join = store.joinConfig;
    }

    try {
      const run = await executeMutation.mutateAsync(request);
      store.setCurrentRunId(run.id);
    } catch {
      toast.error('Failed to execute query');
    }
  };

  return (
    <div className="space-y-4">
      {/* Source Selectors */}
      <SourceSelector
        label="Source"
        sourceId={store.leftSourceId}
        table={store.leftTable}
        columns={store.leftColumns}
        onSourceChange={store.setLeftSource}
        onTableChange={store.setLeftTable}
        onColumnsChange={store.setLeftColumns}
      />

      {/* Join Toggle */}
      <div className="flex items-center gap-3">
        <Switch checked={store.isJoin} onCheckedChange={store.setIsJoin} id="join-toggle" />
        <Label htmlFor="join-toggle" className="cursor-pointer">
          Cross-source Join
        </Label>
      </div>

      {/* Right source (join) */}
      {store.isJoin && (
        <>
          <SourceSelector
            label="Join Source"
            sourceId={store.rightSourceId}
            table={store.rightTable}
            columns={store.rightColumns}
            onSourceChange={store.setRightSource}
            onTableChange={store.setRightTable}
            onColumnsChange={store.setRightColumns}
          />
          <JoinConfigurator
            leftSourceId={store.leftSourceId}
            leftTable={store.leftTable}
            rightSourceId={store.rightSourceId}
            rightTable={store.rightTable}
            joinConfig={store.joinConfig}
            onChange={store.setJoinConfig}
          />
        </>
      )}

      <Separator />

      {/* Filters */}
      <div>
        <Label className="text-sm font-semibold">Filters</Label>
        <FilterBuilder
          columns={leftColumns}
          filters={store.leftFilters}
          onChange={store.setLeftFilters}
        />
      </div>

      {/* Sort */}
      <div>
        <Label className="text-sm font-semibold">Sort</Label>
        <SortConfigurator
          columns={allColumns}
          sorts={store.sorts}
          onChange={store.setSorts}
        />
      </div>

      <Separator />

      {/* Execute */}
      <div className="flex items-center gap-3">
        <Button onClick={handleExecute} disabled={isRunning || executeMutation.isPending}>
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Query
            </>
          )}
        </Button>

        {queryRun?.status === 'failed' && (
          <span className="text-sm text-destructive">{queryRun.error}</span>
        )}

        {queryRun?.status === 'completed' && (
          <span className="text-sm text-muted-foreground">
            {queryRun.row_count?.toLocaleString()} rows
          </span>
        )}
      </div>

      {/* Results */}
      {store.currentRunId && queryRun?.status === 'completed' && (
        <DataTable runId={store.currentRunId} />
      )}
    </div>
  );
}
