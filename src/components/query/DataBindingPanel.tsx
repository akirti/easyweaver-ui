import { useEffect, useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ColumnInfo, DataBinding, BindingMapping } from '@/types';
import { getTypeCategory } from '@/lib/column-types';
import { queriesApi } from '@/api/queries';

interface AvailableSource {
  index: number;
  label: string;
  runId: string;
  status: string;
  columns: ColumnInfo[];
  rowCount: number | null;
}

interface DataBindingPanelProps {
  availableSources: AvailableSource[];
  targetColumns: ColumnInfo[];
  bindings: DataBinding[];
  onChange: (bindings: DataBinding[]) => void;
  datasetIndex: number;
  allBindings: DataBinding[][];
}

function wouldCreateCycle(
  allBindings: DataBinding[][],
  fromIndex: number,
  toIndex: number,
): boolean {
  const visited = new Set<number>();
  const stack = [fromIndex];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === toIndex) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const bindings = allBindings[current] || [];
    for (const b of bindings) {
      stack.push(b.source_dataset_index);
    }
  }
  return false;
}

function RowCountBadge({ count, mode }: { count: number | null; mode: DataBinding['mode'] }) {
  if (count === null) return null;

  let colorClass = 'bg-muted text-muted-foreground';
  if (mode === 'row_pair') {
    if (count > 1000) {
      colorClass = 'bg-red-100 text-red-700';
    } else if (count >= 500) {
      colorClass = 'bg-amber-100 text-amber-700';
    } else {
      colorClass = 'bg-green-100 text-green-700';
    }
  }

  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {count.toLocaleString()} rows
    </span>
  );
}

function TypeMismatchIcon({
  sourceCol,
  targetCol,
  sourceColumns,
  targetColumns,
}: {
  sourceCol: string;
  targetCol: string;
  sourceColumns: ColumnInfo[];
  targetColumns: ColumnInfo[];
}) {
  if (!sourceCol || !targetCol) return null;

  const srcType = sourceColumns.find((c) => c.name === sourceCol)?.type;
  const tgtType = targetColumns.find((c) => c.name === targetCol)?.type;

  if (!srcType || !tgtType) return null;

  const srcCategory = getTypeCategory(srcType);
  const tgtCategory = getTypeCategory(tgtType);

  if (srcCategory !== tgtCategory) {
    return (
      <span title={`Type mismatch: source is ${srcCategory} (${srcType}), target is ${tgtCategory} (${tgtType})`}>
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      </span>
    );
  }

  return null;
}

export function DataBindingPanel({
  availableSources,
  targetColumns,
  bindings,
  onChange,
  datasetIndex,
  allBindings,
}: DataBindingPanelProps) {
  // Fetch columns from run results for each unique source run ID
  const [sourceResultColumns, setSourceResultColumns] = useState<Record<string, ColumnInfo[]>>({});

  const sourceRunIds = [...new Set(bindings.map((b) => b.source_run_id).filter(Boolean))];
  useEffect(() => {
    let cancelled = false;
    const fetchCols = async () => {
      const results: Record<string, ColumnInfo[]> = {};
      for (const runId of sourceRunIds) {
        if (sourceResultColumns[runId]) {
          results[runId] = sourceResultColumns[runId];
          continue;
        }
        try {
          const data = await queriesApi.getResults(runId, { page: 1, page_size: 1 });
          results[runId] = data.columns.map((c) => ({
            name: c.name,
            type: c.type,
            nullable: true,
            primary_key: false,
          }));
        } catch {
          results[runId] = [];
        }
      }
      if (!cancelled) setSourceResultColumns(results);
    };
    if (sourceRunIds.length > 0) fetchCols();
    return () => { cancelled = true; };
  }, [sourceRunIds.join(',')]);

  const safeSources = availableSources.filter(
    (src) => !wouldCreateCycle(allBindings, src.index, datasetIndex)
  );

  const addBinding = () => {
    if (safeSources.length === 0) return;
    const source = safeSources[0];
    onChange([
      ...bindings,
      {
        source_run_id: source.runId,
        source_dataset_index: source.index,
        mode: 'distinct',
        auto_refresh: false,
        mappings: [{ source_column: '', target_column: '' }],
      },
    ]);
  };

  const removeBinding = (index: number) => {
    onChange(bindings.filter((_, i) => i !== index));
  };

  const updateBinding = (index: number, updates: Partial<DataBinding>) => {
    onChange(bindings.map((b, i) => (i === index ? { ...b, ...updates } : b)));
  };

  const addMapping = (bindingIndex: number) => {
    const binding = bindings[bindingIndex];
    updateBinding(bindingIndex, {
      mappings: [...binding.mappings, { source_column: '', target_column: '' }],
    });
  };

  const removeMapping = (bindingIndex: number, mappingIndex: number) => {
    const binding = bindings[bindingIndex];
    const newMappings = binding.mappings.filter((_, i) => i !== mappingIndex);
    if (newMappings.length === 0) {
      removeBinding(bindingIndex);
    } else {
      updateBinding(bindingIndex, { mappings: newMappings });
    }
  };

  const updateMapping = (
    bindingIndex: number,
    mappingIndex: number,
    updates: Partial<BindingMapping>,
  ) => {
    const binding = bindings[bindingIndex];
    const newMappings = binding.mappings.map((m, i) =>
      i === mappingIndex ? { ...m, ...updates } : m
    );
    updateBinding(bindingIndex, { mappings: newMappings });
  };

  const getSourceColumns = (binding: DataBinding): ColumnInfo[] => {
    const source = availableSources.find((s) => s.index === binding.source_dataset_index);
    // Prefer columns from availableSources if provided, otherwise from fetched results
    if (source?.columns && source.columns.length > 0) return source.columns;
    return sourceResultColumns[binding.source_run_id] || [];
  };

  const getSourceRowCount = (binding: DataBinding): number | null => {
    const source = availableSources.find((s) => s.index === binding.source_dataset_index);
    return source?.rowCount ?? null;
  };

  return (
    <div className="space-y-2">
      {bindings.map((binding, bi) => {
        const sourceColumns = getSourceColumns(binding);
        const rowCount = getSourceRowCount(binding);

        return (
          <div
            key={`binding-${binding.source_dataset_index}-${bi}`}
            className="space-y-2 rounded-md border p-3"
          >
            {/* Binding header row: source, mode, auto-refresh, delete */}
            <div className="flex items-center gap-2">
              {/* Source dataset selector */}
              <Select
                value={String(binding.source_dataset_index)}
                onValueChange={(v) => {
                  const idx = Number(v);
                  const src = safeSources.find((s) => s.index === idx);
                  if (src) {
                    updateBinding(bi, {
                      source_dataset_index: idx,
                      source_run_id: src.runId,
                      mappings: [{ source_column: '', target_column: '' }],
                    });
                  }
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Source dataset..." />
                </SelectTrigger>
                <SelectContent position="popper">
                  {safeSources.map((src) => (
                    <SelectItem key={src.index} value={String(src.index)}>
                      {src.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mode selector */}
              <Select
                value={binding.mode}
                onValueChange={(v) =>
                  updateBinding(bi, { mode: v as DataBinding['mode'] })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="distinct">Distinct</SelectItem>
                  <SelectItem value="row_pair">Row Pair</SelectItem>
                </SelectContent>
              </Select>

              {/* Row count badge */}
              <RowCountBadge count={rowCount} mode={binding.mode} />

              {/* Auto-refresh toggle */}
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Auto-refresh</span>
                <Switch
                  size="sm"
                  checked={binding.auto_refresh}
                  onCheckedChange={(checked) =>
                    updateBinding(bi, { auto_refresh: !!checked })
                  }
                />
              </div>

              <Button variant="ghost" size="sm" onClick={() => removeBinding(bi)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Mapping rows */}
            <div className="space-y-2 pl-2">
              {binding.mappings.map((mapping, mi) => (
                <div key={`${mapping.target_column}-${mapping.source_column}-${mi}`} className="flex items-center gap-2">
                  {/* Target column */}
                  <Select
                    value={mapping.target_column || ''}
                    onValueChange={(v) => updateMapping(bi, mi, { target_column: v })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Target column..." />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      {targetColumns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          <span>{col.name}</span>
                          <span className="ml-1 text-xs text-muted-foreground">({col.type})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-xs text-muted-foreground">&larr;</span>

                  {/* Source column */}
                  <Select
                    value={mapping.source_column || ''}
                    onValueChange={(v) => updateMapping(bi, mi, { source_column: v })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Source column..." />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      {sourceColumns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          <span>{col.name}</span>
                          <span className="ml-1 text-xs text-muted-foreground">({col.type})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Type mismatch warning */}
                  <TypeMismatchIcon
                    sourceCol={mapping.source_column}
                    targetCol={mapping.target_column}
                    sourceColumns={sourceColumns}
                    targetColumns={targetColumns}
                  />

                  <Button variant="ghost" size="sm" onClick={() => removeMapping(bi, mi)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addMapping(bi)}
                disabled={sourceColumns.length === 0 || targetColumns.length === 0}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Mapping
              </Button>
            </div>
          </div>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        onClick={addBinding}
        disabled={safeSources.length === 0}
      >
        <Plus className="mr-1 h-3 w-3" />
        Add Binding
      </Button>
    </div>
  );
}
