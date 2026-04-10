import { useState, useCallback } from 'react';
import { Plus, Trash2, X, Type, List, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterCondition, ColumnInfo } from '@/types';
import type { DatasetState } from '@/stores/query-store';
import { getTypeCategory, getOperatorsForType, isDateOnly, type TypeCategory } from '@/lib/column-types';
import { FilterBooleanToggle } from './FilterBooleanToggle';
import { FilterValueSelect } from './FilterValueSelect';
import { FilterValueMultiSelect } from './FilterValueMultiSelect';

const NO_VALUE_OPS = ['is_null', 'is_not_null'];
const CROSS_DATASET_OPS = ['in', 'not_in'];
const NO_MODE_TOGGLE_OPS = new Set(['is_null', 'is_not_null', 'between', 'like']);

export type InputMode = 'text' | 'select' | 'multi' | 'boolean';

export interface ReferenceDataset {
  runId: string;
  status: DatasetState['status'];
  columns: ColumnInfo[];
  label: string;
}

interface Props {
  columns: ColumnInfo[];
  filters: FilterCondition[];
  onChange: (filters: FilterCondition[]) => void;
  referenceDataset?: ReferenceDataset;
  filterLogic?: 'and' | 'or';
  onLogicChange?: (logic: 'and' | 'or') => void;
  sourceId?: string;
  table?: string;
}

function getColumnType(columns: ColumnInfo[], columnName: string): string {
  return columns.find((c) => c.name === columnName)?.type || 'text';
}

/** Determine the best input mode for a given operator + column type category */
function autoDetectMode(operator: string, category: TypeCategory): InputMode {
  if (category === 'boolean') return 'boolean';
  if (operator === 'in' || operator === 'not_in') return 'multi';
  if (operator === 'eq' || operator === 'neq') return 'select';
  return 'text';
}

function TypedValueInput({
  category,
  rawType,
  value,
  placeholder,
  onChange,
}: {
  category: TypeCategory;
  rawType: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
}) {
  if (category === 'numeric') {
    return (
      <Input
        type="number"
        step="any"
        className="flex-1"
        placeholder={placeholder || '0'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (category === 'datetime') {
    const inputType = isDateOnly(rawType) ? 'date' : 'datetime-local';
    return (
      <Input
        type={inputType}
        className="flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (category === 'boolean') {
    return (
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="true">True</SelectItem>
          <SelectItem value="false">False</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      type="text"
      className="flex-1"
      placeholder={placeholder || 'Value'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ModeToggle({
  mode,
  onModeChange,
}: {
  mode: InputMode;
  onModeChange: (m: InputMode) => void;
}) {
  return (
    <div className="flex shrink-0">
      <Button
        type="button"
        variant={mode === 'text' ? 'default' : 'outline'}
        size="sm"
        className="h-7 w-7 p-0 rounded-r-none"
        title="Text input"
        onClick={() => onModeChange('text')}
      >
        <Type className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        variant={mode === 'select' ? 'default' : 'outline'}
        size="sm"
        className="h-7 w-7 p-0 rounded-none border-l-0"
        title="Select from values"
        onClick={() => onModeChange('select')}
      >
        <List className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        variant={mode === 'multi' ? 'default' : 'outline'}
        size="sm"
        className="h-7 w-7 p-0 rounded-l-none border-l-0"
        title="Multi-select from values"
        onClick={() => onModeChange('multi')}
      >
        <ListChecks className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function FilterBuilder({
  columns,
  filters,
  onChange,
  referenceDataset,
  filterLogic = 'and',
  onLogicChange,
  sourceId,
  table,
}: Props) {
  // Local input mode state keyed by filter index
  const [inputModes, setInputModes] = useState<Record<number, InputMode>>({});

  const getMode = useCallback(
    (index: number, filter: FilterCondition): InputMode => {
      if (inputModes[index] != null) return inputModes[index];
      // Default auto-detect
      const colType = getColumnType(columns, filter.column);
      const category = getTypeCategory(colType);
      return autoDetectMode(filter.operator, category);
    },
    [inputModes, columns],
  );

  const setMode = (index: number, mode: InputMode) => {
    setInputModes((prev) => ({ ...prev, [index]: mode }));
  };

  const addFilter = () => {
    onChange([...filters, { column: columns[0]?.name || '', operator: 'eq', value: '' }]);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
    // Clean up mode state
    setInputModes((prev) => {
      const next: Record<number, InputMode> = {};
      for (const [k, v] of Object.entries(prev)) {
        const ki = Number(k);
        if (ki < index) next[ki] = v;
        else if (ki > index) next[ki - 1] = v;
      }
      return next;
    });
  };

  const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
    const newFilter = { ...filters[index], ...updates };

    // When changing column, reset operator if it's invalid for the new type
    if (updates.column) {
      const colType = getColumnType(columns, updates.column);
      const category = getTypeCategory(colType);
      const validOps = getOperatorsForType(category);
      if (!validOps.some((op) => op.value === newFilter.operator)) {
        newFilter.operator = 'eq';
        newFilter.value = '';
        delete newFilter.value2;
        delete newFilter.value_from;
      }
      // Auto-detect mode on column change
      const newCategory = getTypeCategory(colType);
      setMode(index, autoDetectMode(newFilter.operator, newCategory));
    }

    // When switching operators
    if (updates.operator) {
      // Clear value_from when leaving in/not_in
      if (!CROSS_DATASET_OPS.includes(updates.operator)) {
        delete newFilter.value_from;
      }
      // Reset values when switching to in/not_in
      if (CROSS_DATASET_OPS.includes(updates.operator) && filters[index].operator !== updates.operator) {
        newFilter.value = '';
        delete newFilter.value_from;
      }
      // Clear value2 when leaving between
      if (updates.operator !== 'between') {
        delete newFilter.value2;
      }
      // Init value2 when entering between
      if (updates.operator === 'between' && filters[index].operator !== 'between') {
        newFilter.value = '';
        newFilter.value2 = '';
      }

      // Auto-detect input mode on operator change
      const colType = getColumnType(columns, newFilter.column);
      const category = getTypeCategory(colType);
      setMode(index, autoDetectMode(updates.operator, category));
    }

    onChange(filters.map((f, i) => (i === index ? newFilter : f)));
  };

  const setValueFrom = (index: number, column: string) => {
    if (!referenceDataset) return;
    const newFilter: FilterCondition = {
      ...filters[index],
      value_from: { run_id: referenceDataset.runId, column },
      value: undefined,
    };
    onChange(filters.map((f, i) => (i === index ? newFilter : f)));
  };

  const clearValueFrom = (index: number) => {
    const newFilter = { ...filters[index] };
    delete newFilter.value_from;
    newFilter.value = '';
    onChange(filters.map((f, i) => (i === index ? newFilter : f)));
  };

  const canUseReference =
    referenceDataset && referenceDataset.status === 'completed' && referenceDataset.runId;

  const hasSmartInputSupport = !!sourceId && !!table;

  return (
    <div className="space-y-2">
      {filters.map((filter, i) => {
        const colType = getColumnType(columns, filter.column);
        const category = getTypeCategory(colType);
        const operators = getOperatorsForType(category);
        const mode = getMode(i, filter);
        const showModeToggle =
          hasSmartInputSupport &&
          !NO_VALUE_OPS.includes(filter.operator) &&
          !NO_MODE_TOGGLE_OPS.has(filter.operator) &&
          !filter.value_from;

        return (
          <div key={i} className="flex items-start gap-2">
            {/* Column selector */}
            <Select
              value={filter.column}
              onValueChange={(v) => updateFilter(i, { column: v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {columns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    <span>{col.name}</span>
                    <span className="ml-1 text-xs text-muted-foreground">({col.type})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator selector — filtered by column type */}
            <Select
              value={filter.operator}
              onValueChange={(v) => updateFilter(i, { operator: v as FilterCondition['operator'] })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* No-value operators */}
            {NO_VALUE_OPS.includes(filter.operator) && (
              <div className="flex-1" />
            )}

            {/* Between: two typed inputs with "and" */}
            {filter.operator === 'between' && (
              <div className="flex flex-1 items-center gap-1">
                <TypedValueInput
                  category={category}
                  rawType={colType}
                  value={String(filter.value ?? '')}
                  placeholder="From"
                  onChange={(v) => updateFilter(i, { value: v })}
                />
                <span className="text-xs text-muted-foreground px-1">and</span>
                <TypedValueInput
                  category={category}
                  rawType={colType}
                  value={String(filter.value2 ?? '')}
                  placeholder="To"
                  onChange={(v) => updateFilter(i, { value2: v })}
                />
              </div>
            )}

            {/* Standard scalar value — routed by input mode */}
            {!NO_VALUE_OPS.includes(filter.operator) &&
              !CROSS_DATASET_OPS.includes(filter.operator) &&
              filter.operator !== 'between' && (
              <>
                {hasSmartInputSupport && mode === 'boolean' ? (
                  <div className="flex-1">
                    <FilterBooleanToggle
                      variant="truefalse"
                      value={
                        filter.value === 'true' || filter.value === true
                          ? true
                          : filter.value === 'false' || filter.value === false
                          ? false
                          : null
                      }
                      onChange={(v) => updateFilter(i, { value: String(v) })}
                    />
                  </div>
                ) : hasSmartInputSupport && mode === 'select' ? (
                  <FilterValueSelect
                    sourceId={sourceId!}
                    table={table!}
                    column={filter.column}
                    value={filter.value}
                    onChange={(v) => updateFilter(i, { value: v })}
                  />
                ) : hasSmartInputSupport && mode === 'multi' ? (
                  <FilterValueMultiSelect
                    sourceId={sourceId!}
                    table={table!}
                    column={filter.column}
                    value={Array.isArray(filter.value) ? filter.value : []}
                    onChange={(v) => updateFilter(i, { value: v })}
                  />
                ) : (
                  <TypedValueInput
                    category={category}
                    rawType={colType}
                    value={String(filter.value ?? '')}
                    onChange={(v) => updateFilter(i, { value: v })}
                  />
                )}
              </>
            )}

            {/* In/Not In: cross-dataset reference or manual comma-separated values */}
            {CROSS_DATASET_OPS.includes(filter.operator) && (
              <>
                {filter.value_from ? (
                  <div className="flex flex-1 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                      {referenceDataset?.label}
                    </span>
                    <span className="text-muted-foreground">.</span>
                    <span>{filter.value_from.column}</span>
                    <button
                      className="ml-auto rounded p-0.5 hover:bg-muted"
                      onClick={() => clearValueFrom(i)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : hasSmartInputSupport && mode === 'multi' ? (
                  <div className="flex flex-1 gap-1">
                    <FilterValueMultiSelect
                      sourceId={sourceId!}
                      table={table!}
                      column={filter.column}
                      value={
                        Array.isArray(filter.value)
                          ? filter.value
                          : typeof filter.value === 'string' && filter.value
                          ? filter.value.split(',').map((v) => v.trim()).filter(Boolean)
                          : []
                      }
                      onChange={(v) => updateFilter(i, { value: v })}
                    />
                    {canUseReference && (
                      <Select onValueChange={(col) => setValueFrom(i, col)}>
                        <SelectTrigger className="w-40 shrink-0">
                          <SelectValue placeholder="From dataset..." />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60">
                          {referenceDataset!.columns.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {referenceDataset!.label}.{col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 gap-1">
                    <Input
                      className="flex-1"
                      placeholder="Comma-separated values"
                      value={String(filter.value ?? '')}
                      onChange={(e) => updateFilter(i, { value: e.target.value })}
                    />
                    {canUseReference && (
                      <Select onValueChange={(col) => setValueFrom(i, col)}>
                        <SelectTrigger className="w-40 shrink-0">
                          <SelectValue placeholder="From dataset..." />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-60">
                          {referenceDataset!.columns.map((col) => (
                            <SelectItem key={col.name} value={col.name}>
                              {referenceDataset!.label}.{col.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Mode toggle */}
            {showModeToggle && (
              <ModeToggle mode={mode} onModeChange={(m) => setMode(i, m)} />
            )}

            <Button variant="ghost" size="sm" onClick={() => removeFilter(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addFilter} disabled={columns.length === 0}>
          <Plus className="mr-1 h-3 w-3" />
          Add Filter
        </Button>
        {filters.length >= 2 && onLogicChange && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-muted-foreground">Combine:</span>
            <Button
              variant={filterLogic === 'and' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onLogicChange('and')}
            >
              AND
            </Button>
            <Button
              variant={filterLogic === 'or' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onLogicChange('or')}
            >
              OR
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
