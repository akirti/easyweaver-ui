import { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatasetPanel } from './DatasetPanel';
import { JoinStepCard } from './JoinStepCard';
import { FilterBuilder } from './FilterBuilder';
import { SortConfigurator } from './SortConfigurator';
import { TransformBuilder } from './TransformBuilder';
import { GroupByBuilder } from './GroupByBuilder';
import { DistinctBuilder } from './DistinctBuilder';
import { DerivedColumnBuilder } from './DerivedColumnBuilder';
import { DataTable } from '@/components/results/DataTable';
import { SaveProcessDialog } from '@/components/processes/SaveProcessDialog';
import { useQueryStore } from '@/stores/query-store';
import { useQueryResults, useJoinResults } from '@/queries/use-queries';
import { toast } from 'sonner';
import type { JoinResultsRequest, ColumnInfo } from '@/types';

export function InteractiveQueryBuilder() {
  const store = useQueryStore();
  const joinMutation = useJoinResults();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Find the last completed join step for final results
  const lastJoinIndex = store.joinSteps.length - 1;
  const lastJoinStep = store.joinSteps[lastJoinIndex];
  const finalRunId = lastJoinStep?.status === 'completed' ? lastJoinStep.runId : null;

  // Fetch columns from the final join result for post-join filters
  const { data: finalResultData } = useQueryResults(finalRunId, { page: 1, page_size: 1 });
  const finalColumns: ColumnInfo[] = (finalResultData?.columns || []).map((c) => ({
    name: c.name,
    type: c.type,
    nullable: true,
    primary_key: false,
  }));

  // Helper: get the left run_id for a given join step (only when completed)
  const getLeftRunId = (stepIndex: number): string | null => {
    if (stepIndex === 0) {
      const ds = store.datasets[0];
      return ds?.status === 'completed' ? ds.runId : null;
    }
    const prevStep = store.joinSteps[stepIndex - 1];
    return prevStep?.status === 'completed' ? prevStep.runId : null;
  };

  // Helper: get the left label for a join step
  const getLeftLabel = (stepIndex: number): string => {
    if (stepIndex === 0) return `Dataset ${String.fromCharCode(65)}`;
    return `Join ${stepIndex} Result`;
  };

  // Apply post-join operations on the final result
  const handleApplyPostJoin = async () => {
    const leftRunId = getLeftRunId(lastJoinIndex);
    const rightRunId = store.datasets[lastJoinIndex + 1]?.runId;
    const config = lastJoinStep?.config;

    if (!leftRunId || !rightRunId || !config) return;

    const selectCols = lastJoinStep.selectColumns;
    const allCols = finalColumns.map((c) => c.name);

    const request: JoinResultsRequest = {
      left_run_id: leftRunId,
      right_run_id: rightRunId,
      join: config,
      select_columns:
        selectCols.length > 0 && selectCols.length < allCols.length
          ? selectCols
          : undefined,
      derived_columns:
        store.postJoinDerivedColumns.length > 0
          ? store.postJoinDerivedColumns
          : undefined,
      filters: store.postJoinFilters,
      filter_logic: store.postJoinFilterLogic,
      group_by: store.postJoinGroupBy || undefined,
      distinct: store.postJoinDistinct || undefined,
      sort: store.postJoinSorts,
      transforms: store.postJoinTransforms,
    };

    try {
      const run = await joinMutation.mutateAsync(request);
      store.setJoinResult(lastJoinIndex, run.id, 'pending', null, null, true);
    } catch {
      toast.error('Failed to apply operations');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Dataset panels — side-by-side on large screens when exactly 2 datasets */}
      {store.datasets.length === 2 ? (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {store.datasets.map((ds, idx) => {
              const datasetLabel = `Dataset ${String.fromCharCode(65 + idx)}`;
              return (
                <DatasetPanel
                  key={idx}
                  label={datasetLabel}
                  dataset={ds}
                  onSourceChange={(id) => store.setDatasetSource(idx, id)}
                  onTableChange={(t) => store.setDatasetTable(idx, t)}
                  onColumnsChange={(c) => store.setDatasetColumns(idx, c)}
                  onFiltersChange={(f) => store.setDatasetFilters(idx, f)}
                  onFilterLogicChange={(l) => store.setDatasetFilterLogic(idx, l)}
                  onRunUpdate={(runId, status, rowCount, error) =>
                    store.setDatasetRun(idx, runId, status, rowCount, error)
                  }
                  removable={idx >= 2}
                  onRemove={() => store.removeDataset(idx)}
                />
              );
            })}
          </div>
          <JoinStepCard
            stepIndex={0}
            leftRunId={getLeftRunId(0)}
            rightRunId={store.datasets[1]?.status === 'completed' ? store.datasets[1].runId : null}
            leftLabel={getLeftLabel(0)}
            rightLabel="Dataset B"
            joinStep={store.joinSteps[0]}
          />
        </>
      ) : (
        /* 3+ datasets: stacked layout with join steps between */
        store.datasets.map((ds, idx) => {
          const datasetLabel = `Dataset ${String.fromCharCode(65 + idx)}`;
          const joinStepIndex = idx - 1;

          return (
            <div key={idx} className="space-y-4">
              {idx > 0 && (
                <JoinStepCard
                  stepIndex={joinStepIndex}
                  leftRunId={getLeftRunId(joinStepIndex)}
                  rightRunId={ds.status === 'completed' ? ds.runId : null}
                  leftLabel={getLeftLabel(joinStepIndex)}
                  rightLabel={datasetLabel}
                  joinStep={store.joinSteps[joinStepIndex]}
                />
              )}

              <DatasetPanel
                label={datasetLabel}
                dataset={ds}
                onSourceChange={(id) => store.setDatasetSource(idx, id)}
                onTableChange={(t) => store.setDatasetTable(idx, t)}
                onColumnsChange={(c) => store.setDatasetColumns(idx, c)}
                onFiltersChange={(f) => store.setDatasetFilters(idx, f)}
                onFilterLogicChange={(l) => store.setDatasetFilterLogic(idx, l)}
                onRunUpdate={(runId, status, rowCount, error) =>
                  store.setDatasetRun(idx, runId, status, rowCount, error)
                }
                removable={idx >= 2}
                onRemove={() => store.removeDataset(idx)}
              />
            </div>
          );
        })
      )}

      {/* Add Dataset / Save buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={store.addDataset}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Dataset {String.fromCharCode(65 + store.datasets.length)}
        </Button>
        {finalRunId && (
          <Button variant="outline" onClick={() => setSaveDialogOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Save as Process
          </Button>
        )}
      </div>
      <SaveProcessDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />

      {/* Post-join operations -- visible when the last join is completed */}
      {finalRunId && finalColumns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Post-Join Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Derived Columns</Label>
              <DerivedColumnBuilder
                columns={finalColumns}
                derivedColumns={store.postJoinDerivedColumns}
                onChange={store.setPostJoinDerivedColumns}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Filters</Label>
              <FilterBuilder
                columns={finalColumns}
                filters={store.postJoinFilters}
                onChange={store.setPostJoinFilters}
                filterLogic={store.postJoinFilterLogic}
                onLogicChange={store.setPostJoinFilterLogic}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Group By</Label>
              <GroupByBuilder
                columns={finalColumns}
                groupBy={store.postJoinGroupBy}
                onChange={store.setPostJoinGroupBy}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Distinct</Label>
              <DistinctBuilder
                columns={finalColumns}
                distinct={store.postJoinDistinct}
                onChange={store.setPostJoinDistinct}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sort</Label>
              <SortConfigurator
                columns={finalColumns}
                sorts={store.postJoinSorts}
                onChange={store.setPostJoinSorts}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Transforms</Label>
              <TransformBuilder
                columns={finalColumns}
                transforms={store.postJoinTransforms}
                onChange={store.setPostJoinTransforms}
              />
            </div>
            <Button onClick={handleApplyPostJoin} size="sm" className="w-full">
              Apply Operations
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Combined results */}
      {finalRunId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Combined Results</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable runId={finalRunId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
