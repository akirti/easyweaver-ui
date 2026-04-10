import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command';

export interface ColumnComboboxProps {
  columns: { name: string; type?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ColumnCombobox({
  columns,
  value,
  onChange,
  placeholder = 'Column...',
  className,
  disabled,
}: ColumnComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedCol = columns.find((c) => c.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-9 justify-between font-normal px-3 text-sm',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">
            {selectedCol ? selectedCol.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList className="max-h-60">
            <CommandEmpty>No column found.</CommandEmpty>
            {columns.map((col) => (
              <CommandItem
                key={col.name}
                value={col.name}
                onSelect={(v) => {
                  onChange(v);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-1.5 h-3.5 w-3.5 shrink-0',
                    value === col.name ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="truncate">{col.name}</span>
                {col.type && (
                  <span className="ml-1 text-xs text-muted-foreground shrink-0">
                    ({col.type})
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
