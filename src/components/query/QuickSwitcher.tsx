import { useCallback } from 'react';
import { Database, Table } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { Source, TableSchema } from '@/types';

interface QuickSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Source[];
  currentSourceId: string | null;
  onSourceSelect: (sourceId: string) => void;
  tables?: TableSchema[];
  currentTable: string | null;
  onTableSelect: (table: string) => void;
}

export function QuickSwitcher({
  open,
  onOpenChange,
  sources,
  currentSourceId,
  onSourceSelect,
  tables,
  currentTable,
  onTableSelect,
}: QuickSwitcherProps) {
  const handleSourceSelect = useCallback(
    (sourceId: string) => {
      onSourceSelect(sourceId);
      onOpenChange(false);
    },
    [onSourceSelect, onOpenChange]
  );

  const handleTableSelect = useCallback(
    (tableName: string) => {
      onTableSelect(tableName);
      onOpenChange(false);
    },
    [onTableSelect, onOpenChange]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Quick Switcher"
      description="Search and switch between connections and tables"
    >
      <CommandInput
        placeholder="Search connections and tables..."
        data-testid="quick-switcher-input"
      />
      <CommandList data-testid="quick-switcher-command">
        <CommandEmpty>No results found</CommandEmpty>
        <CommandGroup heading="Connections">
          {sources.map((source) => (
            <CommandItem
              key={source.id}
              value={`${source.name} ${source.source_type}`}
              onSelect={() => handleSourceSelect(source.id)}
              data-testid={`source-item-${source.id}`}
            >
              <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                {source.name}{' '}
                <span className="text-muted-foreground">
                  ({source.source_type})
                </span>
              </span>
              {currentSourceId === source.id && (
                <span
                  className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  data-testid={`current-source-${source.id}`}
                >
                  current
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        {tables && tables.length > 0 && (
          <CommandGroup heading="Tables">
            {tables.map((table) => (
              <CommandItem
                key={table.name}
                value={table.name}
                onSelect={() => handleTableSelect(table.name)}
                data-testid={`table-item-${table.name}`}
              >
                <Table className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">
                  {table.name}{' '}
                  <span className="text-muted-foreground">
                    (~{table.row_estimate.toLocaleString()} rows)
                  </span>
                </span>
                {currentTable === table.name && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    current
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
