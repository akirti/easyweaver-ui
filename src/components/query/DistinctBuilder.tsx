import { X } from 'lucide-react';
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
import type { ColumnInfo, DistinctSpec } from '@/types';

interface Props {
  columns: ColumnInfo[];
  distinct: DistinctSpec | null;
  onChange: (spec: DistinctSpec | null) => void;
}

export function DistinctBuilder({ columns, distinct, onChange }: Props) {
  const enabled = distinct?.enabled ?? false;

  const handleToggle = (on: boolean) => {
    if (on) {
      onChange({ enabled: true, keep: 'first' });
    } else {
      onChange(null);
    }
  };

  const setMode = (mode: 'all' | 'columns') => {
    if (!distinct) return;
    if (mode === 'all') {
      onChange({ ...distinct, columns: undefined });
    } else {
      onChange({ ...distinct, columns: [] });
    }
  };

  const addColumn = (col: string) => {
    if (!distinct || !distinct.columns || distinct.columns.includes(col)) return;
    onChange({ ...distinct, columns: [...distinct.columns, col] });
  };

  const removeColumn = (col: string) => {
    if (!distinct || !distinct.columns) return;
    onChange({ ...distinct, columns: distinct.columns.filter((c) => c !== col) });
  };

  const isColumnMode = distinct?.columns !== undefined;
  const availableCols = columns.filter((c) => !distinct?.columns?.includes(c.name));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={handleToggle} />
        <Label className="text-sm">Remove Duplicates</Label>
      </div>

      {enabled && distinct && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Mode:</Label>
              <Select value={isColumnMode ? 'columns' : 'all'} onValueChange={(v) => setMode(v as 'all' | 'columns')}>
                <SelectTrigger className="h-7 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">All columns</SelectItem>
                  <SelectItem value="columns">Select columns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Keep:</Label>
              <Select value={distinct.keep} onValueChange={(v) => onChange({ ...distinct, keep: v as DistinctSpec['keep'] })}>
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="first">First</SelectItem>
                  <SelectItem value="last">Last</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isColumnMode && (
            <div className="flex flex-wrap gap-1.5">
              {(distinct.columns || []).map((col) => (
                <Badge key={col} variant="secondary" className="gap-1">
                  {col}
                  <button onClick={() => removeColumn(col)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {availableCols.length > 0 && (
                <Select onValueChange={addColumn}>
                  <SelectTrigger className="h-7 w-40 text-xs">
                    <SelectValue placeholder="Add column..." />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {availableCols.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
