import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { useQueryStore } from '@/stores/query-store';
import { useCreateProcess } from '@/queries/use-processes';
import { useSourceSchema } from '@/queries/use-sources';
import { getTypeCategory } from '@/lib/column-types';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/client';
import type {
  ProcessConfig,
  ProcessQueryConfig,
  ProcessLogicStep,
  ProcessConfigurationCreate,
  ParamDefinition,
  ProcessFilterConfig,
  ColumnInfo,
} from '@/types';

interface SaveProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParamCandidate {
  source: 'dataset' | 'postjoin';
  datasetIndex: number;
  filterIndex: number;
  column: string;
  operator: string;
  value: unknown;
  enabled: boolean;
  paramName: string;
  paramType: ParamDefinition['type'];
}

function categoryToParamType(category: string): ParamDefinition['type'] {
  switch (category) {
    case 'numeric': return 'number';
    case 'datetime': return 'datetime';
    case 'boolean': return 'boolean';
    default: return 'string';
  }
}

export function SaveProcessDialog({ open, onOpenChange }: SaveProcessDialogProps) {
  const navigate = useNavigate();
  const store = useQueryStore();
  const createMutation = useCreateProcess();

  // Fetch schemas for all datasets so we can infer column types
  const sourceIds = useMemo(
    () => [...new Set(store.datasets.map((ds) => ds.sourceId).filter(Boolean))] as string[],
    [store.datasets]
  );
  // Fetch up to 4 source schemas (hooks must be called unconditionally)
  const schema0 = useSourceSchema(sourceIds[0] || '');
  const schema1 = useSourceSchema(sourceIds[1] || '');
  const schema2 = useSourceSchema(sourceIds[2] || '');
  const schema3 = useSourceSchema(sourceIds[3] || '');
  const schemaMap = useMemo(() => {
    const map: Record<string, ColumnInfo[]> = {};
    const results = [schema0, schema1, schema2, schema3];
    sourceIds.forEach((id, i) => {
      const tables = results[i]?.data;
      if (tables) {
        for (const t of tables) {
          for (const col of t.columns) {
            map[`${id}:${t.name}:${col.name}`] = [col];
          }
        }
      }
    });
    return map;
  }, [sourceIds, schema0.data, schema1.data, schema2.data, schema3.data]);

  const getColumnType = (sourceId: string, table: string, column: string): ParamDefinition['type'] => {
    const cols = schemaMap[`${sourceId}:${table}:${column}`];
    if (cols && cols.length > 0) {
      return categoryToParamType(getTypeCategory(cols[0].type));
    }
    return 'string';
  };

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saveDestination, setSaveDestination] = useState<'redis' | 'gcp' | 'both'>('redis');
  const [paramCandidates, setParamCandidates] = useState<ParamCandidate[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize param candidates from dataset filters AND post-join filters
  if (open && !initialized) {
    const candidates: ParamCandidate[] = [];
    store.datasets.forEach((ds, dsIdx) => {
      ds.filters.forEach((f, fIdx) => {
        if (f.value !== undefined && f.value !== null && f.value !== '') {
          const inferredType = ds.sourceId && ds.table
            ? getColumnType(ds.sourceId, ds.table, f.column)
            : (typeof f.value === 'number' ? 'number' : 'string');
          candidates.push({
            source: 'dataset',
            datasetIndex: dsIdx,
            filterIndex: fIdx,
            column: f.column,
            operator: f.operator,
            value: f.value,
            enabled: false,
            paramName: `${f.column}_${dsIdx}`,
            paramType: inferredType,
          });
        }
      });
    });
    // Post-join filters
    store.postJoinFilters.forEach((f, fIdx) => {
      if (f.value !== undefined && f.value !== null && f.value !== '') {
        candidates.push({
          source: 'postjoin',
          datasetIndex: -1,
          filterIndex: fIdx,
          column: f.column,
          operator: f.operator,
          value: f.value,
          enabled: false,
          paramName: `pj_${f.column}`,
          paramType: typeof f.value === 'number' ? 'number' : 'string',
        });
      }
    });
    setParamCandidates(candidates);
    setInitialized(true);
  }

  // Reset state when dialog closes
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setName('');
      setDescription('');
      setTagsInput('');
      setSaveDestination('redis');
      setParamCandidates([]);
      setInitialized(false);
    }
    onOpenChange(v);
  };

  const toggleCandidate = (idx: number) => {
    setParamCandidates((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const updateCandidateName = (idx: number, paramName: string) => {
    setParamCandidates((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, paramName } : c))
    );
  };

  // Build ProcessConfig from current query store state
  const buildConfig = useMemo((): ProcessConfig => {
    const queries: Record<string, Record<string, ProcessQueryConfig>> = {};

    store.datasets.forEach((ds, idx) => {
      if (!ds.sourceId || !ds.table) return;
      const sourceKey = `source_${idx}`;
      const queryKey = `query_${idx}`;

      const filters: ProcessFilterConfig[] = ds.filters.map((f, fIdx) => {
        const candidate = paramCandidates.find(
          (c) => c.source === 'dataset' && c.datasetIndex === idx && c.filterIndex === fIdx && c.enabled
        );
        return {
          column: f.column,
          operator: f.operator,
          value: candidate ? `{${candidate.paramName}}` : f.value,
          value2: f.value2,
        };
      });

      if (!queries[sourceKey]) queries[sourceKey] = {};
      queries[sourceKey][queryKey] = {
        source_id: ds.sourceId,
        table: ds.table,
        columns: ds.columns.length > 0 ? ds.columns : undefined,
        filters,
        filter_logic: ds.filterLogic,
      };
    });

    const logics: ProcessLogicStep[] = store.joinSteps
      .map((step, idx) => {
        if (!step.config) return null;
        const logic: ProcessLogicStep = {
          key: `join_${idx}`,
          type: 'join' as const,
          left: idx === 0 ? `source_0.query_0` : `join_${idx - 1}`,
          right: `source_${idx + 1}.query_${idx + 1}`,
          join_type: step.config.join_type,
          left_on: Array.isArray(step.config.left_on)
            ? step.config.left_on
            : [step.config.left_on],
          right_on: Array.isArray(step.config.right_on)
            ? step.config.right_on
            : [step.config.right_on],
        };
        if (step.selectColumns.length > 0) {
          logic.select_columns = step.selectColumns;
        }
        return logic;
      })
      .filter((x): x is ProcessLogicStep => x !== null);

    const hasOperations =
      store.postJoinFilters.length > 0 ||
      store.postJoinSorts.length > 0 ||
      store.postJoinGroupBy !== null ||
      store.postJoinDistinct !== null;

    const operations = hasOperations
      ? {
          filters: store.postJoinFilters.map((f, fIdx) => {
            const candidate = paramCandidates.find(
              (c) => c.source === 'postjoin' && c.filterIndex === fIdx && c.enabled
            );
            return {
              column: f.column,
              operator: f.operator,
              value: candidate ? `{${candidate.paramName}}` : f.value,
              value2: f.value2,
            };
          }),
          filter_logic: store.postJoinFilterLogic,
          group_by: store.postJoinGroupBy || undefined,
          distinct: store.postJoinDistinct || undefined,
          sorts: store.postJoinSorts,
        }
      : undefined;

    const transformations = store.postJoinTransforms.map((t) => ({
      column: t.column,
      type: t.type,
      new_name: t.new_name,
      date_format: t.date_format,
      decimals: t.decimals,
      target_type: t.target_type,
    }));

    const derived_columns = store.postJoinDerivedColumns.length > 0
      ? store.postJoinDerivedColumns
      : undefined;

    return { queries, logics, derived_columns, operations, transformations };
  }, [store.datasets, store.joinSteps, store.postJoinFilters, store.postJoinFilterLogic, store.postJoinSorts, store.postJoinTransforms, store.postJoinGroupBy, store.postJoinDistinct, store.postJoinDerivedColumns, paramCandidates]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    const params: Record<string, ParamDefinition> = {};
    for (const c of paramCandidates) {
      if (c.enabled) {
        params[c.paramName] = {
          type: c.paramType,
          default: c.value,
          label: c.column,
        };
      }
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const data: ProcessConfigurationCreate = {
      name: name.trim(),
      description: description.trim() || undefined,
      config: buildConfig,
      params: Object.keys(params).length > 0 ? params : undefined,
      save_destination: saveDestination,
      tags: tags.length > 0 ? tags : undefined,
    };

    try {
      await createMutation.mutateAsync(data);
      toast.success('Process saved');
      handleOpenChange(false);
      navigate('/processes');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save as Process</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="process-name">Name *</Label>
            <Input
              id="process-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My data pipeline"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="process-desc">Description</Label>
            <Textarea
              id="process-desc"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="process-tags">Tags (comma-separated)</Label>
            <Input
              id="process-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="etl, daily, sales"
            />
          </div>

          <div className="space-y-2">
            <Label>Save Destination</Label>
            <RadioGroup
              value={saveDestination}
              onValueChange={(v: string) => setSaveDestination(v as 'redis' | 'gcp' | 'both')}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="redis" id="dest-redis" />
                <Label htmlFor="dest-redis" className="font-normal">
                  Redis only
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="gcp" id="dest-gcp" />
                <Label htmlFor="dest-gcp" className="font-normal">
                  GCP
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="both" id="dest-both" />
                <Label htmlFor="dest-both" className="font-normal">
                  Both
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paramCandidates.length > 0 && (
            <div className="space-y-2">
              <Label>Parameterize Filter Values</Label>
              <div className="space-y-2 rounded-md border p-3">
                {paramCandidates.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Switch
                      checked={c.enabled}
                      onCheckedChange={() => toggleCandidate(idx)}
                    />
                    <span className="text-muted-foreground">
                      {c.source === 'postjoin' && (
                        <span className="mr-1 rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          Post-Join
                        </span>
                      )}
                      {c.source === 'dataset' && (
                        <span className="mr-1 rounded bg-gray-100 px-1 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          DS {c.datasetIndex + 1}
                        </span>
                      )}
                      {c.column} {c.operator} {String(c.value)}
                    </span>
                    {c.enabled && (
                      <Input
                        className="h-7 w-36"
                        value={c.paramName}
                        onChange={(e) => updateCandidateName(idx, e.target.value)}
                        placeholder="param name"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            )}
            Save Process
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
