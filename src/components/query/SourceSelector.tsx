import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSources, useSourceSchema } from '@/queries/use-sources';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

interface Props {
  label: string;
  sourceId: string | null;
  table: string | null;
  columns: string[];
  onSourceChange: (id: string | null) => void;
  onTableChange: (table: string | null) => void;
  onColumnsChange: (columns: string[]) => void;
}

export function SourceSelector({
  label,
  sourceId,
  table,
  columns,
  onSourceChange,
  onTableChange,
  onColumnsChange,
}: Props) {
  const { data: sources } = useSources();
  const { data: schema, isLoading: schemaLoading } = useSourceSchema(sourceId || '');

  const tableSchema = schema?.find((t) => t.name === table);
  const allColumnNames = tableSchema?.columns.map((c) => c.name) || [];

  // Auto-select all columns when a table is picked and columns list is empty
  useEffect(() => {
    if (allColumnNames.length > 0 && columns.length === 0) {
      onColumnsChange(allColumnNames);
    }
  }, [table, allColumnNames.length]);

  const allSelected = columns.length > 0 && columns.length === allColumnNames.length;

  const toggleColumn = (col: string) => {
    if (columns.includes(col)) {
      const next = columns.filter((c) => c !== col);
      // Don't allow deselecting everything — keep at least one
      if (next.length > 0) onColumnsChange(next);
    } else {
      onColumnsChange([...columns, col]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      // Deselect all → keep just the first column
      onColumnsChange([allColumnNames[0]]);
    } else {
      onColumnsChange(allColumnNames);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Label className="text-sm font-semibold">{label}</Label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Connection</Label>
          <Select value={sourceId || ''} onValueChange={(v) => onSourceChange(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select connection" />
            </SelectTrigger>
            <SelectContent position="popper">
              {sources?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.source_type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Table</Label>
          {schemaLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={table || ''} onValueChange={(v) => onTableChange(v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {schema?.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name} (~{t.row_estimate.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {tableSchema && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Columns</Label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-primary underline"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {tableSchema.columns.map((col) => (
              <label
                key={col.name}
                className="flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Checkbox
                  checked={columns.includes(col.name)}
                  onCheckedChange={() => toggleColumn(col.name)}
                />
                <span>{col.name}</span>
                <span className="text-muted-foreground">({col.type})</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
