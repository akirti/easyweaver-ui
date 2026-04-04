import { useState } from 'react';
import { Check, ChevronsUpDown, Database } from 'lucide-react';
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
import type { Source } from '@/types';

interface ConnectionComboboxProps {
  sources: Source[];
  value: string | null;
  onValueChange: (sourceId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ConnectionCombobox({
  sources,
  value,
  onValueChange,
  placeholder = 'Select connection...',
  disabled = false,
}: ConnectionComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedSource = sources.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-9 w-full justify-between text-sm font-normal"
          data-testid="connection-combobox-trigger"
        >
          <span className="flex items-center gap-2 truncate">
            {selectedSource ? (
              <>
                <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {selectedSource.name}
                <span className="text-muted-foreground">({selectedSource.source_type})</span>
              </>
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
            placeholder="Search connections..."
            data-testid="connection-combobox-input"
          />
          <CommandList>
            <CommandEmpty>No connections found</CommandEmpty>
            <CommandGroup>
              {sources.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.name} ${s.source_type}`}
                  onSelect={() => {
                    onValueChange(s.id === value ? null : s.id);
                    setOpen(false);
                  }}
                  data-testid={`connection-option-${s.id}`}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      value === s.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {s.source_type}
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
