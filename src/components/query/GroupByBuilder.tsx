import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTypeCategory, type TypeCategory } from '@/lib/column-types';
import type { ColumnInfo, GroupBySpec, AggregationSpec, AggFunction } from '@/types';

interface Props {
  columns: ColumnInfo[];
  groupBy: GroupBySpec | null;
  onChange: (spec: GroupBySpec | null) => void;
}

const AGG_OPTIONS: Record<TypeCategory, { value: AggFunction; label: string }[]> = {
  numeric: [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' },
    { value: 'count_distinct', label: 'Count Distinct' },
  ],
  text: [
    { value: 'count', label: 'Count' },
    { value: 'count_distinct', label: 'Count Distinct' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' },
  ],
  datetime: [
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' },
    { value: 'count_distinct', label: 'Count Distinct' },
  ],
  boolean: [
    { value: 'count', label: 'Count' },
    { value: 'count_distinct', label: 'Count Distinct' },
  ],
  other: [
    { value: 'count', label: 'Count' },
    { value: 'count_distinct', label: 'Count Distinct' },
  ],
};

export function GroupByBuilder({ columns, groupBy, onChange }: Props) {
  const enabled = groupBy !== null;

  const handleToggle = (on: boolean) => {
    if (on) {
      onChange({ group_columns: [], aggregations: [] });
    } else {
      onChange(null);
    }
  };

  const addGroupColumn = (col: string) => {
    if (!groupBy || groupBy.group_columns.includes(col)) return;
    onChange({
      ...groupBy,
      group_columns: [...groupBy.group_columns, col],
    });
  };

  const removeGroupColumn = (col: string) => {
    if (!groupBy) return;
    onChange({
      ...groupBy,
      group_columns: groupBy.group_columns.filter((c) => c !== col),
    });
  };

  const addAggregation = () => {
    if (!groupBy) return;
    const availableCols = columns.filter((c) => !groupBy.group_columns.includes(c.name));
    const firstCol = availableCols[0]?.name || columns[0]?.name || '';
    const colType = columns.find((c) => c.name === firstCol)?.type || '';
    const category = getTypeCategory(colType);
    const defaultFunc = AGG_OPTIONS[category][0]?.value || 'count';
    onChange({
      ...groupBy,
      aggregations: [
        ...groupBy.aggregations,
        { column: firstCol, function: defaultFunc },
      ],
    });
  };

  const removeAggregation = (index: number) => {
    if (!groupBy) return;
    onChange({
      ...groupBy,
      aggregations: groupBy.aggregations.filter((_, i) => i !== index),
    });
  };

  const updateAggregation = (index: number, updates: Partial<AggregationSpec>) => {
    if (!groupBy) return;
    const updated = { ...groupBy.aggregations[index], ...updates };

    // When changing column, validate the function is still valid
    if (updates.column) {
      const colType = columns.find((c) => c.name === updates.column)?.type || '';
      const category = getTypeCategory(colType);
      const validFns = AGG_OPTIONS[category].map((o) => o.value);
      if (!validFns.includes(updated.function)) {
        updated.function = validFns[0];
      }
    }

    onChange({
      ...groupBy,
      aggregations: groupBy.aggregations.map((a, i) => (i === index ? updated : a)),
    });
  };

  // Columns available for grouping (not already in group_columns)
  const availableGroupCols = columns.filter(
    (c) => !groupBy?.group_columns.includes(c.name)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={handleToggle} />
        <Label className="text-sm">Enable Group By</Label>
      </div>

      {enabled && groupBy && (
        <>
          {/* Group columns */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Group By Columns</Label>
            <div className="flex flex-wrap gap-1.5">
              {groupBy.group_columns.map((col) => (
                <Badge key={col} variant="secondary" className="gap-1">
                  {col}
                  <button onClick={() => removeGroupColumn(col)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {availableGroupCols.length > 0 && (
                <Select onValueChange={addGroupColumn}>
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <SelectValue placeholder="Add column..." />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {availableGroupCols.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                        <span className="ml-1 text-xs text-muted-foreground">({col.type})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Aggregations */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Aggregations</Label>
            {groupBy.aggregations.map((agg, i) => {
              const colType = columns.find((c) => c.name === agg.column)?.type || '';
              const category = getTypeCategory(colType);
              const aggOptions = AGG_OPTIONS[category];

              return (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={agg.column}
                    onValueChange={(v) => updateAggregation(i, { column: v })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      {columns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name}
                          <span className="ml-1 text-xs text-muted-foreground">({col.type})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={agg.function}
                    onValueChange={(v) => updateAggregation(i, { function: v as AggFunction })}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {aggOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    className="flex-1"
                    placeholder={`${agg.function}_${agg.column}`}
                    value={agg.alias || ''}
                    onChange={(e) => updateAggregation(i, { alias: e.target.value || undefined })}
                  />

                  <Button variant="ghost" size="sm" onClick={() => removeAggregation(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={addAggregation} disabled={columns.length === 0}>
              <Plus className="mr-1 h-3 w-3" />
              Add Aggregation
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
