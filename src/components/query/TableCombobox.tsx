import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TableSchema } from '@/types';

function getSizeColor(rowEstimate: number): string {
  if (rowEstimate < 10_000) return 'bg-green-500';
  if (rowEstimate < 1_000_000) return 'bg-yellow-500';
  return 'bg-red-500';
}

interface TableComboboxProps {
  tables: TableSchema[];
  value: string | null;
  onValueChange: (table: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TableCombobox({
  tables,
  value,
  onValueChange,
  placeholder = 'Select table...',
  disabled = false,
}: TableComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedTable = tables.find((t) => t.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-9 w-full justify-between text-sm font-normal"
          data-testid="table-combobox-trigger"
        >
          <span className="truncate">
            {selectedTable ? (
              <span className="flex items-center gap-2">
                <span
                  className={cn('h-2 w-2 shrink-0 rounded-full', getSizeColor(selectedTable.row_estimate))}
                />
                {selectedTable.name}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command
          filter={(val, search) => {
            if (val.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput
            placeholder="Search tables..."
            data-testid="table-combobox-input"
          />
          <CommandList>
            <CommandEmpty data-testid="table-combobox-empty">
              No tables found
            </CommandEmpty>
            <CommandGroup>
              {tables.map((t) => (
                <CommandItem
                  key={t.name}
                  value={t.name}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? null : currentValue);
                    setOpen(false);
                  }}
                  data-testid={`table-option-${t.name}`}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      value === t.name ? 'opacity-100' : 'opacity-0'
                    )}
                    data-testid={`table-check-${t.name}`}
                  />
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', getSizeColor(t.row_estimate))}
                    data-testid={`table-size-${t.name}`}
                  />
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ~{t.row_estimate.toLocaleString()} rows
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
