import { useState } from 'react';
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from '@/components/ui/command';
import { useDistinctValues } from '@/queries/use-sources';
import { cn } from '@/lib/utils';

interface Props {
  sourceId: string;
  table: string;
  column: string;
  value: unknown;
  onChange: (v: unknown) => void;
  limit?: number;
}

export function FilterValueSelect({ sourceId, table, column, value, onChange, limit = 500 }: Props) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useDistinctValues(sourceId, table, column, limit, true);

  const items = data?.values ?? [];
  const truncated = data?.truncated ?? false;
  const displayValue = value != null && value !== '' ? String(value) : '';

  return (
    <div className="flex flex-1 items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            size="sm"
            className="flex-1 justify-between font-normal truncate"
          >
            <span className="truncate">
              {displayValue || 'Select value...'}
            </span>
            {isLoading ? (
              <Loader2 className="ml-2 h-3.5 w-3.5 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search values..." />
            <CommandList>
              <CommandEmpty>No values found.</CommandEmpty>
              <CommandGroup>
                {items.map((item) => {
                  const itemStr = String(item ?? '');
                  return (
                    <CommandItem
                      key={itemStr}
                      value={itemStr}
                      onSelect={() => {
                        onChange(item);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-3.5 w-3.5',
                          String(value) === itemStr ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="truncate">{itemStr === '' ? '(empty)' : itemStr}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {truncated && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-t">
                  Showing first {limit} of many values
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {displayValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => onChange('')}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
