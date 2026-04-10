import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnCombobox } from './ColumnCombobox';
import { getTypeCategory } from '@/lib/column-types';
import type {
  ColumnInfo,
  DerivedColumnSpec,
  DerivedExpressionType,
  DatePartType,
} from '@/types';

interface Props {
  columns: ColumnInfo[];
  derivedColumns: DerivedColumnSpec[];
  onChange: (cols: DerivedColumnSpec[]) => void;
}

const EXPRESSION_TYPES: { value: DerivedExpressionType; label: string }[] = [
  { value: 'concat', label: 'Concatenate' },
  { value: 'math', label: 'Math Expression' },
  { value: 'date_part', label: 'Date Part' },
  { value: 'conditional', label: 'Conditional' },
  { value: 'literal', label: 'Literal Value' },
];

const DATE_PARTS: { value: DatePartType; label: string }[] = [
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Month' },
  { value: 'day', label: 'Day' },
  { value: 'hour', label: 'Hour' },
  { value: 'minute', label: 'Minute' },
  { value: 'second', label: 'Second' },
  { value: 'day_of_week', label: 'Day of Week' },
  { value: 'quarter', label: 'Quarter' },
];

const CONDITION_OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' },
];

function createDefault(): DerivedColumnSpec {
  return { name: '', expression_type: 'concat', columns: [], separator: '' };
}

export function DerivedColumnBuilder({ columns, derivedColumns, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const add = () => {
    onChange([...derivedColumns, createDefault()]);
    setExpanded(derivedColumns.length);
  };

  const remove = (index: number) => {
    onChange(derivedColumns.filter((_, i) => i !== index));
    if (expanded === index) setExpanded(null);
  };

  const update = (index: number, updates: Partial<DerivedColumnSpec>) => {
    onChange(
      derivedColumns.map((d, i) => (i === index ? { ...d, ...updates } : d))
    );
  };

  const changeType = (index: number, type: DerivedExpressionType) => {
    const base: DerivedColumnSpec = { name: derivedColumns[index].name, expression_type: type };
    switch (type) {
      case 'concat':
        onChange(derivedColumns.map((d, i) => i === index ? { ...base, columns: [], separator: '' } : d));
        break;
      case 'math':
        onChange(derivedColumns.map((d, i) => i === index ? { ...base, expression: '' } : d));
        break;
      case 'date_part':
        onChange(derivedColumns.map((d, i) => i === index ? { ...base, source_column: '', part: 'year' } : d));
        break;
      case 'conditional':
        onChange(derivedColumns.map((d, i) => i === index ? { ...base, condition_column: '', condition_operator: 'eq', condition_value: '', then_value: '', else_value: '' } : d));
        break;
      case 'literal':
        onChange(derivedColumns.map((d, i) => i === index ? { ...base, value: '' } : d));
        break;
    }
  };

  const toggleConcatColumn = (index: number, colName: string) => {
    const spec = derivedColumns[index];
    const cols = spec.columns || [];
    if (cols.includes(colName)) {
      update(index, { columns: cols.filter((c) => c !== colName) });
    } else {
      update(index, { columns: [...cols, colName] });
    }
  };

  const numericCols = columns.filter((c) => getTypeCategory(c.type) === 'numeric');
  const datetimeCols = columns.filter((c) => getTypeCategory(c.type) === 'datetime');

  return (
    <div className="space-y-2">
      {derivedColumns.map((spec, i) => (
        <div key={i} className="rounded-md border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs text-primary underline"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              {expanded === i ? 'Collapse' : 'Expand'}
            </button>
            <Badge variant="secondary" className="text-xs">
              {EXPRESSION_TYPES.find((t) => t.value === spec.expression_type)?.label}
            </Badge>
            <span className="flex-1 text-sm font-medium truncate">
              {spec.name || '(unnamed)'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {expanded === i && (
            <div className="space-y-2 pt-1">
              {/* Column name */}
              <div className="flex items-center gap-2">
                <Label className="text-xs w-24 shrink-0">Column Name</Label>
                <Input
                  className="h-7 text-sm"
                  placeholder="new_column"
                  value={spec.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                />
              </div>

              {/* Expression type */}
              <div className="flex items-center gap-2">
                <Label className="text-xs w-24 shrink-0">Type</Label>
                <Select
                  value={spec.expression_type}
                  onValueChange={(v) => changeType(i, v as DerivedExpressionType)}
                >
                  <SelectTrigger className="h-7 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {EXPRESSION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type-specific fields */}
              {spec.expression_type === 'concat' && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-24 shrink-0">Separator</Label>
                    <Input
                      className="h-7 w-24 text-sm"
                      placeholder="e.g. ' ' or '-'"
                      value={spec.separator || ''}
                      onChange={(e) => update(i, { separator: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Columns to concatenate</Label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {columns.map((col) => (
                        <label key={col.name} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <Checkbox
                            checked={(spec.columns || []).includes(col.name)}
                            onCheckedChange={() => toggleConcatColumn(i, col.name)}
                          />
                          {col.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {spec.expression_type === 'math' && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Expression (use {'{column}'} for column references)
                  </Label>
                  <Input
                    className="h-7 text-sm mt-1"
                    placeholder="{price} * {quantity}"
                    value={spec.expression || ''}
                    onChange={(e) => update(i, { expression: e.target.value })}
                  />
                  {numericCols.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {numericCols.map((col) => (
                        <Badge
                          key={col.name}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-accent"
                          onClick={() => {
                            const expr = (spec.expression || '') + `{${col.name}}`;
                            update(i, { expression: expr });
                          }}
                        >
                          {col.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {spec.expression_type === 'date_part' && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-24 shrink-0">Source</Label>
                    <ColumnCombobox
                      columns={datetimeCols.length > 0 ? datetimeCols : columns}
                      value={spec.source_column || ''}
                      onChange={(v) => update(i, { source_column: v })}
                      placeholder="Select column"
                      className="h-7 text-sm flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-24 shrink-0">Part</Label>
                    <Select
                      value={spec.part || 'year'}
                      onValueChange={(v) => update(i, { part: v as DatePartType })}
                    >
                      <SelectTrigger className="h-7 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {DATE_PARTS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {spec.expression_type === 'conditional' && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-24 shrink-0">If Column</Label>
                    <ColumnCombobox
                      columns={columns}
                      value={spec.condition_column || ''}
                      onChange={(v) => update(i, { condition_column: v })}
                      placeholder="Column"
                      className="h-7 flex-1 text-sm"
                    />
                    <Select
                      value={spec.condition_operator || 'eq'}
                      onValueChange={(v) => update(i, { condition_operator: v })}
                    >
                      <SelectTrigger className="h-7 w-24 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {CONDITION_OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {spec.condition_operator !== 'is_null' && spec.condition_operator !== 'is_not_null' && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs w-24 shrink-0">Value</Label>
                      <Input
                        className="h-7 text-sm"
                        value={String(spec.condition_value ?? '')}
                        onChange={(e) => update(i, { condition_value: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-24 shrink-0">Then</Label>
                    <Input
                      className="h-7 text-sm"
                      placeholder="Value if true"
                      value={String(spec.then_value ?? '')}
                      onChange={(e) => update(i, { then_value: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-24 shrink-0">Else</Label>
                    <Input
                      className="h-7 text-sm"
                      placeholder="Value if false"
                      value={String(spec.else_value ?? '')}
                      onChange={(e) => update(i, { else_value: e.target.value })}
                    />
                  </div>
                </>
              )}

              {spec.expression_type === 'literal' && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-24 shrink-0">Value</Label>
                  <Input
                    className="h-7 text-sm"
                    placeholder="Static value"
                    value={String(spec.value ?? '')}
                    onChange={(e) => update(i, { value: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 h-3 w-3" />
        Add Derived Column
      </Button>
    </div>
  );
}
