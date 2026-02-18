import { Plus, Trash2 } from 'lucide-react';
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

const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'like', label: 'Contains' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' },
];

const NO_VALUE_OPS = ['is_null', 'is_not_null'];

interface Props {
  columns: ColumnInfo[];
  filters: FilterCondition[];
  onChange: (filters: FilterCondition[]) => void;
}

export function FilterBuilder({ columns, filters, onChange }: Props) {
  const addFilter = () => {
    onChange([...filters, { column: columns[0]?.name || '', operator: 'eq', value: '' }]);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<FilterCondition>) => {
    onChange(filters.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  return (
    <div className="space-y-2">
      {filters.map((filter, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select
            value={filter.column}
            onValueChange={(v) => updateFilter(i, { column: v })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col.name} value={col.name}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filter.operator}
            onValueChange={(v) => updateFilter(i, { operator: v as FilterCondition['operator'] })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!NO_VALUE_OPS.includes(filter.operator) && (
            <Input
              className="flex-1"
              placeholder="Value"
              value={String(filter.value ?? '')}
              onChange={(e) => updateFilter(i, { value: e.target.value })}
            />
          )}

          <Button variant="ghost" size="sm" onClick={() => removeFilter(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addFilter} disabled={columns.length === 0}>
        <Plus className="mr-1 h-3 w-3" />
        Add Filter
      </Button>
    </div>
  );
}
