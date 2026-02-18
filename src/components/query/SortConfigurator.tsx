import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SortSpec, ColumnInfo } from '@/types';

interface Props {
  columns: ColumnInfo[];
  sorts: SortSpec[];
  onChange: (sorts: SortSpec[]) => void;
}

export function SortConfigurator({ columns, sorts, onChange }: Props) {
  const addSort = () => {
    onChange([...sorts, { column: columns[0]?.name || '', direction: 'asc' }]);
  };

  const removeSort = (index: number) => {
    onChange(sorts.filter((_, i) => i !== index));
  };

  const updateSort = (index: number, updates: Partial<SortSpec>) => {
    onChange(sorts.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  return (
    <div className="space-y-2">
      {sorts.map((sort, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select
            value={sort.column}
            onValueChange={(v) => updateSort(i, { column: v })}
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
            value={sort.direction}
            onValueChange={(v) => updateSort(i, { direction: v as 'asc' | 'desc' })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={() => removeSort(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addSort} disabled={columns.length === 0}>
        <Plus className="mr-1 h-3 w-3" />
        Add Sort
      </Button>
    </div>
  );
}
