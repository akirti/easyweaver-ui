import { useEffect, useState } from 'react';
import { Play, Loader2, CheckCircle2, XCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceSelector } from './SourceSelector';
import { FilterBuilder } from './FilterBuilder';
import { TransformBuilder } from './TransformBuilder';
import { DataBindingPanel } from './DataBindingPanel';
import { DataTable } from '@/components/results/DataTable';
import { useSourceSchema } from '@/queries/use-sources';
import { useExecuteQuery, useQueryRun } from '@/queries/use-queries';
import { toast } from 'sonner';
import type { DatasetState } from '@/stores/query-store';
import type { FilterCondition, TransformSpec, QueryRequest, ColumnInfo, DataBinding } from '@/types';
import type { ReferenceDataset } from './FilterBuilder';
import { getTypeCategory } from '@/lib/column-types';

interface Props {
  label: string;
  dataset: DatasetState;
  onSourceChange: (id: string | null) => void;
  onTableChange: (table: string | null) => void;
  onColumnsChange: (columns: string[]) => void;
  onFiltersChange: (filters: FilterCondition[]) => void;
  onFilterLogicChange: (logic: 'and' | 'or') => void;
  onRunUpdate: (runId: string | null, status: DatasetState['status'], rowCount?: number | null, error?: string | null) => void;
  referenceDataset?: ReferenceDataset;
  removable?: boolean;
  onRemove?: () => void;
  bindings: DataBinding[];
  onBindingsChange: (bindings: DataBinding[]) => void;
  availableSources: Array<{
    index: number;
    label: string;
    runId: string;
    status: string;
    columns: ColumnInfo[];
    rowCount: number | null;
  }>;
  datasetIndex: number;
  allBindings: DataBinding[][];
}

export function DatasetPanel({
  label,
  dataset,
  onSourceChange,
  onTableChange,
  onColumnsChange,
  onFiltersChange,
  onFilterLogicChange,
  onRunUpdate,
  referenceDataset,
  removable,
  onRemove,
  bindings,
  onBindingsChange,
  availableSources,
  datasetIndex,
  allBindings,
}: Props) {
  const [transforms, setTransforms] = useState<TransformSpec[]>([]);
  const [showTransforms, setShowTransforms] = useState(false);
  const [showBindings, setShowBindings] = useState(false);

  const executeMutation = useExecuteQuery();
  const { data: queryRun } = useQueryRun(dataset.runId);
  const { data: schema } = useSourceSchema(dataset.sourceId || '');

  const tableColumns = schema?.find((t) => t.name === dataset.table)?.columns || [];

  // Sync run status from polling back to store
  useEffect(() => {
    if (!queryRun || !dataset.runId) return;
    if (queryRun.status !== dataset.status) {
      onRunUpdate(
        dataset.runId,
        queryRun.status as DatasetState['status'],
        queryRun.row_count,
        queryRun.error,
      );
    }
  }, [queryRun?.status, queryRun?.row_count]);

  const handleRun = async () => {
    if (!dataset.sourceId || !dataset.table) {
      toast.error('Select a connection and table first');
      return;
    }

    // Operators that don't need a value
    const noValueOps = new Set(['is_null', 'is_not_null']);

    // Pre-process filters: coerce values based on column type and strip incomplete filters
    const processedFilters = dataset.filters
      .filter((f) => {
        // Always keep no-value operators and cross-dataset references
        if (noValueOps.has(f.operator)) return true;
        if ((f.operator === 'in' || f.operator === 'not_in') && f.value_from) return true;
        // Drop filters with empty/missing values
        if (f.operator === 'between') return f.value !== '' && f.value != null && f.value2 !== '' && f.value2 != null;
        return f.value !== '' && f.value != null;
      })
      .map((f) => {
        const col = tableColumns.find((c: ColumnInfo) => c.name === f.column);
        const category = col ? getTypeCategory(col.type) : 'text';
        const coerce = (v: unknown) => {
          if (v === undefined || v === null || v === '') return v;
          const s = String(v);
          if (category === 'numeric') {
            const n = Number(s);
            return isNaN(n) ? s : n;
          }
          if (category === 'boolean') return s === 'true';
          return s;
        };

        if ((f.operator === 'in' || f.operator === 'not_in') && !f.value_from && typeof f.value === 'string') {
          return { ...f, value: f.value.split(',').map((v) => v.trim()).filter(Boolean).map(coerce) };
        }
        if (f.operator === 'between') {
          return { ...f, value: coerce(f.value), value2: coerce(f.value2) };
        }
        return { ...f, value: coerce(f.value) };
      });

    const request: QueryRequest = {
      type: 'single',
      left: {
        source_id: dataset.sourceId,
        table: dataset.table,
        columns: dataset.columns.length > 0 ? dataset.columns : undefined,
        filters: processedFilters,
        filter_logic: dataset.filterLogic,
      },
      sort: [],
      transforms: transforms.length > 0 ? transforms : [],
      bindings: bindings.length > 0
        ? bindings.map(({ source_run_id, mode, mappings }) => ({ source_run_id, mode, mappings }))
        : undefined,
      page: 1,
      page_size: 50,
    };

    try {
      const run = await executeMutation.mutateAsync(request);
      onRunUpdate(run.id, 'pending');
    } catch {
      toast.error('Failed to execute query');
    }
  };

  const isRunning = dataset.status === 'pending' || dataset.status === 'running';
  const canRun = !!dataset.sourceId && !!dataset.table && !isRunning;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{label}</CardTitle>
            {removable && onRemove && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onRemove}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {dataset.status === 'completed' && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {dataset.rowCount?.toLocaleString()} rows
            </span>
          )}
          {dataset.status === 'failed' && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              Error
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <SourceSelector
          label={label}
          sourceId={dataset.sourceId}
          table={dataset.table}
          columns={dataset.columns}
          onSourceChange={onSourceChange}
          onTableChange={onTableChange}
          onColumnsChange={onColumnsChange}
        />

        {tableColumns.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground">Filters</Label>
            <FilterBuilder
              columns={tableColumns}
              filters={dataset.filters}
              onChange={onFiltersChange}
              referenceDataset={referenceDataset}
              filterLogic={dataset.filterLogic}
              onLogicChange={onFilterLogicChange}
            />
          </div>
        )}

        {tableColumns.length > 0 && (
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowTransforms(!showTransforms)}
            >
              {showTransforms ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Transforms{transforms.length > 0 && ` (${transforms.length})`}
            </button>
            {showTransforms && (
              <div className="mt-1">
                <TransformBuilder
                  columns={tableColumns}
                  transforms={transforms}
                  onChange={setTransforms}
                />
              </div>
            )}
          </div>
        )}

        {availableSources.length > 0 && tableColumns.length > 0 && (
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowBindings(!showBindings)}
            >
              {showBindings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Data Bindings{bindings.length > 0 && ` (${bindings.length})`}
            </button>
            {showBindings && (
              <div className="mt-1">
                <DataBindingPanel
                  availableSources={availableSources}
                  targetColumns={tableColumns}
                  bindings={bindings}
                  onChange={onBindingsChange}
                  datasetIndex={datasetIndex}
                  allBindings={allBindings}
                />
              </div>
            )}
          </div>
        )}

        <Button onClick={handleRun} disabled={!canRun} size="sm" className="w-full">
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

        {dataset.status === 'failed' && dataset.error && (
          <p className="text-xs text-destructive">{dataset.error}</p>
        )}

        {dataset.runId && dataset.status === 'completed' && (
          <div className="max-h-[300px] overflow-auto rounded border">
            <DataTable runId={dataset.runId} compact />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
