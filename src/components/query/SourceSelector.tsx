import { Label } from '@/components/ui/label';
import { useSources, useSourceSchema } from '@/queries/use-sources';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnPicker } from '@/components/query/ColumnPicker';
import { ConnectionCombobox } from '@/components/query/ConnectionCombobox';
import { TableCombobox } from '@/components/query/TableCombobox';
import { useEffect, useState } from 'react';

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
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([]);

  const tableSchema = schema?.find((t) => t.name === table);
  const allColumnNames = tableSchema?.columns.map((c) => c.name) || [];

  // Auto-select all columns when a table is picked and columns list is empty
  useEffect(() => {
    if (allColumnNames.length > 0 && columns.length === 0) {
      onColumnsChange(allColumnNames);
    }
  }, [table, allColumnNames.length]);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Label className="text-sm font-semibold">{label}</Label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Connection</Label>
          <ConnectionCombobox
            sources={sources || []}
            value={sourceId}
            onValueChange={(v) => onSourceChange(v)}
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Table</Label>
          {schemaLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <TableCombobox
              tables={schema || []}
              value={table}
              onValueChange={(v) => onTableChange(v)}
              disabled={!sourceId || schemaLoading}
            />
          )}
        </div>
      </div>

      {tableSchema && (
        <ColumnPicker
          columns={tableSchema.columns}
          selected={columns}
          pinned={pinnedColumns}
          onSelectedChange={onColumnsChange}
          onPinnedChange={setPinnedColumns}
        />
      )}
    </div>
  );
}
